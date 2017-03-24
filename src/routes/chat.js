/**
 * Created by ks on 08/01/17.
 */
import * as jwt from 'jsonwebtoken';
import assert from 'assert';
import app from '../app';
import server from '../app';
const io = require('socket.io')(server);
const secret = 'somecoolsecret';

function init(req, res) {
    const token = req.params.token;
    try {
        assert.notEqual(token, undefined);
        const decoded = jwt.verify(token, secret);
        console.log(decoded);
        //TODO: the chat connection using sockets
        res.render('chat', {
            token: token,
            user: decoded.person
        });

    }
    catch(err) {
        console.log(err);
        return res.render('error', {
            message: `${err}`
        });
    }


}

function press(req,res) {
    const token = req.params.token;
    try {
        assert.notEqual(token, undefined);
        const decoded = jwt.verify(token, secret);
        console.log(decoded);
        if (!(decoded.person.username === 'international press')) {
            return res.json({
                status: 403,
                message: 'Unauthorised login attempt'
            });
        }
        res.render('press_chat', {
            token: token,
            user: decoded.person
        });
    }
    catch (err) {
        console.log(err);
        return res.render('error', {
            message: `${err}`
        });
    }
}

export default {
    init,
    press
};