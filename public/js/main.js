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
/*Window blur and focus events*/
window.onblur = function () {
    windowFocused = false;
};

window.onfocus = function () {
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

/*function notifyMe(data) {
 if (Notification.permission !== "granted")
 Notification.requestPermission();
 else {
 var notification = new Notification('MUN Chat', {
 icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
 body: data
 });

 notification.onclick = function () {
 window.focus();
 };

 }

 }*/

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
    /*if (!windowFocused) {
     notifyMe(data.message);
     }*/
    var userDetails = document.querySelector('input#user-details').getAttribute('data-username');
    if (data.username === userDetails) {
        var inhtml = `<br>`;
        data.sendTo.forEach(function (client) {
            console.log(client);
            inhtml += ` <div class="chip">
            ${client}
            </div>`;
        });
        console.log(inhtml);
    }
    else {
        inhtml = '';
    }
    var html = `
        <div class="row">
                        <div class="col s12 m6 offset-m1 offset-s1">
                            <div class="card blue-grey darken-1 z-depth-2">
                                <div class="card-content white-text">
                                    <span class="card-title">${data.username}</span>
                                    <p>
                                       ${data.message}
                                    </p>`
        + inhtml +
        `</div>
                            </div>
                        </div>
                    </div>
    `;
    $('div.messages').append(html);
    var messages = document.getElementsByClassName('messages')[0];
    messages.scrollTop = messages.scrollHeight;
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

$(document).ready(function () {
    $('input.autocomplete').autocomplete({
        data: {
            "Apple": null,
            "India": null,
            "Italy": null,
            "Microsoft": null,
            "Google": 'http://placehold.it/250x250'
        },
        limit: 5, // The max amount of results that can be shown at once. Default: Infinity.
    });
});


function addCountry(e) {
    e.preventDefault();
    var country = e.target.innerHTML;
    if (country.value === '' || country.match(/^\s*$/g))
        return false;
    if (addedCountries.indexOf(country) !== -1) {
        Materialize.toast('The Country is already added', 2000);
        return false;
    }
    if (addedCountries.indexOf('everyone') !== -1 && addedCountries.length > 0) {
        Materialize.toast('You have added everyone already. Remove others!', 2000);
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
    data.data.forEach(function (client) {
        var inhtml = `
         <li class="collection-item" onclick="addCountry(event)">${client.username}</li>
        `;
        html += inhtml;
        $('ul#onlineClients').html('');
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
         <li class="collection-item">${client.username}</li>
        `;
        html += inhtml;
        $('ul#onlineClients').html('');
        $('ul#onlineClients').append(html);
    });
});

socket.on('disconnClientName', function (data) {
    Materialize.toast(data.name + ' is offline now', 1500);
});

socket.on('getSession', function (data) {
    console.log(data);
    var userDetails = document.querySelector('input#user-details').getAttribute('data-username');
    data.forEach(function (message) {
        var inhtml = `<br>`;
        if (message.username === userDetails) {
            message.sendTo.forEach(function (client) {
                console.log(client);
                inhtml += ` <div class="chip">
            ${client}
            </div>`;
            });
            console.log(inhtml);

        }
        else {
            inhtml = ``;
        }

        var html = `
        <div class="row">
                        <div class="col s12 m6 offset-m1 offset-s1">
                            <div class="card blue-grey darken-1 z-depth-2">
                                <div class="card-content white-text">
                                    <span class="card-title">${message.username}</span>
                                    <p>
                                       ${message.message}
                                    </p>`
            + inhtml +
            `</div>
                            </div>
                        </div>
                    </div>
    `;
        $('div.messages').append(html);
    });
});