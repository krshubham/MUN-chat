/**
 * Created by ks on 09/01/17.
 */

var db = require('./helpers/dbhelper');
var maindb = require('../db');
var jwt = require('jsonwebtoken');
const secret = 'R3Dcherrylovesg@@k';
const assert = require('assert');
var xss = require('xss');

exports = module.exports = function (io) {
    var user;
    var app = io.of('/app');

    var onlineClients = [];
    app.on('connection', function (socket) {
        var socketId = socket.id;
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

        var connectedClients = app.server.engine.clients;
        onlineClients.push(user);
        console.log(onlineClients);

        var messages = maindb.get().collection('messages');
        socket.on('newMessage', function (message) {
            var socketId = socket.conn.id;
            console.log(message);
            message.username = user.username;
            message.userId = user._id;
            var sendTo = message.sendTo;
            console.log(sendTo);
            //Insert the message in the db;
            messages.insertOne({message: message}).then(function () {
                console.log('data inserted');
            });
            for (var receiver in sendTo) {
                for (var client in onlineClients) {
                    console.log(sendTo[receiver]);
                    console.log(onlineClients[client].username === sendTo[receiver]);
                    if (onlineClients[client].username === sendTo[receiver]) {
                        socket.broadcast.to(onlineClients[client].socketId).emit('newMessage', message);
                    }
                }
            }
            // app.emit('newMessage', message);
        });

        socket.on('typing', function (data) {
            socket.broadcast.emit('typing', data.user + ' is typing');
        });


        socket.on('disconnect', function () {
            var index = onlineClients.indexOf(socket.id);
            onlineClients.splice(index, 1);
            console.log(onlineClients);
        });
    });

};