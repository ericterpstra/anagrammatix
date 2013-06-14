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
            App.gameId = data.gameId;
            console.log("Game started with ID: " + data.gameId);
        }
    };

    var App = {
        init : function() {
            App.cacheElements();
            App.bindEvents();
        },

        cacheElements : function() {
            App.$doc = $(document);
            App.$btnCreate = $('#btnCreateGame');
            App.$btnJoin = $('#btnJoineGame');
        },

        bindEvents : function() {
           App.$btnCreate.on('click',App.onCreateClick);
           App.$btnJoin.on('click',App.onJoinClick);
        },

        /* *************************************
         *           Event Handlers            *
         * *********************************** */

        onCreateClick : function(event) {
            IO.socket.emit('createNewGame');
        },

        onJoinClick : function(event) {

        }
    }    

    IO.init();
    App.init();
    
}($));
