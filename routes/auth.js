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
        var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        try {
            assert.notEqual(u, '');

            if (u.length > 10) {
                console.log('username length more than 10 chars');
                return res.render('error', {
                    message: 'The username exceeded the length of 10 characters. Try Again!'
                });
            }

            //now the username is okay
            //let's remove some malicious things
            u = xss(u);
            //all fine
            var users = db.get().collection('Users');
            users.findOne({username: u}, function (err, person) {
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
                    console.log('new user');
                    users.insertOne({username: u}).then(function (callbackData) {
                        var person = callbackData.ops[0];
                        var token = jwt.sign({
                            person: person,
                            expiresIn: 300
                        }, secret);
                        console.log('the new user was inserted');
                        res.redirect('/chat/' + token)
                    })
                        .catch(function (err) {
                            console.log('Error: on line 40 in auth.js');
                            console.log(err);
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
    else{
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