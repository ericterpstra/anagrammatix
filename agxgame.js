var async = require('async');
var io;
var gameSocket;

exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });
    gameSocket.on('createNewGame', newGameCreated );
    gameSocket.on('joinGame', joinGame );
    gameSocket.on('gameCountdownFinished', startGame);
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
// Need to know which room to send to.
    //Store all relavant game data on master client and master client socket.
    sendWord(0);

};
function sendWord(wordPoolIndex, gameRoomId) {
}

var wordPool = [
    {
        "words"  : [ "sale","seal","ales","leas" ],
        "decoys" : [ "lead","lamp","seed","eels","lean","cels","lyse","sloe","tels","self" ]
    },

    {
        "words"  : [ "item","time","mite","emit" ],
        "decoys" : [ "neat","team","omit","tame","mate","idem","mile","lime","tire","exit" ]
    },

    {
        "words"  : [ "spat","past","pats","taps" ],
        "decoys" : [ "pots","apts","step","lets","pint","atop","tapa","rapt","swap","yaps" ]
    },

    {
        "words"  : [ "nest","sent","nets","tens" ],
        "decoys" : [ "tend","went","lent","teen","neat","ante","tone","newt","vent","elan" ]
    },

    {
        "words"  : [ "pale","leap","plea","peal" ],
        "decoys" : [ "sale","pail","play","lips","slip","pile","pleb","pled","help","lope" ]
    },

    {
        "words"  : [ "races","cares","scare","acres" ],
        "decoys" : [ "crass","scary","seeds","score","screw","cager","clear","recap","trace","cadre" ]
    },

    {
        "words"  : [ "bowel","elbow","below","beowl" ],
        "decoys" : [ "bowed","bower","robed","probe","roble","bowls","blows","brawl","bylaw","ebola" ]
    },

    {
        "words"  : [ "dates","stead","sated","adset" ],
        "decoys" : [ "seats","diety","seeds","today","sited","dotes","tides","duets","deist","diets" ]
    },

    {
        "words"  : [ "spear","parse","reaps","pares" ],
        "decoys" : [ "ramps","tarps","strep","spore","repos","peris","strap","perms","ropes","super" ]
    },

    {
        "words"  : [ "stone","tones","steno","onset" ],
        "decoys" : [ "snout","tongs","stent","tense","terns","santo","stony","toons","snort","stint" ]
    }
]