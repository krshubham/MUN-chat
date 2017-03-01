//IP Addresses to use
/*************************************************************************************
* For server usage: http://35.154.38.81/app                                         *
*                                                                                   *
* For localhost usage: http://localhost:9876/app                                    *
*                                                                                   *
* For usage in local network: http://192.168.1.100:9876/app                         *
* This one keeps changing if you change your network or reconnect some other time   *
**************************************************************************************/

var socket = io.connect('/app');

function setTitle(text) {
    var title = document.getElementsByTagName('title')[0];
    title.innerHTML = text;
}

function notifyMe(data) {
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
        
    }

socket.on('connect', function () {
    console.log('connected');
    setTitle('connected | MUN')
});

function sendMessage(e) {
    e.preventDefault();
    var hiddenel = e.target.getElementsByTagName('input')[0];
    var uname = hiddenel.getAttribute('data-username');
    var uid = hiddenel.getAttribute('data-id');
    var message = e.target.querySelector('input#message').value;
    //purify
    message = filterXSS(message);
    $('input#message').val('');
    console.log(message);
    socket.emit('newMessage', {
        message: message,
        username: uname,
        userId: uid
        //TODO: add an array containing the client to whom message is to be sent
    });
}

socket.on('newMessage', function (data) {
    var colors = ['primary', 'success', 'danger', 'info', 'warning'];
    var rand = Math.floor(Math.random() * 5);
    var rcolorval = colors[rand];
    var html = '<div class="card card-outline-' + rcolorval + ' mb-3 text-justify message-card">' +
    '<div class="card-block">' +
    '<h3 class="card-title message-card-title">' + data.username + '</h3>' +
    '<blockquote class="card-blockquote">' +
    data.message +
    '</blockquote>' +
    '</div>' +
    '</div>';
    $('div.messages').append(html);
    var messages = document.getElementsByClassName('messages')[0];
    messages.scrollTop = messages.scrollHeight;
    // Notification support
    document.addEventListener('DOMContentLoaded', function () {
        if (!Notification) {
            alert('Desktop notifications not available in your browser. Try Chromium.'); 
            return;
        }
        
        if (Notification.permission !== "granted") Notification.requestPermission();
        if(!window.hasFocus()){
            notifyMe(data.message);
        }
    });
});

function typingStatus(obj) {
    var el = document.querySelector('input#user-details');
    var userName = el.getAttribute('data-username');
    var userId = el.getAttribute('data-id');
    console.log(userName);
    console.log(userId);
    socket.emit('typing', {
        user: userName,
        userId: userId
    });
}

function removeTyping() {
    $('small#typing-status').html('');
}

socket.on('typing', function (data) {
    if (data) $('small#typing-status').html(data);
    setTimeout(removeTyping,1500);
});









