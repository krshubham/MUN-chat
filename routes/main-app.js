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
                                        message: `please try logging in after some time`
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
        socket.on('publicmsg', function (data) {
            if (data.token) {
                try {
                    var decoded = jwt.verify(data.token, secret);
                    if (decoded) {
                        /*
                         * decoded[object Object]
                         * { data:
                         *   { _id: 'mymongoid',
                         *   username: 'something',
                         *   ip: 'somecoolIP' },
                         * iat: 1484019275,
                         * exp: 1484022875
                         * }
                         */
                        var messages = maindb.get().collection('messages');
                        messages.insertOne({
                            data: xss(data.data),
                            username: xss(decoded.data.username)
                        }).then(function (data) {
                            assert.notEqual(data, null);
                        })
                            .catch(function (err) {
                                console.log(err);
                            });
                        socket.emit('pubmsg', {
                            data: data.data,
                            username: decoded.data.username
                        });
                        socket.broadcast.emit('pubmsg', {
                            data: data.data,
                            username: decoded.data.username
                        });
                    }
                }
                catch (err) {
                    socket.emit('jwterror', {
                        message: `Please Login again!`
                    });
                }
            }
        });

        socket.on('getData', function (data) {
            if (data.token) {
                try {
                    var decoded = jwt.verify(data.token, secret);
                    if (decoded) {
                        var messages = maindb.get().collection('messages');
                        var onlineUsers = maindb.get().collection('online');
                        messages.find({}).toArray(function (err, docs) {
                            assert.equal(err, null);
                            onlineUsers.find({}).toArray(function (err, people) {
                                console.log(people);
                                assert.equal(err, null);
                                socket.emit('printLastSession', {
                                    data: docs,
                                    users: people
                                });
                            });
                        });
                    }
                }
                catch (err) {
                    console.log('line 60 main-app err with jwt verify');
                    console.log(err);
                }
            }
            else {
                return;
            }
        });
        socket.on('privatemsg',function(data){
            console.log(data);
        });
//TODO: write the logic for removing a user frmo online list while disconnecting
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