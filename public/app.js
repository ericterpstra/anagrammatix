;
jQuery(function($){    
    'use strict';

    var IO = {
        init: function() {
            IO.socket = io.connect('http://localhost');
            IO.bindEvents();
        },

        bindEvents : function() {
            IO.socket.on('connected', IO.onConnected );
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );
            IO.socket.on('beginNewGame', IO.beginNewGame );
            IO.socket.on('newWordData', IO.onNewWordData);
            IO.socket.on('hostCheckAnswer', IO.hostCheckAnswer);
            IO.socket.on('gameOver', IO.gameOver);
            IO.socket.on('error', IO.error );
        },

        onConnected : function(data) {
            App.mySocketId = IO.socket.socket.sessionid;
            console.log(data.message);
        },

        onNewGameCreated : function(data) {
            App.Host.gameInit(data);
        },

        playerJoinedRoom : function(data) {
            App[App.myRole].updateWaitingScreen(data);
        },

        beginNewGame : function(data) {
            App[App.myRole].gameCountdown(data);
        },

        onNewWordData : function(data) {
            App.currentRound = data.round;
            App[App.myRole].newWord(data);
        },

        hostCheckAnswer : function(data) {
            if(App.myRole === 'Host') {
                App.Host.checkAnswer(data);
            }
        },

        gameOver : function(data) {
            App[App.myRole].endGame(data);
        },

        error : function(data) {
            alert(data.message);
        }

    };

    var App = {

        // Keep track of the gameId, which is really
        // the ID of the Socket.IO Room used for the players and host to communicate
        gameId: 0,

        myRole: '',   // 'Player' or 'Host'

        mySocketId: '',

        currentRound: 0,

        /* *************************************
         *                Setup                *
         * *********************************** */

         init: function () {
            App.cacheElements();
            App.showInitScreen();
            App.bindEvents();
        },

        cacheElements: function () {
            App.$doc = $(document);

            // Templates
            App.$gameArea = $('#gameArea');
            App.$templateIntroScreen = $('#intro-screen-template').html();
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$hostGame = $('#host-game-template').html();
        },

        bindEvents: function () {
            // Host
            App.$doc.on('click', '#btnCreateGame', App.Host.onCreateClick);

            // Player
            App.$doc.on('click', '#btnJoinGame', App.Player.onJoinClick);
            App.$doc.on('click', '#btnStart',App.Player.onPlayerStartClick);
            App.$doc.on('click', '.btnAnswer',App.Player.onPlayerAnswerClick);
            App.$doc.on('click', '#btnPlayerRestart', App.Player.onPlayerRestart);
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

        showInitScreen: function() {
            App.$gameArea.html(App.$templateIntroScreen);
            App.doTextFit('.title');
        },

        // *** HOST ***
        Host : {
            players : [],

            isNewGame : false,

            numPlayersInRoom: 0,

            currentCorrectAnswer: '',

            onCreateClick: function () {
                console.log('Clicked "Create A Game"');
                IO.socket.emit('hostCreateNewGame');
            },

            gameInit: function (data) {
                App.gameId = data.gameId;
                App.mySocketId = data.mySocketId;
                App.myRole = 'Host';
                App.Host.numPlayersInRoom = 0;

                App.Host.displayNewGameScreen();
                console.log("Game started with ID: " + App.gameId + ' by host: ' + App.mySocketId);
            },

            displayNewGameScreen : function() {
                App.$gameArea.html(App.$templateNewGame);
                $('#gameURL').text(window.location.href);
                $('#spanNewGameCode').text(App.gameId);
            },

            updateWaitingScreen: function(data) {
                if ( App.Host.isNewGame ) {
                    App.Host.displayNewGameScreen();
                }
                // Update host screen
                $('#playersWaiting')
                    .append('<p/>')
                    .text('Player ' + data.playerName + ' joined the game.');
                App.Host.players.push(data);
                App.Host.numPlayersInRoom += 1;

                if (App.Host.numPlayersInRoom === 2) {
                    console.log('Room is full. Almost ready!');
                    IO.socket.emit('hostRoomFull',App.gameId);
                }
            },

            gameCountdown : function() {
                App.$gameArea.html(App.$hostGame);
                App.doTextFit('#hostWord');

                var $secondsLeft = $('#hostWord');

                App.countDown( $secondsLeft, 5, function(){
                    IO.socket.emit('hostCountdownFinished', App.gameId);
                });

                $('#player1Score')
                    .find('.playerName')
                    .html(App.Host.players[0].playerName);

                $('#player2Score')
                    .find('.playerName')
                    .html(App.Host.players[1].playerName);

                $('#player1Score').find('.score').attr('id',App.Host.players[0].mySocketId);
                $('#player2Score').find('.score').attr('id',App.Host.players[1].mySocketId);
            },

            newWord : function(data) {
                $('#hostWord').text(data.word);
                App.doTextFit('#hostWord');

                App.Host.currentCorrectAnswer = data.answer;
                App.Host.currentRound = data.round;
            },

            checkAnswer : function(data) {
                if (data.round === App.currentRound){
                    var $pScore = $('#' + data.playerId);

                    // Advance player's score
                    if( App.Host.currentCorrectAnswer === data.answer ) {
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

            endGame : function(data) {
                // Get the data for player 1 from the host screen
                var $p1 = $('#player1Score');
                var p1Score = +$p1.find('.score').text();
                var p1Name = $p1.find('.playerName').text();

                // Get the data for player 2 from the host screen
                var $p2 = $('#player2Score');
                var p2Score = +$p2.find('.score').text();
                var p2Name = $p2.find('.playerName').text();

                // Find the winner based on the scores
                var winner = (p1Score < p2Score) ? p2Name : p1Name;
                var tie = (p1Score === p2Score);

                // Display the winner (or tie game message)
                if(tie){
                    $('#hostWord').text("It's a Tie!");
                } else {
                    $('#hostWord').text( winner + ' Wins!!' );
                }
                App.doTextFit('#hostWord');

                // Reset game data
                App.Host.numPlayersInRoom = 0;
                App.Host.isNewGame = true;
            },

            restartGame : function(data) {
                App.$gameArea.html(App.$templateNewGame);
                $('#spanNewGameCode').text(App.gameId);
            }
        },
            // *** PLAYER ***

        Player : {

            hostSocketId: '',

            myName: '',

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
                App.myRole = 'Player';
                App.Player.myName = data.playerName;
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
                    playerName : App.Player.myName
                }
                IO.socket.emit('playerRestart',data);
                App.currentRound = 0;
                $('#gameArea').html("<h3>Waiting on host to start new game.</h3>");
            },

            updateWaitingScreen : function(data) {
                if(IO.socket.socket.sessionid === data.mySocketId){
                    App.myRole = 'Player';
                    App.gameId = data.gameId;

                    $('#playerWaitingMessage')
                        .append('<p/>')
                        .text('Joined Game ' + data.gameId + '. Please wait for game to begin.');
                }
            },

            gameCountdown : function(hostData) {
                App.Player.hostSocketId = hostData.mySocketId;
                $('#gameArea')
                    .html('<div class="gameOver">Get Ready!</div>');
            },

            newWord : function(data) {
                var $list = $('<ul/>').attr('id','ulAnswers');

                $.each(data.list, function(){
                    $list                                //  <ul> </ul>
                        .append( $('<li/>')              //  <ul> <li> </li> </ul>
                            .append( $('<button/>')      //  <ul> <li> <button> </button> </li> </ul>
                                .addClass('btnAnswer')   //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .addClass('btn')         //  <ul> <li> <button class='btnAnswer'> </button> </li> </ul>
                                .val(this)               //  <ul> <li> <button class='btnAnswer' value='word'> </button> </li> </ul>
                                .html(this)              //  <ul> <li> <button class='btnAnswer' value='word'>word</button> </li> </ul>
                            )
                        )
                });

                $('#gameArea').html($list);
            },

            endGame : function() {
                $('#gameArea')
                    .html('<div class="gameOver">Game Over!</div>')
                    .append(
                        $('<button>Start Again</button>')
                            .attr('id','btnPlayerRestart')
                            .addClass('btn')
                            .addClass('btnGameOver')
                    );
            }
        },
           // *** MISC / UTIL ***

        countDown : function( $el, startTime, callback) {

            $el.text(startTime);
            App.doTextFit('#hostWord');

            console.log('Starting Countdown...');
            var timer = setInterval(countItDown,1000);

            function countItDown(){
                startTime -= 1
                $el.text(startTime);
                App.doTextFit('#hostWord');
                if( startTime <= 0 ){
                    console.log('Countdown Finished.');
                    clearInterval(timer);
                    callback();
                    return;
                }
            }

        },

        doTextFit : function(el) {
            textFit(
                $(el)[0],
                {
                    alignHoriz:true,
                    alignVert:true,
                    widthOnly:true,
                    reProcess:true,
                    maxFontSize:300
                }
            );
        }

    };

    IO.init();
    App.init();

}($));
