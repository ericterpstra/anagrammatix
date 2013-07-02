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
            IO.socket.on('player1Joined', IO.waitForPlayerTwo );
            IO.socket.on('beginNewGame', IO.beginNewGame );

            IO.socket.on('error', IO.error );
        },

        onConnected : function(data) {
            console.log(data.message);
        },

        onNewGameCreated : function(data) {
            // If no error
            App.hostGameInit(data.gameId);
            // else display error.
        },

        waitForPlayerTwo : function(data) {
            if(App.myRole === 'master' ){
                // Update master screen
                $('#playersWaiting')
                    .append('<p/>')
                    .text('Player ' + data.name + ' joined the game.');
            }

            if(App.myRole === 'player' ){
                // Update player screen
                $('#playerWaitingMessage')
                    .append('<p/>')
                    .text('Joined Game ' + data.gameId + '. Waiting for Player 2.');
            }
        },

        beginNewGame : function(data) {
            console.log('New game is beginning!');
            App.beginGameCountdown();
        },

        error : function(data) {
            alert(data.message);
        }

    };

    var App = {

        gameId: 0,

        myRole: '',

        masterSocketId: '',

        mySocketId: '',

        init: function () {
            App.cacheElements();
            App.bindEvents();
        },

        cacheElements: function () {
            App.$doc = $(document);

            // Sections
            App.$gameArea = $('#gameArea');
            App.$templateNewGame = $('#create-game-template').html();
            App.$templateJoinGame = $('#join-game-template').html();
            App.$templateGameStarting = $('#game-starting-template').html();

            // Buttons
            App.$btnCreate = $('#btnCreateGame');
            App.$btnJoin = $('#btnJoinGame');
        },

        bindEvents: function () {
            App.$btnCreate.on('click', App.onCreateClick);
            App.$btnJoin.on('click', App.onJoinClick);
            App.$doc.on('click','#btnStart',App.onStartGameClick);
        },

        /* *************************************
         *           Event Handlers            *
         * *********************************** */

        onCreateClick: function () {
            console.log('Clicked "Create New Game"');
            IO.socket.emit('createNewGame');
        },

        onJoinClick: function () {
            console.log('Clicked "Create New Game"');
            App.$gameArea.html(App.$templateJoinGame);

        },

        onStartGameClick: function() {

            console.log('Clicked "Start Game"');
            var data = {
                gameId : +($('#inputGameId').val()),
                name : $('#inputPlayerName').val() || 'anon'
            };

            IO.socket.emit('joinGame', data);
            App.myRole = 'player';
        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

            // *** MASTER ***

        hostGameInit: function (gameId) {
            App.gameId = gameId;
            App.myRole = 'master';

            console.log("Game started with ID: " + gameId);
            App.$gameArea.html(App.$templateNewGame);
            $('#spanNewGameCode').text(gameId);
        },

        beginGameCountdown : function() {
            App.$gameArea.html(App.$templateGameStarting);

            var $secondsLeft = $('#startingSecondsLeft');

            if( App.myRole === 'master' ){
                App.countDown( $secondsLeft, 5 );
            } else {
                App.$gameArea.text('Waiting for game to begin...');
            }

            IO.socket.emit('gameCountdownFinished');

        },


            // *** PLAYER ***

        waitForPlayer : function() {
            App.myRole = 'player1';
        },

           // *** MISC / UTIL ***

        countDown : function( $el, startTime) {

            $el.text(startTime);

            console.log('Starting Countdown...');
            var timer = setInterval(countItDown,1000);

            function countItDown(){
                startTime -= 1
                $el.text(startTime);
                if( startTime <= 0 ){
                    console.log('Countdown Finished.');
                    clearInterval(timer);
                    return;
                }
            }

        }

    };

    IO.init();
    App.init();

}($));
