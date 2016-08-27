(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var PlayState = require('./play_state.js');

var BootState = {
    init: function () {
        // NOTE: change this to suit your preferred scale mode.
        //       see http://phaser.io/docs/2.6.1/Phaser.ScaleManager.html
        this.game.scale.scaleMode = Phaser.ScaleManager.NO_SCALE;
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

        // image assets
        this.game.load.image('background', 'images/background.png');
        this.game.load.image('text_hud', 'images/text_hud.png');
        this.game.load.image('cursor', 'images/cursor.png');
        this.game.load.image('cloud', 'images/cloud.png');
        this.game.load.image('heroine', 'images/chara.png');
        this.game.load.image('font', 'images/font.png');

        // maps and tilesets
        this.game.load.image('tiles:world', 'images/world_elements.png');
        this.game.load.text('map:room00', 'data/room00.min.json');
    },

    create: function () {
        this.game.state.start('play');
    }
};


window.onload = function () {
    var game = new Phaser.Game(800, 512, Phaser.CANVAS);

    game.state.add('boot', BootState);
    game.state.add('preloader', PreloaderState);
    game.state.add('play', PlayState);

    game.state.start('boot');
};

},{"./play_state.js":2}],2:[function(require,module,exports){
'use strict';

var Scene = require('./world/scene.js');
var Heroine = require('./prefabs/heroine.js');

var PlayState = {};

PlayState.create = function () {
    this._setupInput();

    let background = this.game.add.image(0, 0, 'background');
    background.fixedToCamera = true;
    let textHud = this.game.add.image(0, 512, 'text_hud');
    textHud.anchor.setTo(0, 1);
    textHud.fixedToCamera = true;

    let attrezzo = this.game.add.group();
    this.scene = new Scene(this.game, 'room00', attrezzo);
    this.characters = this.game.add.group();

    this.heroine = new Heroine(this.game, 100, 384);
    this.characters.add(this.heroine);
    this.game.camera.follow(this.heroine);

    this.line = this.game.add.retroFont('font', 16, 24,
        Phaser.RetroFont.TEXT_SET2.replace(' ', '') + ' ');
    console.log(Phaser.RetroFont.TEXT_SET2);
    this.game.add.image(4, 424, this.line);
    this.line.text = 'Use <arrow keys> to move left and right.';
    this.line.fixedToCamera = true;
};

PlayState.update = function () {
    if (this.keys.left.isDown) {
        this.heroine.move(-1);
    }
    else if (this.keys.right.isDown) {
        this.heroine.move(1);
    }
    else {
        this.heroine.move(0);
    }
};

PlayState.render = function () {
    // this.game.debug.text(this.game.time.fps, 2, 14, '#fff');
};

PlayState._setupInput = function () {
    this.keys = this.game.input.keyboard.createCursorKeys();
};

module.exports = PlayState;

},{"./prefabs/heroine.js":4,"./world/scene.js":5}],3:[function(require,module,exports){
'use strict';

const MIN_SPEED = 10;
const MAX_SPEED = 50;

function Cloud(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'cloud');

    this.anchor.setTo(0.5, 0.5);
    this.alpha = 0.6;

    this.game.physics.enable(this);
    this.checkWorldBounds = true;

    this.reset(x, y);
    this._wasInside = true;
    this.events.onOutOfBounds.add(function () {
        if (this._wasInside) { this.reset(); }
    }, this);
    this.events.onEnterBounds.add(function () {
        this._wasInside = true;
    }, this);
}

// inherit from Phaser.prototype
Cloud.prototype = Object.create(Phaser.Sprite.prototype);
Cloud.prototype.constructor = Cloud;

Cloud.prototype.reset = function (x, y) {
    Phaser.Sprite.prototype.reset.call(this, x || 0, y || 0);
    this._wasInside = false;

    if (x === undefined || y === undefined) {
        this.position.setTo(
            this.game.world.width +
                this.game.rnd.between(0, this.game.world.width),
            this.game.rnd.between(50, 300));
    }

    this.body.velocity.x = -this.game.rnd.between(MIN_SPEED, MAX_SPEED);
};

module.exports = Cloud;

},{}],4:[function(require,module,exports){
'use strict';

const MOVE_SPEED = 200;

function Heroine(game, x, y) {
   Phaser.Sprite.call(this, game, x, y, 'heroine');

   this.anchor.setTo(0.5, 1);
   this.game.physics.enable(this);
   this.body.collideWorldBounds = true;
}

// inherit from Phaser.Sprite
Heroine.prototype = Object.create(Phaser.Sprite.prototype);
Heroine.prototype.constructor = Heroine;

Heroine.prototype.move = function (direction) {
    this.body.velocity.x = MOVE_SPEED * direction;
    if (direction !== 0) {
        this.scale.setTo(direction, 1);
    }
};

module.exports = Heroine;

},{}],5:[function(require,module,exports){
'use strict';

var Cloud = require('../prefabs/cloud.js');

const LAYERS = ['background00', 'background01', 'foreground00', 'foreground01'];

function getPositionFromIndex(data, index) {
    return {
        row: Math.floor(index / data.width),
        col: index % data.width
    };
}

function Scene(game, sceneKey, attrezzoGroup) {
    this.game = game;
    this.id = sceneKey;
    var data = JSON.parse(game.cache.getText(`map:${sceneKey}`));

    this.map = game.add.tilemap(null, data.tilewidth, data.tileheight,
        data.width, data.height);
    this.map.addTilesetImage('world', 'tiles:world',
        data.tilewidth, data.tileheight, 4, 4, 0);

    this.layers = LAYERS.map(function (layerName) {
        // create empty layer
        let l = this.map.createBlankLayer(layerName, data.width, data.height,
            data.tilewidth, data.tileheight);
        // fill layer with tile data
        let tiles = data.layers.find(x => x.name === layerName).data;
        tiles.forEach(function (tile, index) {
            let position = getPositionFromIndex(data, index);
            if (tile !== -1) {
                this.map.putTile(tile, position.col, position.row, l);
            }
        }, this);

        return l;
    }, this);

    this.layers[0].resizeWorld();

    this._spawnAttrezzo(attrezzoGroup);
}

Scene.prototype._spawnAttrezzo = function (group) {
    group.add(new Cloud(this.game, 100, 130));
    group.add(new Cloud(this.game, 500, 250));
    group.add(new Cloud(this.game, 1200, 80));
};

module.exports = Scene;

},{"../prefabs/cloud.js":3}]},{},[1]);
