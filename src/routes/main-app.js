/**
 * Created by ks on 09/01/17.
 */

import maindb from '../db';
import * as jwt from 'jsonwebtoken';
const secret = 'somecoolsecret';
import assert from 'assert';
import xss from 'xss';

let onlineClients = [];
let pressId;
function showAllChats(socket, app, token) {
    socket.emit('connectedClient', {
        data: onlineClients
    });
    const database = maindb.get().collection('messages');
    database.find({}).toArray(function (err, docs) {
        socket.emit('getSession', docs);
    });

    /*The new message event
     * @event responsible for delegating all the events after a new message is genarated
     * */
    socket.on('newMessage',(message) => {
        message.message = xss(message.message);
        const messages = maindb.get().collection('messages');
        console.log('The new message is: ');
        console.log(message);
        const socketId = socket.id;
        let user;
        const token = socket.handshake.headers.referer.split('/')[5];
        try {
            const decoded = jwt.decode(token, secret);
            decoded.person.username = decoded.person.country;
            user = decoded.person;
            user.socketId = socketId;
        }
        catch (err) {
            console.log(err);
            socket.emit('error', 'Something went wrong');
        }
        message.username = user.username;

        let sendTo = message.sendTo;

        if (sendTo.length === 1 && sendTo.indexOf('everyone') === 0) {
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
            onlineClients.forEach((client) => {
                //noinspection JSAnnotator
                if (client.username === user.username) {
                    //do nothing
                }
                else {
                    // console.log('we have ' + onlineClients.length + ' clients');
                    const database = maindb.get().collection(String(client.username));
                    database.insertOne(message).then((cb) => {
                        // console.log(cb.ops[0]);
                    })
                        .catch(function (err) {
                            console.log(err);
                        });
                }
            });
        }
        /*/!*If nobody is specified, send message to everybody*!/
         if ((sendTo.length > 0) && (sendTo.indexOf('international press') < 0)) {
         console.log('IP not present');
         socket.broadcast.to(pressId).emit('newMessage', message);
         }
         if ((sendTo.length > 0) && (sendTo.indexOf('international press') >= 0)) {
         socket.broadcast.to(pressId).emit('newMessage', message);
         }*/
        if (!(sendTo.length === 1 && sendTo.indexOf('everyone') === 0)) {
            for (let receiver in sendTo) {
                for (let client in onlineClients) {
                    // console.log(onlineClients[client].username.toLowerCase() + ' : ' + sendTo[receiver].toLowerCase());
                    // console.log(onlineClients[client].username.toLowerCase() === sendTo[receiver].toLowerCase());
                    if (onlineClients[client].username === sendTo[receiver]) {
                        socket.broadcast.to(onlineClients[client].socketId).emit('newMessage', message);
                    }
                }
            }
            socket.emit('newMessage', message);
        }
        /*Insert into the messages db for the ip*/
        messages.insertOne(message).then((callback) => {
            // console.log(callback.ops[0]);
        })
            .catch(function (err) {
                console.log(err);
            });
        /*Insert in the db of the sender*/
        let database = maindb.get().collection(String(message.username));
        database.insertOne(message).then((cb) => {
            // console.log(cb.ops[0]);
        });

        /*insert into the db of all the recipients*/
        for (let i = 0; i < sendTo.length; i++) {
            let database = maindb.get().collection(String(sendTo[i]));
            database.insertOne(message).then((cb) => {
                // console.log(cb.ops[0]);
            })
                .catch(function (err) {
                    console.log(err);
                });
        }
    });

}


function handlePress(socket, app) {
    const socketId = socket.id;
    let user;
    const token = socket.handshake.headers.referer.split('/')[5];
    try {
        const decoded = jwt.decode(token, secret);
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

export default (io) => {
    let user;
    let app = io.of('/app');

    app.on('connection', (socket) => {
        /*get the socket id of the user*/
        const socketId = socket.id;
        /*get the token. Now this returns the token if a user is not the international press
         *The token will be === 'press' which will be further taken care by other methods
         *  */
        const token = socket.handshake.headers.referer.split('/')[4];

        /*If 4th index is press then it is international press trying to login. let the do this*/
        if (token === 'press') {
            pressId = socketId;
            /*Let this method handle all the events for the international press*/
            handlePress(socket, app, token);
            return;
        }
        else {
            console.log('normal user');
        }
        /*Check if the token is valid or not*/
        try {
            const decoded = jwt.decode(token, secret);
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
        const userDatabase = maindb.get().collection(String(user.username));
        userDatabase.find({}).toArray( (err, docs) => {
            console.log('db docs for ' + user.username + ' are:');
            // console.log(docs);
            socket.emit('getSession', docs);
        });

        /*The collection which stores all the messages, suitable for the international press*/
        const messages = maindb.get().collection('messages');

        /*The new message event
         * @event responsible for delegating all the events after a new message is genarated
         * */
        socket.on('newMessage', function (message) {
            message.message = xss(message.message);
            console.log('The new message is: ');
            console.log(message);
            const socketId = socket.id;
            let user;
            const token = socket.handshake.headers.referer.split('/')[4];
            try {
                const decoded = jwt.decode(token, secret);
                decoded.person.username = decoded.person.country;
                user = decoded.person;
                user.socketId = socketId;
            }
            catch (err) {
                console.log(err);
                socket.emit('error', 'Something went wrong');
            }
            message.username = user.username;
            let sendTo = message.sendTo;

            if (sendTo.length === 1 && sendTo.indexOf('everyone') === 0) {
                app.emit('newMessage', message);
                /*If its for everyone, insert into the db for all*/
                /*
                 * @param
                 * {
                 *   username: 'username',
                 *   _id: 'some mongo uuid',
                 *   socketId: 'socketio provided id'
                 *  }
                 */
                onlineClients.forEach((client) => {
                    //noinspection JSAnnotator
                    if (client.username === user.username) {
                        //do nothing
                    }
                    else {
                        // console.log('we have ' + onlineClients.length + ' clients');
                        let database = maindb.get().collection(String(client.username));
                        database.insertOne(message).then(function (cb) {
                            // console.log(cb.ops[0]);
                        })
                            .catch(function (err) {
                                console.log(err);
                            });
                    }
                });
            }
            else if(sendTo.length === 1 && sendTo.indexOf('Everyone(except EB)') === 0){
                onlineClients.forEach(function(client){
                    if((client.country === 'director') || (client.country === 'chair') || (client.country === 'vice_chair')){

                    }
                    else{
                        socket.broadcast.to(client.socketId).emit('newMessage',message);
                    }
                });
            }
            if (!(sendTo.length === 1 && sendTo.indexOf('everyone') === 0)) {
                for (let receiver in sendTo) {
                    for (let client in onlineClients) {
                        // console.log(onlineClients[client].username.toLowerCase() + ' : ' + sendTo[receiver].toLowerCase());
                        // console.log(onlineClients[client].username.toLowerCase() === sendTo[receiver].toLowerCase());
                        if (onlineClients[client].username === sendTo[receiver]) {
                            socket.broadcast.to(onlineClients[client].socketId).emit('newMessage', message);
                        }
                    }
                }
                socket.emit('newMessage', message);
            }
            /*Insert into the messages db for the ip*/
            messages.insertOne(message).then((callback) => {
                // console.log(callback.ops[0]);
            })
                .catch(function (err) {
                    console.log(err);
                });
            /*Insert in the db of the sender*/
            let database = maindb.get().collection(String(message.username));
            database.insertOne(message).then((cb) => {
                // console.log(cb.ops[0]);
            });

            /*insert into the db of all the recipients*/
            for (let i = 0; i < sendTo.length; i++) {
                let database = maindb.get().collection(String(sendTo[i]));
                database.insertOne(message).then(function (cb) {
                    // console.log(cb.ops[0]);
                })
                    .catch(function (err) {
                        console.log(err);
                    });
            }
        });

        socket.on('typing',(data) => {
            let sendTo = data.sendTo;
            if(sendTo.length === 1 && sendTo.indexOf('everyone') === 0){
                onlineClients.forEach(function(client){
                    socket.broadcast.to(client.socketId).emit('typing', data.user + ' is typing');
                });
                return;
            }
            for (let receiver in sendTo) {
                for (let client in onlineClients) {
                    if (onlineClients[client].username === sendTo[receiver]) {
                        socket.broadcast.to(onlineClients[client].socketId).emit('typing', data.user + ' is typing');
                    }
                }
            }
        });


        socket.on('disconnect', () => {
            console.log(socket.id);
            for (let i = 0; i < onlineClients.length; i++) {
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