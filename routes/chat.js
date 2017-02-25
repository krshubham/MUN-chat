/**
 * Created by ks on 08/01/17.
 */
var jwt = require('jsonwebtoken');
const secret = 'R3Dcherrylovesg@@k';
const assert = require('assert');
var app = require('../app');
var server = app.server;
var io = require('socket.io')(server);

function init(req,res) {
    var token = req.params.token;
    try{
        assert.notEqual(token, undefined);
        var decoded = jwt.verify(token, secret);
        console.log(decoded);
        //TODO: the chat connection using sockets
        res.render('chat',{
            token: token,
            user: decoded.person
        });

    }
    catch(err){
        console.log(err);
        return res.render('error',{
            message: `${err}`
        });
    }


}

module.exports = {
    init: init
};