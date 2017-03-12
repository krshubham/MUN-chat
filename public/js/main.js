//IP Addresses to use
/*************************************************************************************
* For server usage: http://35.154.38.81/app                                         *
*                                                                                   *
* For localhost usage: http://localhost:9876/app                                    *
*                                                                                   *
* For usage in local network: http://192.168.1.100:9876/app                         *
* This one keeps changing if you change your network or reconnect some other time   *
**************************************************************************************/

var windowFocused = true;
var scrolled = false;
var lastScrollTop = 0;
var messages = document.getElementsByClassName('messages')[0];
var unreadCount = 0;

function handleDownMove(e){
    console.log(e.target);
    $('div.messages').animate({
        scrollTop: messages.scrollHeight
    },1000);
    unreadCount = 0;
}

function setScrolled(e){
    var st = messages.scrollTop;
    if (st > lastScrollTop && ( messages.scrollHeight - st === messages.offsetHeight)){
        scrolled = false;
        var span = $('span#unread-messages');
        span.html('');
        span.css('visibility','hidden');
        unreadCount = 0;
        $('div.fixed-action-btn').css('visibility','hidden');        
    } else {
        scrolled = true;
        $('div.fixed-action-btn').css('visibility','visible');
    }
    lastScrollTop = st;
}

function getCaret(el) { 
    if (el.selectionStart) { 
        return el.selectionStart; 
    } else if (document.selection) { 
        el.focus(); 
        
        var r = document.selection.createRange(); 
        if (r == null) { 
            return 0; 
        } 
        
        var re = el.createTextRange(), 
        rc = re.duplicate(); 
        re.moveToBookmark(r.getBookmark()); 
        rc.setEndPoint('EndToStart', re); 
        
        return rc.text.length; 
    }  
    return 0; 
}

$('textarea').keyup(function (event) {
    if (event.keyCode == 13 && event.shiftKey) {
        var content = this.value;
        var caret = getCaret(this);
        this.value = content.substring(0,caret);
        event.stopPropagation();           
    }else if(event.keyCode == 13)
    {
        $('form').submit();
    }
});
/*Window blur and focus events*/
window.onblur = function () {
    console.log('window blurred');
    windowFocused = false;
};

window.onfocus = function () {
    console.log('window focused');
    windowFocused = true;
};

var socket = io.connect('/app');
var addedCountries = [];


function setTitle(text) {
    var title = document.getElementsByTagName('title')[0];
    title.innerHTML = text;
}

function notifyMe(data) {
    
    
    if (Notification.permission !== "granted")
    Notification.requestPermission();
    else {
        var notification = new Notification('VITCMUN 2017', {
            icon: '/images/small_logo.png',
            body: data.username + ' : ' + data.message
        });
        
        notification.onclick = function () {
            window.focus();
        };
        
    }
    
}

socket.on('connect', function () {
    console.log('connected');
    setTitle('connected | MUN');
    socket.emit('getSession');
});

function sendMessage(e) {
    e.preventDefault();
    var hiddenel = document.querySelector('textarea#message');
    var uname = hiddenel.getAttribute('data-username');
    var uid = hiddenel.getAttribute('data-id');
    var message = document.querySelector('textarea#message').value;
    if (message.match(/^\s*$/g)) {
        Materialize.toast('Blank messages are not allowed', 1500);
        return false;
    }
    //purify
    message = filterXSS(message);
    console.log(message);
    if (!addedCountries.length) {
        Materialize.toast('No countries to send :( Try everyone for sending this message to everybody', 4000);
        return false;
    }
    if (addedCountries.indexOf('everyone') !== -1 && addedCountries.length > 1) {
        Materialize.toast('You have added everyone already. Remove others!', 2000);
        return false;
    }
    $('textarea#message').val('');
    var tmp = document.createElement("DIV");
    tmp.innerHTML = message;
    message = tmp.textContent || tmp.innerText || "";
    socket.emit('newMessage', {
        message: message,
        username: uname,
        userId: uid,
        sendTo: addedCountries
    });
}

socket.on('newMessage', function (data) {
    console.log(data);
    if (windowFocused !== true) {
        var userDetails = document.querySelector('input#user-details').getAttribute('data-username');
        if (!(data.username === userDetails)) {
            playAudio();
            notifyMe(data);
        }
    }
    else {
        //do nothing
    }
    data.message = data.message.replace(/\n/g, "<br />");
    var inhtml = `<br>`;
    var userDetails = document.querySelector('input#user-details').getAttribute('data-username');
    var fhtml = ``;
    if (data.username === userDetails) {
        fhtml = `<div class="bubble-speech bubble-right" style="margin: auto; margin-top: 1em;margin-right: 3em !important;">`;
        data.sendTo.forEach(function (client) {
            console.log(client);
            inhtml += ` <div class="chip">
            ${client}
            </div>`;
        });
        // console.log(inhtml);
    }
    else {
        data.sendTo.forEach(function (client) {
            console.log(client);
            inhtml += ` <div class="chip">
            ${client}
            </div>`;
        });
        fhtml = `<div class="bubble-speech bubble-left">`;
    }
    
    var html = fhtml + `<h6 class="author">
    ${data.username}
    </h6>
    <div class="message">
    ${data.message}
    </div>`
    + inhtml +
    `</div>`;
    $('div.messages').append(html);
    updateScroll();
    function updateScroll(){
        if(!scrolled){
            messages.scrollTop = messages.scrollHeight;        
        }
        else{
            unreadCount++;
            var span = $('span#unread-messages');
            span.html(unreadCount);
            span.css('visibility','visible');
        }
    }   
    
    data = null;
});

var timeout;
function typingStatus(obj) {
    var el = document.querySelector('input#user-details');
    var userName = el.getAttribute('data-username');
    var userId = el.getAttribute('data-id');
    console.log(userName);
    console.log(userId);
    socket.emit('typing', {
        user: userName,
        userId: userId,
        sendTo: addedCountries
    });
}

function removeTyping() {
    $('small#typing-status').html('');
}

socket.on('typing', function (data) {
    if (data) $('small#typing-status').html(data);
    clearTimeout(timeout);
    timeout = setTimeout(removeTyping, 500);
});

function addCountry(e) {
    e.preventDefault();
    var country = e.target.innerHTML;
    if (country === 'Everyone(online)') {
        country = country.toLowerCase();
        country = country.split('(')[0];
    }
    if(country === 'Everyone(except EB)'){
        country = country;
    }
    if(((country === 'chair') || (country === 'vice_chair') || (country === 'director')) && (addedCountries.indexOf('Everyone(except EB)') >= 0)){
        Materialize.toast('You cannot add an EB member now!',2000);
        return false;        
    }
    if(addedCountries.indexOf('Everyone(except EB)') !==-1 && addedCountries.length > 0){
        Materialize.toast('You have added everyone already!', 2000);  
        return false;              
    }
    if (addedCountries.indexOf(country) !== -1) {
        Materialize.toast('The Country is already added', 2000);
        return false;
    }
    if (addedCountries.indexOf('everyone') !== -1 && addedCountries.length > 0) {
        Materialize.toast('You have added everyone already!', 2000);
        return false;
    }
    if ((country === 'everyone') && (addedCountries.length > 0)) {
        addedCountries = [];
        $('div#sending-to').html('');
        addedCountries.push(country);
        var html = `
        <div class="chip">
        ${country}
        <a href="#" data-value="${country}" onclick="removeCountry(this)">
        <i class="close material-icons">close</i>
        </a>
        </div>
        `;
        $('div#sending-to').append(html);
        return false;
    }
    addedCountries.push(country);
    var html = `
    <div class="chip">
    ${country}
    <a href="#" data-value="${country}" onclick="removeCountry(this)">
    <i class="close material-icons">close</i>
    </a>
    </div>
    `;
    $('input.country-val').val('');
    $('div#sending-to').append(html);
}

function removeCountry(obj) {
    var country = obj.getAttribute('data-value');
    var index = addedCountries.indexOf(country);
    if (index > -1) {
        addedCountries.splice(index, 1);
    }
}

socket.on('connectedClient', function (data) {
    if (data.data.length === 1) {
        $('ul#onlineClients').html('');
        $('ul#onlineClients').append('<li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">International Press</li>');
        return false;
    }
    // console.log(data);
    var html = '';
    var userDetails = document.querySelector('input#user-details').getAttribute('data-username');
    data.data.forEach(function (client) {
        if ((client.username === userDetails) || (client.username === 'chair') || (client.username === 'vice_chair') || (client.username === 'director')) {
            //do nothing
        } else {
            var inhtml = `
            <li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">${client.username}</li>
            `;
            html += inhtml;
        }
    });
    $('ul#onlineClients').html('');
    $('ul#onlineClients').append('<li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">International Press</li>');
    $('ul#onlineClients').append(html);
    data.data.forEach(function (client) {
        // console.log(client.username !== userDetails);
        if (((client.username === 'chair') || (client.username === 'vice_chair') || (client.username === 'director')) && (client.username !== userDetails)) {
            $('ul#onlineClients').prepend('<li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">'+client.username+'</li>')
        }
    });
    $('ul#onlineClients').prepend('<li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">Everyone(online)</li>');
    $('ul#onlineClients').prepend('<li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">Everyone(except EB)</li>');    
    
});

socket.on('connClientName', function (data) {
    console.log(data);
    Materialize.toast(data.data.username + ' is online now!', 1500);
});


socket.on('disconnectedClient', function (data) {
    console.log(data);
    if (data.data.length === 1) {
        $('ul#onlineClients').html('');
        $('ul#onlineClients').append('<li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">International Press</li>');        
        return false;
    }
    var html = '';
    var userDetails = document.querySelector('input#user-details').getAttribute('data-username');
    data.data.forEach(function (client) {
        if (client.username === userDetails) {
            console.log('I am here');
            //nothing
        }
        else {
            var inhtml = `
            <li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">${client.username}</li>
            `;
            html += inhtml;
        }
    });
    $('ul#onlineClients').html('');
    $('ul#onlineClients').append('<li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">International Press</li>');
    $('ul#onlineClients').append(html);
    data.data.forEach(function (client) {
        // console.log(client.username !== userDetails);
        if (((client.username === 'chair') || (client.username === 'vice_chair') || (client.username === 'director')) && (client.username !== userDetails)) {
            $('ul#onlineClients').prepend('<li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">'+client.username+'</li>')
        }
    });
    $('ul#onlineClients').prepend('<li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">Everyone(online)</li>');
    $('ul#onlineClients').prepend('<li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">Everyone(except EB)</li>');
    
});

socket.on('disconnClientName', function (data) {
    Materialize.toast(data.name + ' is offline now', 1500);
});

socket.on('getSession', function (data) {
    var country = document.querySelector('input#user-details').getAttribute('data-username');
    setTitle(country + ' | VITCMUN2017');
    var htmlArray = [];
    // console.log(data);
    var userDetails = document.querySelector('input#user-details').getAttribute('data-username');
    data.forEach(function (message) {
        message.message = message.message.replace(/\n/g, "<br />");
        var inhtml = `<br>`;
        var fhtml = ``;
        if (message.username === userDetails) {
            fhtml = `<div class="bubble-speech bubble-right" style="margin: auto; margin-top: 1em;margin-right: 3em !important;">`;
            message.sendTo.forEach(function (client) {
                // console.log(client);
                inhtml += ` <div class="chip" style="font-size: 0.8em;">
                ${client}
                </div>`;
            });
            // console.log(inhtml);
            
        }
        else {
            message.sendTo.forEach(function (client) {
                // console.log(client);
                inhtml += ` <div class="chip" style="font-size: 0.8em;">
                ${client}
                </div>`;
            });
            fhtml = `<div class="bubble-speech bubble-left">`;
        }
        
        var html = fhtml + `<h6 class="author">
        ${message.username}
        </h6>
        <div class="message">
        ${message.message}
        </div>` +
        inhtml + `
        </div>`;
        // console.log(html);
        // $('div.messages').append(html);
        htmlArray.push(html);
    });
    // console.log(htmlArray);
    $('div.messages').html('');
    htmlArray.forEach(function (html) {
        $('div.messages').append(html);
    });
    var messages = document.getElementsByClassName('messages')[0];
    messages.scrollTop = messages.scrollHeight;
    htmlArray = [];
});

var x = document.getElementById("myAudio");

function playAudio() {
    x.play();
}

function pauseAudio() {
    x.pause();
}
