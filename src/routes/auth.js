import assert from 'assert';
import validator from 'validator';
import xss from 'xss';
import db from '../db';
import * as jwt from 'jsonwebtoken';

const secret = 'somecoolsecret';


function login(req, res) {
    console.log('here in login')
    if (req && req.body) {
        const u = req.body.username;
        const p = req.body.password
        const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        try {
            assert.notEqual(u, '');
            //now the username is okay
            //let's remove some malicious things

            u = xss(u);
            p = xss(p);

            var unsc = db.get().collection('unsc');
            // var disec = db.get().collection('disec');
            // var unhrc = db.get().collection('unhrc');
            // var tll = db.get().collection('tll');
            // var osce = db.get().collection('osce');
            // var iaea = db.get().collection('iaea');
            unsc.findOne({country: u, id:p},(err, person) => {
                console.log('person');
                console.log(person);
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
            username: 'international press',
            country: 'international press'
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

export default {
    login,
    pressLogin
};