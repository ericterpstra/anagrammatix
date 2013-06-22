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

    var rooms = gameSocket.manager.rooms;

    if( rooms[data.gameId] ){
        var roomClients = io.sockets.clients(data.gameId);

        // Check for a manager and other players
        if( roomClients.length > 0 ){

            //If nobody is in room, emit error
            //If manager is in room, emit waiting...
            //If manager && player 1 in room, emit start game
            //If player but no manager, emit error

            this.join(data.gameId);
        }

    } else {
        this.emit('error',{message: "This room does not exist."} );
    }
}

function validatePlayers(players) {
    //TODO: Use node async lib to get all player roles
}