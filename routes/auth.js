var express = require('express');
var assert = require('assert');
var validator = require('validator');
var xss = require('xss');
var db = require('../db');
var jwt = require('jsonwebtoken');
const secret = 'R3Dcherrylovesg@@k';
var app
function login(req, res) {
    if (req && req.body) {
        var u = req.body.username;
        var p = req.body.password
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        try {
            assert.notEqual(u, '');
            //now the username is okay
            //let's remove some malicious things

            u = xss(u);

            var unsc = db.get().collection('unsc');
            // var disec = db.get().collection('disec');
            // var unhrc = db.get().collection('unhrc');
            // var tll = db.get().collection('tll');
            // var osce = db.get().collection('osce');
            // var iaea = db.get().collection('iaea');

            unsc.findOne({country: u}, function (err, person) {
                assert.equal(err, null);
                var token = jwt.sign({
                    person: person,
                    expiresIn: 300
                }, secret);
                if (person) {
                    console.log(person);
                    res.redirect('/chat/' + token);
                }
                else {
                    res.json({
                        message: "Wrong details provided, Please Try again",
                        status: 403
                    });
                }
            });
        }
        catch (err) {
            res.render('error', {
                message: `${err}`
            });

        }
    }
    else {
        res.render('error', {
            message: `No username provided. Try Again!`
        });

    }
}

function pressLogin(req, res) {
    var username = req.body.username,
        password = req.body.password;
    if (username === 'international press' && password === 'shubham') {
        var person = {
            username: 'international press'
        };
        var token = jwt.sign({
            person: person,
            expiresIn: 300
        }, secret);
        res.redirect('/chat/press/' + token);
    }
    else {
        res.json({
            status: 403,
            message: 'Unauthorised attempt!. Forbidden'
        })
    }
}

module.exports = {
    login: login,
    pressLogin: pressLogin
};