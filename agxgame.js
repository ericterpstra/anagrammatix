var io;
var gameSocket;

""" test fork Max
"""
/**
 * This function is called by index.js to initialize a new game instance.
 *
 * @param sio The Socket.IO library
 * @param socket The socket object for the connected client.
 */
exports.initGame = function(sio, socket){
    io = sio;
    gameSocket = socket;
    gameSocket.emit('connected', { message: "You are connected!" });

    // Host Events
    gameSocket.on('hostCreateNewGame', hostCreateNewGame);
    gameSocket.on('hostRoomFull', hostPrepareGame);
    gameSocket.on('hostCountdownFinished', hostStartGame);
    gameSocket.on('hostNextRound', hostNextRound);

    // Player Events
    gameSocket.on('playerJoinGame', playerJoinGame);
    gameSocket.on('playerAnswer', playerAnswer);
    gameSocket.on('playerRestart', playerRestart);
}

/* *******************************
   *                             *
   *       HOST FUNCTIONS        *
   *                             *
   ******************************* */

/**
 * The 'START' button was clicked and 'hostCreateNewGame' event occurred.
 */
function hostCreateNewGame() {
    // Create a unique Socket.IO Room
    var thisGameId = ( Math.random() * 100000 ) | 0;
    // Return the Room ID (gameId) and the socket ID (mySocketId) to the browser client
    this.emit('newGameCreated', {gameId: thisGameId, mySocketId: this.id});

    // Join the Room and wait for the players
    this.join(thisGameId.toString());
};

/*
 * Two players have joined. Alert the host!
 * @param gameId The game ID / room ID
 */
function hostPrepareGame(gameId) {
    var sock = this;
    var data = {
        mySocketId : sock.id,
        gameId : gameId
    };
    //console.log("All Players Present. Preparing game...");
    io.sockets.in(data.gameId).emit('beginNewGame', data);
}

/*
 * The Countdown has finished, and the game begins!
 * @param gameId The game ID / room ID
 */
function hostStartGame(gameId) {
    console.log('Game Started!');
    // Version using word questions
    // sendWord(0,gameId);
    sendQuestion(0,gameId);
};

/**
 * A player answered correctly. Time for the next word.
 * @param data Sent from the client. Contains the current round and gameId (room)
 */
function hostNextRound(data) {
	console.log('Asked for a new round');
    if(data.round < QuestionPool.length ){
    	console.log('Not at the end of the pool, creating a new set of words.')
        // Send a new set of questions back to the host and players.
        sendQuestion(data.round, data.gameId);
    } else {
    	console.log('End of game.')
        // If the current round exceeds the number of questions, send the 'gameOver' event.
        io.sockets.in(data.gameId).emit('gameOver',data);
    }
}


/**
 * A player answered correctly. Time for the next word.
 * @param data Sent from the client. Contains the current round and gameId (room)
 
function hostNextRound(data) {
    console.log('Asked for a new round');
    if(data.round < wordPool.length ){
        console.log('Not at the end of the pool, creating a new set of words.')
        // Send a new set of words back to the host and players.
        sendWord(data.round, data.gameId);
    } else {
        console.log('End of game.')
        // If the current round exceeds the number of words, send the 'gameOver' event.
        io.sockets.in(data.gameId).emit('gameOver',data);
    }
}
*/

/* *****************************
   *                           *
   *     PLAYER FUNCTIONS      *
   *                           *
   ***************************** */

/**
 * A player clicked the 'START GAME' button.
 * Attempt to connect them to the room that matches
 * the gameId entered by the player.
 * @param data Contains data entered via player's input - playerName and gameId.
 */
function playerJoinGame(data) {
    //console.log('Player ' + data.playerName + 'attempting to join game: ' + data.gameId );

    // A reference to the player's Socket.IO socket object
    var sock = this;

    // Look up the room ID in the Socket.IO manager object.
    var room = gameSocket.manager.rooms["/" + data.gameId];

    // If the room exists...
    if( room != undefined ){
        // attach the socket id to the data object.
        data.mySocketId = sock.id;

        // Join the room
        sock.join(data.gameId);

        //console.log('Player ' + data.playerName + ' joining game: ' + data.gameId );

        // Emit an event notifying the clients that the player has joined the room.
        io.sockets.in(data.gameId).emit('playerJoinedRoom', data);

    } else {
        // Otherwise, send an error message back to the player.
        this.emit('error',{message: "This room does not exist."} );
    }
}

/**
 * A player has tapped a word in the word list.
 * @param data gameId
 */
function playerAnswer(data) {
    console.log('Player ID: ' + data.playerId + ' answered a question with: ' + data.answer);

    // The player's answer is attached to the data object.  \
    // Emit an event with the answer so it can be checked by the 'Host'
    io.sockets.in(data.gameId).emit('hostCheckAnswer', data);
}

/**
 * The game is over, and a player has clicked a button to restart the game.
 * @param data
 */
function playerRestart(data) {
    // console.log('Player: ' + data.playerName + ' ready for new game.');

    // Emit the player's data back to the clients in the game room.
    data.playerId = this.id;
    io.sockets.in(data.gameId).emit('playerJoinedRoom',data);
}

/*
==================
TOUCHI'S QUESTIONS
==================
*/

/**
 * Send the question to the host, and a list of responses for the players.
 *
 * @param QuestionPoolIndex !WIP!
 * @param gameId The room identifier
 */
function sendQuestion(QuestionPoolIndex, gameId) {
    var data = getQuestionData(QuestionPoolIndex);
    io.sockets.in(data.gameId).emit('newQuestionData', data);
}

/*
 * This function does all the work of getting a multiple answer question from the pile
 * and organizing the data to be sent back to the clients.
 *
 * @param i The index of the QuestionPool.
 * @returns {{round: *, word: *, answer: *, list: Array}}
*/

function getQuestionData(i){
    // Gets the question
    var question = QuestionPool[i].question;

    // Gets the response
    var answer = QuestionPool[i].answer;

    // Randomize the order of the decoys.
    var decoys = shuffle(QuestionPool[i].decoys);

    // Pick a random spot in the decoy list to put the correct answer
    var rnd = Math.floor(Math.random() * 4);
    decoys.splice(rnd, 0, answer[0]);

    // Package the words into a single object.
    var Questiondata = {
        round: i,
        question : question[0],   // Displayed Question
        answer : answer[0], // Correct Answer
        list : decoys      // Word list for player (decoys and answer)
    };
    console.log('getQuestionData is fine');
    for (var i=0; i< 5; i++){
        console.log(Questiondata[i])
        }
    return Questiondata;

}

/*
=====================================
FIND WORD WITH SAME LETTERS QUESTIONS
=====================================
*/

/**
 * Get a word for the host, and a list of words for the player.
 *
 * @param wordPoolIndex
 * @param gameId The room identifier
 
function sendWord(wordPoolIndex, gameId) {
    var data = getWordData(wordPoolIndex);
    io.sockets.in(data.gameId).emit('newWordData', data);
}
*/

/**
 * This function does all the work of getting a new words from the pile
 * and organizing the data to be sent back to the clients.
 *
 * @param i The index of the wordPool.
 * @returns {{round: *, word: *, answer: *, list: Array}}
function getWordData(i){
    // Randomize the order of the available words.
    // The first element in the randomized array will be displayed on the host screen.
    // The second element will be hidden in a list of decoys as the correct answer
    var words = shuffle(wordPool[i].words);

    // Randomize the order of the decoy words and choose the first 5
    var decoys = shuffle(wordPool[i].decoys).slice(0,5);

    // Pick a random spot in the decoy list to put the correct answer
    var rnd = Math.floor(Math.random() * 5);
    decoys.splice(rnd, 0, words[1]);

    // Package the words into a single object.
    var wordData = {
        round: i,
        word : words[0],   // Displayed Word
        answer : words[1], // Correct Answer
        list : decoys      // Word list for player (decoys and answer)
    };

    return wordData;
}
*/

/*
 * Javascript implementation of Fisher-Yates shuffle algorithm
 * http://stackoverflow.com/questions/2450954/how-to-randomize-a-javascript-array
 */
function shuffle(array) {
    var currentIndex = array.length;
    var temporaryValue;
    var randomIndex;

    // While there remain elements to shuffle...
    while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }

    return array;
}

/**
 * WordPool used by NewWord, getWordData functions 

 * Each element in the array provides data for a single round in the game.
 *
 * In each round, two random "words" are chosen as the host word and the correct answer.
 * Five random "decoys" are chosen to make up the list displayed to the player.
 * The correct answer is randomly inserted into the list of chosen decoys.
 *
 * @type {Array}
 */

/*
* Previous pool of words 
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
        "decoys" : [ "pots","laps","step","lets","pint","atop","tapa","rapt","swap","yaps" ]
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
*/

/**
 * Each element in the array provides data for a single round in the game.
 *
 * In each round is composed of 3 elements: a question (string), the right answer, and 4 wrong answers 
 *
 */
var QuestionPool = [
    {
        "question"  : [ "Quel est le temps de gestation d'un éléphant" ],
        "answer" : [ "22 mois" ],
        "decoys" : [ "12 mois","3 mois","18 mois","40 mois" ]
    },

    {
        "question"  : [ "How old is Antoine Aymer" ],
        "answer" : [ "37 years old" ],
        "decoys" : [ "22 years old","30 years old","35 years old","72 years old" ]
    },
    
    {
        "question"  : [ "Quel est le nom du dernier acteur qui a joué James Bond" ],
        "answer" : [ "Daniel Craig" ],
        "decoys" : [ "Pierce Brossnan","Sean Connery","Robert John","Warren Buffet" ]
    }
    

]