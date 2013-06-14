var express = require('express');
var path = require('path');
var app = express();

app.configure(function() {
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.static(path.join(__dirname,'public')));
});

var server = require('http').createServer(app).listen(8888);
var io = require('socket.io').listen(server);
var sock;

io.sockets.on('connection', function (socket) {
    console.log('client connected');
    sock = socket;
    socket.emit('connected', { message: "You are connected!" });

    socket.on('createNewGame', function(socket) {
        // Create unique namespace
        // return namespace id
        // wait for players in namespace
        newGameCreated();
    });
});

function newGameCreated() {
    sock.emit('newGameCreated', {gameId: '12345'});
}
