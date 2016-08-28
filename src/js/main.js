'use strict';

var PlayState = require('./play_state.js');

var BootState = {
    init: function () {
        // NOTE: change this to suit your preferred scale mode.
        //       see http://phaser.io/docs/2.6.1/Phaser.ScaleManager.html
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.scale.pageAlignVertically = true;
        this.game.scale.pageAlignHorizontally = true;

        // TODO: remove
        this.game.time.advancedTiming = true;
    },

    preload: function () {
        // load here assets required for the loading screen
        this.game.load.image('preloader_bar', 'images/preloader_bar.png');
    },

    create: function () {
        this.game.state.start('preloader');
    }
};


var PreloaderState = {
    preload: function () {
        this.loadingBar = this.game.add.sprite(0, 240, 'preloader_bar');
        this.loadingBar.anchor.setTo(0, 0.5);
        this.load.setPreloadSprite(this.loadingBar);

        // audio assets
        this.game.load.audio('note:0', ['audio/note0.mp3', 'audio/note0.ogg']);
        this.game.load.audio('note:1', ['audio/note1.mp3', 'audio/note1.ogg']);
        this.game.load.audio('note:2', ['audio/note2.mp3', 'audio/note2.ogg']);
        this.game.load.audio('note:3', ['audio/note3.mp3', 'audio/note3.ogg']);
        this.game.load.audio('sfx:ok', 'audio/sfx_wobble.wav');
        this.game.load.audio('sfx:error', 'audio/sfx_error.wav');
        this.game.load.audio('sfx:artifact', 'audio/sfx_zium.wav');
        this.game.load.audio('sfx:teleport', 'audio/sfx_teleport.wav');
        this.game.load.audio('sfx:steps',
            ['audio/sfx_steps.mp3', 'audio/sfx_steps.ogg']);
        this.game.load.audio('bgm', ['audio/bgm.mp3', 'audio/bgm.ogg']);

        // image assets
        this.game.load.image('background', 'images/background.png');
        this.game.load.image('text_hud', 'images/text_hud.png');
        this.game.load.image('cloud', 'images/cloud.png');
        this.game.load.spritesheet('heroine', 'images/chara.png', 32, 64);
        this.game.load.image('font', 'images/font.png');
        this.game.load.image('music_box_bg', 'images/music_box_bg.png');
        this.game.load.spritesheet('music_gem', 'images/music_gems.png',
            96, 96);
        this.game.load.spritesheet('artifact', 'images/artifact.png', 32, 64);
        this.game.load.image('wreckage', 'images/wreckage.png');

        // maps and tilesets
        this.game.load.image('tiles:world', 'images/world_elements.png');
        this.game.load.text('map:room00', 'data/room00.min.json');
        this.game.load.text('map:intro', 'data/scene_intro.min.json');
    },

    create: function () {
        this.game.state.start('play', true, false, 'intro');
    }
};


window.onload = function () {
    var game = new Phaser.Game(800, 512, Phaser.CANVAS);

    game.state.add('boot', BootState);
    game.state.add('preloader', PreloaderState);
    game.state.add('play', PlayState);

    game.state.start('boot');
};
