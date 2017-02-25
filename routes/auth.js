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
                    message: `The username exceeded the length of 10 characters. Try Again!`
                });
            }

            //now the username is okay
            //let's remove some malicious things
            u = xss(u);
            //all fine
            //lets now check in the db for the same username with the ip if its available
            var users = db.get().collection('Users');
            users.findOne({ip: ip}, function (err,person) {
                assert.equal(err,null);
                //if the person is found, check the ip address used
                if(person){
                    if(u !== person.username){
                        return res.render('error',{
                            message: 'This is not the ip address of: '+ u
                        });
                    }
                    else{
                        //now the user is verified lets give him the token of success and send him to the chat page
                        var token = jwt.sign({
                            data: person
                        },secret,{
                            expiresIn: 60*60
                        });
                        return res.redirect('/chat/'+token);
                    }
                }
                else{
                    //there is no username with this ip, so no issues lets save this user
                    users.insertOne({username: u, ip: ip}, function (err,done) {
                        assert.equal(err,null);
                        console.log('new user inserted');
                        var token = jwt.sign({
                            data: {
                                username: u,
                                ip: ip
                            }
                        },secret,{
                            expiresIn: 60 * 60
                        });
                        res.redirect('/chat/'+token);
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
    else{
        res.render('error', {
            message: `No username provided. Try Again!`
        });

    }
}

module.exports = {
    login: login
};