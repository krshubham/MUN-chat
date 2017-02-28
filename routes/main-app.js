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
    var app = io.of('/app');

    var onlineClients = [];
    app.on('connection', function (socket) {
        var connectedClients = app.server.engine.clients;
        for (var clientId in connectedClients) {
            onlineClients.push(clientId);
        }

        var messages = maindb.get().collection('messages');
        socket.on('newMessage', function (message) {
            var socketId = socket.conn.id;
            console.log(message);
            messages.insertOne({message: message}).then(function () {
                console.log('data inserted');
            });
            app.emit('newMessage',message);
        });


        socket.on('disconnect', function () {
            var address = socket.handshake.address;
        });
    });

};