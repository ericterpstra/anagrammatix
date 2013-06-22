var express = require('express');
var path = require('path');
var app = express();
var agx = require('./agxgame');

app.configure(function() {
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.static(path.join(__dirname,'public')));
});

var server = require('http').createServer(app).listen(8888);
var io = require('socket.io').listen(server);

io.sockets.on('connection', function (socket) {
    console.log('client connected');
    agx.initGame(io, socket);
});


