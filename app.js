var express = require('express');
var app = express();
var server = require('http').Server(app);
var bodyParser = require('body-parser');
var path = require('path');
var mustacheExpress = require('mustache-express');
var io = require('socket.io')(server);
var moment = require('moment');
var auth = require('./routes/auth');
var morgan = require('morgan');
var db = require('./db');
var chat = require('./routes/chat');
var mainApp = require('./routes/main-app');
var Agenda = require('agenda');
var connString = 'mongodb://localhost:27017/agenda';

var agenda = new Agenda({db: {address: connString}});

//Cron job to delete chats every day
agenda.define('delete old messages', function(job, done){
    var messages = db.get().collection('messages');
    messages.remove({}).then(function(){
        done();
    })
    .catch(function(err){
        console.log(err);
    });
});

agenda.on('ready', function(){
    agenda.every('24 hours', 'delete old messages');
    agenda.start();
});
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.engine('html', mustacheExpress());
app.set('view engine', 'html');
app.set('views', path.join(__dirname, 'views'));

mainApp(io);
//db connection
const url = 'mongodb://localhost:27017/fun';
db.connect(url, function (err) {
    if(err){
        console.log(err);
    }
});

app.get('/', function (req, res) {
    res.render('index', {
        title: 'Welcome'
    });
});

app.post('/auth/login',auth.login);
app.get('/chat/:token', chat.init);
server.listen(9876);
