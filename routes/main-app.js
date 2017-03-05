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
    socket.emit('connectedClient', {
        data: onlineClients
    });
    var database = maindb.get().collection('messages');
    database.find({}).toArray(function (err,docs) {
        socket.emit('getSession',docs);
    });
}


function handlePress(socket, app) {
    var socketId = socket.id;
    var user;
    var token = socket.handshake.headers.referer.split('/')[5];
    try {
        var decoded = jwt.decode(token, secret);
        console.log(decoded);
        decoded.person.username = decoded.person.country;
        user = decoded.person;
        user.socketId = socketId;
        console.log('user in IB');
        console.log(user);
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
        /*get the socket id of the user*/
        var socketId = socket.id;
        /*get the token. Now this returns the token if a user is not the international press
         *The token will be === 'press' which will be further taken care by other methods
         *  */
        var token = socket.handshake.headers.referer.split('/')[4];

        /*If 4th index is press then it is international press trying to login. let the do this*/
        if (token === 'press') {
            pressId = socketId;
            /*Let this method handle all the events for the international press*/
            handlePress(socket, app);
            return;
        }
        else {
            console.log('normal user');
        }
        /*Check if the token is valid or not*/
        try {
            var decoded = jwt.decode(token, secret);
            decoded.person.username = decoded.person.country;
            user = decoded.person;
            /*set the socketId property to the current user*/
            user.socketId = socketId;
            // console.log(user);
        }
        catch (err) {
            console.log(err);
            socket.emit('error', 'Something went wrong');
        }
        /*push all the connected clients in this array for holding all the online clients*/
        onlineClients.push(user);
        console.log('list of online clients');
        console.log(onlineClients);

        /*Tell everyone that a person has joined*/
        app.emit('connectedClient', {
            data: onlineClients
        });
        /*Send the name of the connected client to everyonew*/
        socket.broadcast.emit('connClientName', {
            data: user
        });

        /*Get the messages of the currently connected user*/
        var userDatabase = maindb.get().collection(String(user.username));
        userDatabase.find({}).toArray(function (err, docs) {
            console.log('db docs for ' + user.username + ' are:');
            // console.log(docs);
            socket.emit('getSession', docs);
        });

        /*The collection which stores all the messages, suitable for the international press*/
        var messages = maindb.get().collection('messages');

        /*The new message event
        * @event responsible for delegating all the events after a new message is genarated
        * */
        socket.on('newMessage', function (message) {
            console.log('The new message is: ');
            console.log(message);
            var socketId = socket.id;
            var user;
            var token = socket.handshake.headers.referer.split('/')[4];
            try {
                var decoded = jwt.decode(token, secret);
                decoded.person.username = decoded.person.country;
                user = decoded.person;
                user.socketId = socketId;
            }
            catch (err) {
                console.log(err);
                socket.emit('error', 'Something went wrong');
            }
            message.username = user.username;

            var sendTo = message.sendTo;

            if (sendTo.length === 1 && sendTo.indexOf('everyone') >= 0) {
                app.emit('newMessage', message);
                /*If its for everyone, insert into the db for all*/
                /*
                 * @param client
                 * {
                 *   username: 'username',
                 *   _id: 'some mongo uuid',
                 *   socketId: 'socketio provided id'
                 *  }
                 */
                onlineClients.forEach(function (client) {
                    //noinspection JSAnnotator
                    if (client.username === user.username) {
                        //do nothing
                    }
                    else {
                        // console.log('we have ' + onlineClients.length + ' clients');
                        var database = maindb.get().collection(String(client.username));
                        database.insertOne(message).then(function (cb) {
                            // console.log(cb.ops[0]);
                        })
                            .catch(function (err) {
                                console.log(err);
                            });
                    }
                });
            }
            /*If nobody is specified, send message to everybody*/
            if ((sendTo.length > 0) && (sendTo.indexOf('international press') < 0)) {
                console.log('IP not present');
                socket.broadcast.to(pressId).emit('newMessage', message);
            }
            if ((sendTo.length > 0) && (sendTo.indexOf('international press') >= 0)) {
                socket.broadcast.to(pressId).emit('newMessage', message);
            }
            for (var receiver in sendTo) {
                for (var client in onlineClients) {
                    // console.log(onlineClients[client].username.toLowerCase() + ' : ' + sendTo[receiver].toLowerCase());
                    // console.log(onlineClients[client].username.toLowerCase() === sendTo[receiver].toLowerCase());
                    if (onlineClients[client].username === sendTo[receiver]) {
                        socket.broadcast.to(onlineClients[client].socketId).emit('newMessage', message);
                        socket.emit('newMessage', message);
                    }
                }
            }
            /*Insert into the messages db for the ip*/
            messages.insertOne(message).then(function (callback) {
                // console.log(callback.ops[0]);
            })
                .catch(function (err) {
                    console.log(err);
                });
            /*Insert in the db of the sender*/
            var database = maindb.get().collection(String(message.username));
            database.insertOne(message).then(function (cb) {
                // console.log(cb.ops[0]);
            });

            /*insert into the db of all the recipients*/
            for (var i = 0; i < sendTo.length; i++) {
                var database = maindb.get().collection(String(sendTo[i]));
                database.insertOne(message).then(function (cb) {
                    // console.log(cb.ops[0]);
                })
                    .catch(function (err) {
                        console.log(err);
                    });
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