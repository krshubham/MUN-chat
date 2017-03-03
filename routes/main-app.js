/**
 * Created by ks on 09/01/17.
 */

var db = require('./helpers/dbhelper');
var maindb = require('../db');
var jwt = require('jsonwebtoken');
const secret = 'R3Dcherrylovesg@@k';
const assert = require('assert');
var xss = require('xss');

var onlineClients = [];
var pressId;
function showAllChats(socket, app) {
    socket.on('newMessage', function (message) {
        console.log(message);
        var socketId = socket.id;
        var user;
        var token = socket.handshake.headers.referer.split('/')[5];
        try {
            var decoded = jwt.decode(token, secret);
            user = decoded.person;
            user.socketId = socketId;
        }
        catch (err) {
            console.log(err);
            socket.emit('error', 'Something went wrong');
        }
        message.username = user.username;
        console.log(message);
        var sendTo = message.sendTo;
        /*If nobody is specified, send message to everybody*/
        if (sendTo.length === 0) {
            app.emit('newMessage', message);
        }
        for (var receiver in sendTo) {
            for (var client in onlineClients) {
                console.log(onlineClients[client].username.toLowerCase() + ' : ' + sendTo[receiver].toLowerCase());
                console.log(onlineClients[client].username.toLowerCase() === sendTo[receiver].toLowerCase());
                if (onlineClients[client].username.toLowerCase() === sendTo[receiver].toLowerCase()) {
                    socket.broadcast.to(onlineClients[client].socketId).emit('newMessage', message);
                    socket.emit('newMessage', message);
                }
            }
        }
    });
}


function handlePress(socket, app) {
    var socketId = socket.id;
    var token = socket.handshake.headers.referer.split('/')[5];
    try {
        var decoded = jwt.decode(token, secret);
        user = decoded.person;
        user.socketId = socketId;
        console.log('user in IB');
        if (user.username === 'international press') {
            showAllChats(socket, app);
        }
        else {
            socket.emit('error', {
                message: 'You are not allowed to view this page'
            });
        }
    }
    catch (err) {
        console.log(err);
        socket.emit('error', 'Something went wrong');
    }
}

exports = module.exports = function (io) {
    var user;
    var app = io.of('/app');

    app.on('connection', function (socket) {
        var socketId = socket.id;
        var token = socket.handshake.headers.referer.split('/')[4];
        if (token === 'press') {
            pressId = socketId;
            handlePress(socket, app);
            return;
        }
        else {
            console.log('normal user');
        }
        try {
            var decoded = jwt.decode(token, secret);
            user = decoded.person;
            user.socketId = socketId;
            console.log('user is');
            console.log(user);
        }
        catch (err) {
            console.log(err);
            socket.emit('error', 'Something went wrong');
        }

        var connectedClients = app.server.engine.clients;
        onlineClients.push(user);
        console.log(onlineClients);

        /*Tell everyone that a person has joined*/
        app.emit('connectedClient', {
            data: onlineClients
        });

        var messages = maindb.get().collection('messages');
        socket.on('newMessage', function (message) {
            console.log(message);
            var socketId = socket.id;
            var user;
            var token = socket.handshake.headers.referer.split('/')[4];
            try {
                var decoded = jwt.decode(token, secret);
                user = decoded.person;
                user.socketId = socketId;
            }
            catch (err) {
                console.log(err);
                socket.emit('error', 'Something went wrong');
            }
            message.username = user.username;
            console.log(message);
            var sendTo = message.sendTo;
            //Insert the message in the db;
            messages.insertOne({message: message}).then(function (callback) {
                console.log(`The data was inserted into the db`);
                console.log(callback.ops[0]);
            });
            /*If nobody is specified, send message to everybody*/
            if (sendTo.length === 0) {
                app.emit('newMessage', message);
            }
            var flag = false;
            for (var receiver in sendTo) {
                for (var client in onlineClients) {
                    console.log(onlineClients[client].username.toLowerCase() + ' : ' + sendTo[receiver].toLowerCase());
                    console.log(onlineClients[client].username.toLowerCase() === sendTo[receiver].toLowerCase());
                    if (onlineClients[client].username.toLowerCase() === sendTo[receiver].toLowerCase()) {
                        socket.broadcast.to(onlineClients[client].socketId).emit('newMessage', message);
                        socket.emit('newMessage', message);
                    }
                    else if(onlineClients[client].socketId === pressId && flag){
                        /*Send to the international press*/
                        socket.broadcast.to(pressId).emit('newMessage', message);
                        flag = false;
                    }
                }
            }
        });

        socket.on('typing', function (data) {
            var sendTo = data.sendTo;
            for (var receiver in sendTo) {
                for (var client in onlineClients) {
                    if (onlineClients[client].username === sendTo[receiver]) {
                        socket.broadcast.to(onlineClients[client].socketId).emit('typing', data.user + ' is typing');
                    }
                }
            }
        });


        socket.on('disconnect', function () {
            console.log(socket.id);
            for (var i = 0; i < onlineClients.length; i++) {
                if (onlineClients[i].socketId === socket.id) {
                    socket.broadcast.emit('disconnClientName', {
                        name: onlineClients[i].username
                    });
                    onlineClients.splice(i, 1);
                }
            }
            console.log(onlineClients);
            socket.broadcast.emit('disconnectedClient', {
                data: onlineClients
            });
        });
    });

};