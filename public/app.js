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

            // host
            IO.socket.on('newGameCreated', IO.onNewGameCreated );
            IO.socket.on('beginNewGame', IO.beginNewGame );

            // Player
            IO.socket.on('playerJoinedRoom', IO.playerJoinedRoom );

        },

        onConnected : function(data) {
            console.log(data.message);
        },

        onNewGameCreated : function(data) {
            App.hostGameInit(data);
        },

        playerJoinedRoom : function(data) {
            if(App.myRole === 'host' ){
                App.hostUpdateWaitingScreen(data);
            }

            if(App.myRole === 'player' ){
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
            if(App.myRole === 'host' ){
                App.hostNewWord(data);
            }

            if(App.myRole === 'player' ){
                App.playerNewWord(data);
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

        playerData: {
            hostSocketId: '',
            myName: ''
        },

        hostData: {
            players : [],
            numPlayersInRoom: 0
        },

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
            App.$doc.on('click','#btnStart',App.onPlayerStartClick);
            App.$doc.on('click','.btnAnswer',App.onPlayerAnswerClick);
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

            console.log("Game started with ID: " + App.gameId + ' by host: ' + App.mySocketId);
            App.$gameArea.html(App.$templateNewGame);
            $('#spanNewGameCode').text(App.gameId);
        },

        hostUpdateWaitingScreen: function(data) {
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
            App.$gameArea.html(App.$templateGameStarting);

            var $secondsLeft = $('#startingSecondsLeft');

            App.countDown( $secondsLeft, 5, function(){
                IO.socket.emit('hostCountdownFinished', App.gameId);
            });
        },

        hostNewWord : function(data) {
            $('#gameArea').html('<h2>' + data.word + '</h2>')
        },
            // *** PLAYER ***

        playerUpdateWaitingScreen : function(data) {
            App.myRole = 'player';
            App.mySocketId = data.mySocketId;
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
            //TODO: Display word list
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
