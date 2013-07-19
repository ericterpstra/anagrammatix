var async = require('async');
var io;
var gameSocket;

exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    // Host
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostPrepareGame);
    gameSocket.on('hostCountdownFinished', hostStartGame);

    // Player
    gameSocket.on('playerJoinGame', playerJoinGame );
}

// *** HOST ***

function hostCreateNewGame() {
    // Create unique room
    var thisGameId = ( Math.random() * 100000 ) | 0;

    //this.set('role','manager');

    // return room id and socket id
    this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});

    // Join Game room and wait for players
    this.join(thisGameId.toString());
};

function hostPrepareGame(gameId) {
    var sock = this;
    var data = {
        mySocketId : sock.id,
        gameId : gameId
    };
    console.log("All Players Present. Preparing game...");
    io.sockets.in(data.gameId).emit('beginNewGame', data);
}

function hostStartGame(gameId) {
    console.log('Game Started.');
    sendWord(0,gameId);
};

// *** PLAYER ***

// data.gameId, data.playerName
function playerJoinGame(data) {
    console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );
    var sock = this;
    var room = gameSocket.manager.rooms["/" + data.gameId];

    if( room != undefined ){
        data.mySocketId = sock.id;
        sock.join(data.gameId);
        console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);
    } else {
        this.emit('error',{message: "This room does not exist."} );
    }
}


// *** GAME  ***

function sendWord(wordPoolIndex, gameId) {
    var data = getWordData(wordPoolIndex);

    io.sockets.in(data.gameId).emit('newWordData', data);
}

function getWordData(i){
    var words = wordPool[i].words.sort(easyShuffle);
    var decoys = wordPool[i].decoys.sort(easyShuffle).slice(0,5);
    var rnd = Math.floor(Math.random() * 5);
    decoys.splice(rnd, 0, words[1]);

    var wordData = {
        word : words[0],
        answer : words[1],
        list : decoys
    };

    return wordData;
}

function easyShuffle() {return 0.5 - Math.random()};

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