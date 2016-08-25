(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var PlayScene = require('./play_scene.js');


var BootScene = {
    init: function () {
        // NOTE: change this to suit your preferred scale mode.
        //       see http://phaser.io/docs/2.6.1/Phaser.ScaleManager.html
        this.game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
        this.game.scale.pageAlignVertically = true;
        this.game.scale.pageAlignHorizontally = true;
    },

    preload: function () {
        // load here assets required for the loading screen
        this.game.load.image('preloader_bar', 'images/preloader_bar.png');
    },

    create: function () {
        this.game.state.start('preloader');
    }
};


var PreloaderScene = {
    preload: function () {
        this.loadingBar = this.game.add.sprite(0, 240, 'preloader_bar');
        this.loadingBar.anchor.setTo(0, 0.5);
        this.load.setPreloadSprite(this.loadingBar);

        // TODO: load here the assets for the game
        this.game.load.image('logo', 'images/phaser.png');
    },

    create: function () {
        this.game.state.start('play');
    }
};


window.onload = function () {
    var game = new Phaser.Game(512, 512, Phaser.AUTO);

    game.state.add('boot', BootScene);
    game.state.add('preloader', PreloaderScene);
    game.state.add('play', PlayScene);

    game.state.start('boot');
};

},{"./play_scene.js":2}],2:[function(require,module,exports){
'use strict';

var PlayScene = {
    create: function () {
        var logo = this.game.add.sprite(
            this.game.world.centerX, this.game.world.centerY, 'logo');
            logo.anchor.setTo(0.5, 0.5);
    }
};

module.exports = PlayScene;

},{}]},{},[1]);
