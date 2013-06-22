;
jQuery(function($){    
    'use strict';

    var IO = {
        init: function() {
            IO.socket = io.connect('http://localhost');
            IO.bindEvents();
        },

        bindEvents : function() {
            IO.socket.on('connected', IO.onConnected);            
            IO.socket.on('newGameCreated', IO.onNewGameCreated);
        },

        onConnected : function(data) {
            console.log(data.message);
        },

        onNewGameCreated : function(data) {
            // If no error
            App.hostGameInit(data.gameId);
            // else display error.
        }
    };

    var App = {

        gameId: 0,

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

        },

        /* *************************************
         *             Game Logic              *
         * *********************************** */

        hostGameInit: function (gameId) {
            App.gameId = gameId;
            console.log("Game started with ID: " + gameId);
            App.$gameArea.html(App.$templateNewGame);
            $('#spanNewGameCode').text(gameId);
        }
    };

    IO.init();
    App.init();
    
}($));
