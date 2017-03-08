//IP Addresses to use
/*************************************************************************************
 * For server usage: http://35.154.38.81/app                                         *
 *                                                                                   *
 * For localhost usage: http://localhost:9876/app                                    *
 *                                                                                   *
 * For usage in local network: http://192.168.1.100:9876/app                         *
 * This one keeps changing if you change your network or reconnect some other time   *
 **************************************************************************************/

var windowFocused;
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


if (addedCountries.length) {
    var list = addedCountries.split(',');
    list.forEach(function (country) {
        var html = `
        <div class="chip">
            ${country}
            <a href="#" data-value="${country}" onclick="removeCountry(this)">
                <i class="close material-icons">close</i>
            </a>
        </div>
    `;
        $('div#sending-to').append(html);
    });
    addedCountries = addedCountries.split(',');
}
else {
    addedCountries = [];
}

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
            body: data
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
    var hiddenel = e.target.getElementsByTagName('input')[0];
    var uname = hiddenel.getAttribute('data-username');
    var uid = hiddenel.getAttribute('data-id');
    var message = e.target.querySelector('input#message').value;
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
    $('input#message').val('');
    socket.emit('newMessage', {
        message: message,
        username: uname,
        userId: uid,
        sendTo: addedCountries
    });
}

socket.on('newMessage', function (data) {
    console.log(data);
    var inhtml = ``;
    var userDetails = document.querySelector('input#user-details').getAttribute('data-username');
    var fhtml = ``;
    data.sendTo.forEach(function (client) {
            console.log(client);
            inhtml += ` <div class="chip">
            ${client}
            </div>`;
        });
    if (data.username === userDetails) {
        fhtml = `<div class="bubble-speech bubble-right" style="margin: auto; margin-top: 1em;margin-right: 3em !important;">`;
    }
    else {
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
    var messages = document.getElementsByClassName('messages')[0];
    messages.scrollTop = messages.scrollHeight;
    if (windowFocused !== true) {
        var userDetails = document.querySelector('input#user-details').getAttribute('data-username');
        if (!(data.username === userDetails)) {
            playAudio();
            notifyMe(data.message);
        }
    }
    else {
        //do nothing
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
    if (addedCountries.indexOf(country) !== -1) {
        Materialize.toast('The Country is already added', 2000);
        return false;
    }
    if (addedCountries.indexOf('everyone') !== -1 && addedCountries.length > 0) {
        Materialize.toast('You have added everyone already. Remove others!', 2000);
        return false;
    }
    if((country === 'everyone') && (addedCountries.length > 0)){
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
    console.log(data);
    var html = '';
    var userDetails = document.querySelector('input#user-details').getAttribute('data-username');
    data.data.forEach(function (client) {
        var inhtml = `
         <li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">${client.username}</li>
        `;
        html += inhtml;
        $('ul#onlineClients').html('');
        $('ul#onlineClients').html('<li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">Everyone(online)</li>');
        $('ul#onlineClients').append(html);
    });

});

socket.on('connClientName', function (data) {
    console.log(data);
    Materialize.toast(data.data.username + ' is online now!', 1500);
});


socket.on('disconnectedClient', function (data) {
    console.log(data);
    var html = '';
    data.data.forEach(function (client) {
        var inhtml = `
         <li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">${client.username}</li>
        `;
        html += inhtml;
    });
    $('ul#onlineClients').html('');
    $('ul#onlineClients').html('<li class="collection-item" onclick="addCountry(event)" style="cursor: pointer;">Everyone(online)</li>');
    $('ul#onlineClients').append(html);
});

socket.on('disconnClientName', function (data) {
    Materialize.toast(data.name + ' is offline now', 1500);
});

socket.on('getSession', function (data) {
    var htmlArray = [];
    console.log(data);
    var userDetails = document.querySelector('input#user-details').getAttribute('data-username');
    data.forEach(function (message) {
        var inhtml = `<br>`;
        var fhtml = ``;
        if (message.username === userDetails) {
            fhtml = `<div class="bubble-speech bubble-right" style="margin: auto; margin-top: 1em;margin-right: 3em !important;">`;
            message.sendTo.forEach(function (client) {
                console.log(client);
                inhtml += ` <div class="chip" style="font-size: 0.8em;">
            ${client}
            </div>`;
            });
            console.log(inhtml);

        }
        else {
            message.sendTo.forEach(function (client) {
                console.log(client);
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
        console.log(html);
        // $('div.messages').append(html);
        htmlArray.push(html);
    });
    console.log(htmlArray);
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

socket.on('refresh', function () {
    window.location.reload();
});