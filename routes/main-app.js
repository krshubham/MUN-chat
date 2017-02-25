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

    app.on('connection', function (socket) {
        var users = maindb.get().collection('Users');
        if (socket) {
            users.findOne({ip: socket.handshake.address})
                .then(function (person) {
                    if (person) {
                        delete person._id;

                        var onlineUsers = maindb.get().collection('online');
                        var sameuser = onlineUsers.find(person);
                        sameuser.forEach(function (user) {
                            onlineUsers.remove(user).then(function () {
                                //nothing to do for now
                            })
                                .catch(function (err) {
                                    socket.emit('fatalerr', {
                                        message: 'please try logging in after some time'
                                    });
                                    console.log(err);
                                });
                        });
                        onlineUsers.insertOne(person).then(function () {
                            console.log('online user inserted');
                            socket.broadcast.emit('user connected', {
                                user: person
                            });
                        })
                            .catch(function (err) {
                                socket.emit('fatalerr', {
                                    message: 'Please try to log in after some time'
                                });
                                console.log(err);
                            });
                    }
                })
                .catch(function (err) {
                    console.log(err);
                });
        }
        socket.on('disconnect', function () {
            var address = socket.handshake.address;
            var onlineUsers = maindb.get().collection('online');
            onlineUsers.remove({ip: address}).then(function () {
                console.log('user disconnected and removed from the database');
            })
                .catch(function (err) {
                    socket.emit('fatalerr',{
                        message: 'Please try to login after some time'
                    });
                    console.log(err);
                })
        });
    });

};