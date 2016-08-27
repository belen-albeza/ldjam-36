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
var Story = require('./world/story.js');
var TypeWriter = require('./ui/type_writer.js');
var Tooltip = require('./ui/tooltip.js');

var Heroine = require('./prefabs/heroine.js');

var PlayState = {};

PlayState.init = function () {
    this.events = {
        onHeroineMove: new Phaser.Signal()
    };
};

PlayState.create = function () {
    let background = this.game.add.image(0, 0, 'background');
    background.fixedToCamera = true;

    let attrezzo = this.game.add.group();
    this.scene = new Scene(this.game, 'room00', attrezzo);
    this.characters = this.game.add.group();

    let textHudGroup = this.game.add.group();
    let hudBackground = textHudGroup.add(new Phaser.Image(this.game, 0, 512,
        'text_hud'));
    hudBackground.anchor.setTo(0, 1);
    hudBackground.fixedToCamera = true;
    this.typeWriter = new TypeWriter(textHudGroup, 8, 426);
    this.tooltip = new Tooltip(textHudGroup, 796, 506);
    this.tooltip.lineImage.anchor.setTo(1, 1);

    this._setupInput();

    this.heroine = new Heroine(this.game, 100, 384);
    this.characters.add(this.heroine);
    this.game.camera.follow(this.heroine);

    this.story = new Story(this.game, this.typeWriter, this.tooltip,
        this.events);
    this.story.events.onFreezeControl.add(function () {
        this.isControlFrozen = true;
    }, this);
    this.story.events.onReleaseControl.add(function () {
        this.isControlFrozen = false;
    }, this);

    this.isControlFrozen = false;
    this.story.start();

};

PlayState.update = function () {
    if (this.keys.left.isDown && !this.isControlFrozen) {
        this.heroine.move(-1);
        this.events.onHeroineMove.dispatch();
    }
    else if (this.keys.right.isDown && !this.isControlFrozen) {
        this.heroine.move(1);
        this.events.onHeroineMove.dispatch();
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
    this.keys.space = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);
    this.game.input.keyboard.addKeyCapture([Phaser.KeyCode.UP,
        Phaser.KeyCode.DOWN, Phaser.KeyCode.LEFT, Phaser.KeyCode.RIGHT,
        Phaser.KeyCode.SPACEBAR]);

    this.keys.space.onDown.add(function () {
        if (this.isControlFrozen) {
            this.typeWriter.next();
        }
    }, this);
};

module.exports = PlayState;

},{"./prefabs/heroine.js":4,"./ui/tooltip.js":5,"./ui/type_writer.js":6,"./world/scene.js":7,"./world/story.js":8}],3:[function(require,module,exports){
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

// TODO: refactor with colors of TypeWriter
const COLORS = {
   GRAY: 0x595652,
   WHITE: 0xcbdbfc,
   RED: 0xd95763,
   YELLOW: 0xfbf236,
   BLUE: 0x5b6ee1,
   AQUA: 0x5fcde4,
   EMERALD: 0x37946e,
   ORANGE: 0xdf7126,
   BLACK: 0x000000
};

function Tooltip(group, x, y) {
    this.game = group.game;

    this.lineFont = this.game.add.retroFont('font', 16, 24,
        Phaser.RetroFont.TEXT_SET2.replace(' ', '') + ' ');
    this.lineImage = group.add(
        new Phaser.Image(this.game, x, y, this.lineFont));
    this.lineImage.fixedToCamera = true;
}

Tooltip.prototype.write = function (text, color) {
    console.log('TOOLTIP', text, color);
    console.log(this.lineFont);
    console.log(this.lineImage);
    this.lineFont.text = text;
    this.lineImage.tint = color || COLORS.GRAY;
    this.lineImage.visible = true;
};

Tooltip.prototype.erase = function () {
    this.lineImage.visible = false;
};


module.exports = Tooltip;

},{}],6:[function(require,module,exports){
'use strict';

const LINE_COUNT = 3;
const COLORS = {
   GRAY: 0x595652,
   WHITE: 0xcbdbfc,
   RED: 0xd95763,
   YELLOW: 0xfbf236,
   BLUE: 0x5b6ee1,
   AQUA: 0x5fcde4,
   EMERALD: 0x37946e,
   ORANGE: 0xdf7126,
   BLACK: 0x000000
};

function TypeWriter(group, x, y) { // 8, 426
    this.game = group.game;
    this.events = {
        onQueueFinish: new Phaser.Signal()
    };

    this.lineFonts = [];
    for (let i = 0; i < LINE_COUNT; i++) {
        this.lineFonts.push(this.game.add.retroFont('font', 16, 24,
            Phaser.RetroFont.TEXT_SET2.replace(' ', '') + ' '));
    }

    this.lineImages = this.lineFonts.map(function (line, i) {
        let img = group.add(new Phaser.Image(this.game, x, y + i * 28, line));
        img.fixedToCamera = true;
        return img;
    }, this);

    this.pageQueue = [];
}

TypeWriter.prototype.page = function (lines) {
    this.pageQueue.push(lines);
};

TypeWriter.prototype.print = function () {
    let lines = this.pageQueue.shift();

    lines.forEach(function (line, i) {
        this.write(i, line.text, line.color);
    }, this);
    for (var i = lines.length; i < LINE_COUNT; i++) {
        this.write(i, '');
    }
};

TypeWriter.prototype.next = function () {
    if (this.pageQueue.length > 0 ) {
        this.print();
    }
    else {
        this.clear();
        this.events.onQueueFinish.dispatch();
    }
};

TypeWriter.prototype.clear = function () {
    for (var i = 0; i < LINE_COUNT; i++) {
        this.write(i, '');
    }
};

TypeWriter.prototype.write = function (line, text, color) {
    // console.log(line, text, color);
    this.lineFonts[line].text = text;
    this.lineImages[line].tint = color || COLORS.WHITE;
};

TypeWriter.COLORS = COLORS;
TypeWriter.LINE_COUNT = 3;

module.exports = TypeWriter;

},{}],7:[function(require,module,exports){
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

},{"../prefabs/cloud.js":3}],8:[function(require,module,exports){
'use strict';

var TypeWriter = require('../ui/type_writer.js');

const CHARAS = {
    GAME: {name: 'Game', color: 'GRAY'},
    HEROINE: {name: 'Heroine', color: 'BLUE'},
    GOD: {name: 'Alien God', color: 'ORANGE'}
};


function Story(game, typeWriter, tooltip, gameEvents) {
    this.game = game;
    this.writer = typeWriter;
    this.tooltip = tooltip;
    this.gameEvents = gameEvents;

    this.textBuffer = [];
    this.events = {
        onReleaseControl: new Phaser.Signal(),
        onFreezeControl: new Phaser.Signal()
    };
}

Story.prototype.start = function () {
    this._setupIntro();
};

Story.prototype.speak = function (character, text) {
    if (this.textBuffer.length === TypeWriter.LINE_COUNT) {
        console.warn('The type writer can\'t accept more lines');
    }
    else {
        this.textBuffer.push({
            text: text,
            color: TypeWriter.COLORS[character.color]
        });
    }
};

Story.prototype.commitPage = function () {
    if (this.textBuffer.length > 0) {
        this.writer.page(this.textBuffer);
        this.textBuffer = [];
    }
    else {
        console.warn('There are no lines for the type writer');
    }
};

Story.prototype._setupIntro = function () {
    // this.events.onRoomEnter.addOnce(function () {
        this.events.onFreezeControl.dispatch();
        this.speak(CHARAS.HEROINE, 'What... is this?');
        this.commitPage();
        this.speak(CHARAS.HEROINE, 'What am I doing here...?');
        this.commitPage();
        this.writer.print();

        this.tooltip.write('Press <SPACEBAR> to continue.');

        this.writer.events.onQueueFinish.addOnce(function () {
            this.tooltip.write('Press <ARROW KEYS> to move left and right.');
            this.events.onReleaseControl.dispatch();
            this.gameEvents.onHeroineMove.addOnce(function () {
                this.tooltip.erase();
            }, this);
        }, this);
    // }, this);
};

module.exports = Story;

},{"../ui/type_writer.js":6}]},{},[1]);
