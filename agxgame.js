var async = require('async');
var io;
var gameSocket;

exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });
    gameSocket.on('createNewGame', newGameCreated );
    gameSocket.on('joinGame', joinGame )
}

function newGameCreated() {
    // Create unique room
    var thisGameId = ( Math.random() * 100000 ) | 0;

    this.set('role','manager');

    // return room id
    this.emit('newGameCreated', {gameId: thisGameId});

    // wait for players in room
    this.join(thisGameId.toString());
};

function joinGame(data) {
    console.log('Player ' + data.name + 'attempting to join game: ' + data.gameId );
    var sock = this;
    var rooms = gameSocket.manager.rooms;
    var room = rooms["/" + data.gameId];
    sock.set('role','player');

    if( room != undefined ){
        var roomClients = io.sockets.clients(data.gameId);

        // Check for a manager and other players
        if( roomClients.length > 0 ){
            var roles = [];

            async.forEach( roomClients, function(client, callback){
               client.get('role',function(err, roleName){
                   if(err) return callback(err);
                   roles.push(roleName);
                   console.log("Found " + roleName);
                   callback();
               });
            },

            // This callback runs when all the room client's roles have been collected.
            function(err){

                if( roles.indexOf('manager') > -1 ) {
                    sock.join(data.gameId);

                    console.log('Player ' + data.name + ' joining game: ' + data.gameId );

                    if( roomClients.length == 1 ) {

                        // Wait!
                        console.log("Master and Player 1 present. Waiting for Player 2...")
                        io.sockets.in(data.gameId).emit('player1Joined', data);

                    } else if (roomClients.length == 2 && roles.indexOf('player') > -1 ) {

                        // Start!
                        console.log("All Players Present. Starting game...");
                        io.sockets.in(data.gameId).emit('beginNewGame');

                        startGame();

                    } else {

                        // Problem!
                        console.log(roomClients.length + " clients in a room!!");
                        sock.emit('error',{message: "Something is wrong here..."});

                    }

                }

            });

        } else {
            //If nobody is in room, emit error
            sock.emit('error',{message: "This room is empty. Please leave!"});
        }

    } else {
        this.emit('error',{message: "This room does not exist."} );
    }
}

function startGame() {
    console.log('Game Started.');
};
