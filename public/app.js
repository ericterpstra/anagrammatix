;
jQuery(function($){    
    'use strict';

    var IO = {
        init: function() {
            IO.socket = io.connect('http://localhost');
            IO.bindEvents();
        },

        bindEvents : function() {
            // Both
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('error', IO.error );
            IO.socket.on('newWordData', IO.onNewWordData);
            IO.socket.on('gameOver', IO.gameOver);

            // host
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);

            // Player
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );

        },

        onConnected : function(data) {
            App.mySocketId = IO.socket.socket.sessionid;
            console.log(data.message);
        },

        onNewGameCreated : function(data) {
            App.hostGameInit(data);
        },

        playerJoinedRoom : function(data) {
            if(App.myRole === 'host' ){
                App.hostUpdateWaitingScreen(data);
            }

            if(App.myRole === 'player' && IO.socket.socket.sessionid === data.mySocketId ){
                // Update player screen
                App.playerUpdateWaitingScreen(data);
            }
        },

        beginNewGame : function(data) {
            if(App.myRole === 'host' ){
                App.hostGameCountdown();
            }

            if(App.myRole === 'player' ){
                App.playerGetReady(data);
            }
        },

        onNewWordData : function(data) {
            App.currentRound = data.round;

            if(App.myRole === 'host' ){
                App.hostNewWord(data);
            }

            if(App.myRole === 'player' ){
                App.playerNewWord(data);
            }
        },

        hostCheckAnswer : function(data) {
            if(App.myRole === 'host') {
                App.hostCheckAnswer(data);
            }
        },

        gameOver : function(data) {
            if(App.myRole === 'host' ){
                App.hostEndGame(data);
            }

            if(App.myRole === 'player' ){
                App.playerEndGame(data);
            }
        },

        error : function(data) {
            alert(data.message);
        }

    };

    var App = {

        gameId: 0,

        myRole: '',   // 'player' or 'host'

        mySocketId: '',

        currentRound: 0,

        playerData: {
            hostSocketId: '',
            myName: ''
        },

        hostData: {
            players : [],
            isNewGame : false,
            numPlayersInRoom: 0,
            currentCorrectAnswer: ''
        },

        init: function () {
            App.cacheElements();
            App.bindEvents();
            $('.bigtext').bigtext();
        },

        cacheElements: function () {
            App.$doc = $(document);

            // Sections
            App.$gameArea = $('#gameArea');
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$hostGame = $('#host-game-template').html();

            // Buttons
            App.$btnCreate = $('#btnCreateGame');
            App.$btnJoin = $('#btnJoinGame');
        },

        bindEvents: function () {
            App.$btnCreate.on('click', App.onCreateClick);
            App.$btnJoin.on('click', App.onJoinClick);
            App.$doc.on('click','#btnStart',App.onPlayerStartClick);
            App.$doc.on('click','.btnAnswer',App.onPlayerAnswerClick);
            App.$doc.on('click','#btnPlayerRestart', App.onPlayerRestart);
        },

        /* *************************************
         *         UI Event Handlers           *
         * *********************************** */

        onCreateClick: function () {
            console.log('Clicked "Create A Game"');
            IO.socket.emit('hostCreateNewGame');
        },

        onJoinClick: function () {
            console.log('Clicked "Join A Game"');
            App.$gameArea.html(App.$templateJoinGame);

        },

        onPlayerStartClick: function() {
            console.log('Player clicked "Start"');
            var data = {
                gameId : +($('#inputGameId').val()),
                playerName : $('#inputPlayerName').val() || 'anon'
            };

            IO.socket.emit('playerJoinGame', data);
            App.myRole = 'player';
            App.myName = data.playerName;
        },

        onPlayerAnswerClick: function(e) {
            console.log('Clicked Answer Button');
            var $btn = $(this);
            var answer = $btn.val();
            var data = {
                gameId: App.gameId,
                playerId: App.mySocketId,
                answer: answer,
                round: App.currentRound
            }
            IO.socket.emit('playerAnswer',data);
        },

        onPlayerRestart : function() {
            var data = {
                gameId : App.gameId,
                playerName : App.playerData.myName
            }
            IO.socket.emit('playerRestart',data);
            App.currentRound = 0;
            $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

            // *** HOST ***

        hostGameInit: function (data) {
            App.gameId = data.gameId;
            App.mySocketId = data.mySocketId;
            App.myRole = 'host';
            App.numPlayersInRoom = 0;

            App.hostDisplayNewGameScreen();
            console.log("Game started with ID: " + App.gameId + ' by host: ' + App.mySocketId);
        },

        hostDisplayNewGameScreen : function() {
            App.$gameArea.html(App.$templateNewGame);
            $('#spanNewGameCode').text(App.gameId);
        },

        hostUpdateWaitingScreen: function(data) {
            if ( App.hostData.isNewGame ) {
                App.hostDisplayNewGameScreen();
            }
            // Update host screen
            $('#playersWaiting')
                .append('<p/>')
                .text('Player ' + data.playerName + ' joined the game.');
            App.hostData.players.push(data);
            App.hostData.numPlayersInRoom += 1;

            if (App.hostData.numPlayersInRoom === 2) {
                console.log('Room is full. Almost ready!');
                IO.socket.emit('hostRoomFull',App.gameId);
            }
        },

        hostGameCountdown : function() {
            App.$gameArea.html(App.$hostGame);

            var $secondsLeft = $('#hostWord');

            App.countDown( $secondsLeft, 5, function(){
                IO.socket.emit('hostCountdownFinished', App.gameId);
            });

            $('#player1Score')
                .find('.playerName')
                .html(App.hostData.players[0].playerName);

            $('#player2Score')
                .find('.playerName')
                .html(App.hostData.players[1].playerName);

            $('#player1Score').find('.score').attr('id',App.hostData.players[0].mySocketId);
            $('#player2Score').find('.score').attr('id',App.hostData.players[1].mySocketId);
        },

        hostNewWord : function(data) {
            $('#hostWord').html('<h2>' + data.word + '</h2>');
            App.hostData.currentCorrectAnswer = data.answer;
            App.hostData.currentRound = data.round;
        },

        hostCheckAnswer : function(data) {
            if (data.round === App.currentRound){
                var $pScore = $('#' + data.playerId);

                // Advance player's score
                if( App.hostData.currentCorrectAnswer === data.answer ) {
                    $pScore.text( +$pScore.text() + 5 );

                    // Advance the round
                    App.currentRound += 1;
                    var data = {
                        gameId : App.gameId,
                        round : App.currentRound
                    }
                    IO.socket.emit('hostNextRound',data);
                } else {
                    $pScore.text( +$pScore.text() - 3 );
                }
            }
        },

        hostEndGame : function(data) {
            var $p1 = $('#player1Score');
            var p1Score = +$p1.find('.score').text();
            var p1Name = $p1.find('.playerName').text();

            var $p2 = $('#player2Score');
            var p2Score = +$p2.find('.score').text();
            var p2Name = $p2.find('.playerName').text();

            var winner = (p1Score < p2Score) ? p2Name : p1Name;

            $('#gameArea').html( $('<h1/>').text(winner + ' Wins!!') );
            App.hostData.numPlayersInRoom = 0;
            App.hostData.isNewGame = true;
        },

        hostRestartGame : function(data) {
            App.$gameArea.html(App.$templateNewGame);
            $('#spanNewGameCode').text(App.gameId);
        },

            // *** PLAYER ***

        playerUpdateWaitingScreen : function(data) {
            App.myRole = 'player';
            App.gameId = data.gameId;

            $('#playerWaitingMessage')
                .append('<p/>')
                .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');
        },

        playerGetReady : function(hostData) {
            App.playerData.hostSocketId = hostData.mySocketId;
            $('#gameArea').html('<h4>Get Ready</h4>');
        },

        playerNewWord : function(data) {
            var $list = $('<ul/>').attr('id','ulAnswers');

            $.each(data.list, function(){
                $list                                //  <ul> </ul>
                    .append( $('<li/>')              //  <ul> <li> </li> </ul>
                        .append( $('<button/>')      //  <ul> <li> <button> </button> </li> </ul>
                            .addClass('btnAnswer')   //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                            .val(this)               //  <ul> <li> <button class='btnAnswer' value='word'> </button> </li> </ul>
                            .html(this)              //  <ul> <li> <button class='btnAnswer' value='word'>word</button> </li> </ul>
                        )
                    )
            });

            $('#gameArea').html($list);
        },

        playerEndGame : function() {
            $('#gameArea').html(
                $('<div>')
                    .append('<h3>Game Over!</h3>')
                    .append('<button>Start Again</button>').attr('id','btnPlayerRestart')
            );
        },

           // *** MISC / UTIL ***

        countDown : function( $el, startTime, callback) {

            $el.text(startTime);

            console.log('Starting Countdown...');
            var timer = setInterval(countItDown,1000);

            function countItDown(){
                startTime -= 1
                $el.text(startTime);
                if( startTime <= 0 ){
                    console.log('Countdown Finished.');
                    clearInterval(timer);
                    callback();
                    return;
                }
            }

        }

    };

    IO.init();
    App.init();

}($));
