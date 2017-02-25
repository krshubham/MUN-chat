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

function setTitle(text){
    var title = document.getElementsByTagName('title')[0];
    title.innerHTML = text;
}

function getMessage(e) {
    e.preventDefault();
    var message = e.target.getElementsByTagName('input')[0].value;
    var username = e.target.getElementsByTagName('input')[1].value;
    console.log(message,username);
    message.trim();
    if(message.match(/^\s*$/gi)){
        Materialize.toast('Blank message not allowed',2000);
        $('#chatmsg').val('');
        return false;
    }
    if(username.length && !username.match(/^\s*$/gi)){
        socket.emit('privatemsg',{
            data: filterXSS(message),
            token: filterXSS(location.pathname.split('/')[2])
        });
    }
    else{
        socket.emit('publicmsg', {
        data: filterXSS(message),
        token: filterXSS(location.pathname.split('/')[2])
    });
    }
    $('#chatmsg').val('');
    $('#privmsg').val('');
}

function printMessage(data){
    var html = `<div class="card white-text black">
            <h3>Message: ${data.data}</h3><br>
            <strong>By: ${data.username}</strong>          
    </div>`;
    $('div.messages').append(html);
    var messages = document.getElementsByClassName('messages')[0];
    messages.scrollTop = messages.scrollHeight;
}

function insertOnlineUser(person){
    var html = `
                <div class="card black" id="${person._id}">
                <strong>Username: <span class="white-text">${person.username}</span></strong>
    `;
    var onlinediv = document.getElementById('online');
    $('div.online').append(html);
    onlinediv.scrollTop = onlinediv.scrollHeight;
    Materialize.toast('User connected',2000);
}

socket.on('pubmsg', function (data) {
    printMessage(data);
});

socket.on("disconnect", function (data) {

});

socket.on("connect", function () {
    setTitle('connected | Chat');
    socket.emit('getData',{
        token: location.pathname.split('/')[2]
    });
});

socket.on('printLastSession', function(result){
    var messages = result.data;
    var onlineUsers = result.users;
    if(messages.length){
        messages.forEach(function(message){
            printMessage(message);
        });
    }
    if(onlineUsers.length){
        console.log(onlineUsers);
        onlineUsers.forEach(function (user) {
            insertOnlineUser(user);
        });
    }
});

socket.on('jwterror', function (data) {
    Materialize.toast(data.message,3000);
});

socket.on('fatalerr', function (data) {
    console.log(data);
    Materialize.toast('Please login again',3000);
});

socket.on('user connected', function (data) {
    insertOnlineUser(data.user);
});



