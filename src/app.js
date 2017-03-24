import express from 'express';
import assert from 'assert';
import http from 'http';
import bodyParser from 'body-parser';
import path from 'path';
import mustacheExpress from 'mustache-express';
import socket from 'socket.io';
import auth from './routes/auth';
import morgan from 'morgan';
import db from './db';
import chat from './routes/chat';
import mainApp from './routes/main-app';
import press from './routes/press';

const connString = 'mongodb://localhost:27017/fun';
let app = express();
const server = app.server = http.Server(app);
const io = socket(server);

db.connect(connString, (err) => {
    assert.equal(err,null)
    console.log('connected to the db');
})

app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static(path.join(__dirname, '../public')));
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', path.join(__dirname, '../views'));
app.use('/press', press);


mainApp(io);

app.get('/', function (req, res) {
    res.render('index', {
        title: 'Welcome'
    });
});

app.post('/auth/login', auth.login);
app.post('/auth/press', auth.pressLogin);
app.get('/chat/:token', chat.init);
app.get('/chat/press/:token',chat.press);

server.listen(Number(9876), () => {
    console.log(`Server running at port 9876`);
});

export default {
    app,
    server
};