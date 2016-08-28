(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
        this.game.load.audio('sfx:steps',
            ['audio/sfx_steps.mp3', 'audio/sfx_steps.ogg']);

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
var MusicBox = require('./world/music_box.js');

var Heroine = require('./prefabs/heroine.js');

var TypeWriter = require('./ui/type_writer.js');
var Tooltip = require('./ui/tooltip.js');


var PlayState = {};

PlayState.init = function () {
    this.events = {
        onHeroineMove: new Phaser.Signal(),
        onSceneEnter: new Phaser.Signal(),
        onPuzzleSuccess: new Phaser.Signal(),
        onTouch: new Phaser.Signal(),
        onUntouch: new Phaser.Signal(),
        onAction: new Phaser.Signal()
    };
    this.sfx = {};
    this.lastOverlap = null;
};

PlayState.create = function () {
    let background = this.game.add.image(0, 0, 'background');
    background.fixedToCamera = true;

    let attrezzo = this.game.add.group();
    this.gameObjects = this.game.add.group();
    this.scene = new Scene(this.game, 'room00', attrezzo, this.gameObjects);

    this.characters = this.game.add.group();
    this.characters.add(this.gameObjects);

    let textHudGroup = this.game.add.group();
    let hudBackground = textHudGroup.add(new Phaser.Image(this.game, 0, 512,
        'text_hud'));
    hudBackground.anchor.setTo(0, 1);
    hudBackground.fixedToCamera = true;
    this.typeWriter = new TypeWriter(textHudGroup, 8, 426);
    this.tooltip = new Tooltip(textHudGroup, 400, 506);
    this.tooltip.lineImage.anchor.setTo(0.5, 1);
    this.cursorTooltip = new Tooltip(textHudGroup, 400, 390);
    this.cursorTooltip.lineImage.anchor.setTo(0.5, 0);

    this._setupInput();

    this.heroine = new Heroine(this.game, 32, 384);
    this.characters.add(this.heroine);
    this.game.camera.follow(this.heroine);

    this._setupStory();

    this.isControlFrozen = false;
    this.story.start();
    // NOTE: always manually trigger onEnter in the first room
    this.events.onSceneEnter.dispatch(this.scene.key);

    this.sfx.notes = [
        this.game.add.audio('note:0'),
        this.game.add.audio('note:1'),
        this.game.add.audio('note:2'),
        this.game.add.audio('note:3')
    ];
    this.sfx.success = this.game.add.audio('sfx:ok', 0.6);
    this.sfx.error = this.game.add.audio('sfx:error', 0.6);
    this.sfx.artifact = this.game.add.audio('sfx:artifact', 0.6);
    this.sfx.steps = this.game.add.audio('sfx:steps', 0.6);
    this.minigameGroup = this.game.add.group();
};

PlayState.update = function () {
    let moved = false;
    if (this.keys.left.isDown && !this.isControlFrozen) {
        this.heroine.move(-1);
        this.events.onHeroineMove.dispatch();
        this.heroine.animations.play('run');
        moved = true;
    }
    else if (this.keys.right.isDown && !this.isControlFrozen) {
        this.heroine.move(1);
        this.events.onHeroineMove.dispatch();
        this.heroine.animations.play('run');
        moved = true;
    }
    else {
        this.sfx.steps.stop();
        this.heroine.move(0);
        this.heroine.animations.play('idle');
    }

    if (moved && !this.sfx.steps.isPlaying) {
        this.sfx.steps.loopFull();
    }

    PlayState._handleCollisions();
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
        else if (this.lastOverlap !== null && !this.lastOverlap.disabled) {
            this.isControlFrozen = true;

            if (this.lastOverlap.type === 'artifact') {
                this.sfx.artifact.play();
                this.lastOverlap.animations.play('activate');
            }
            // wait a bit for sfx and animation to be played
            this.game.time.events.add(300, function () {
                this.isControlFrozen = false;
                this.events.onAction.dispatch({
                    scene: this.scene.key,
                    type: this.lastOverlap.type,
                    id: this.lastOverlap.id
                });
            }, this);
        }
    }, this);
};

PlayState._setupStory = function () {
    this.story = new Story(this.game, this.typeWriter, this.tooltip,
        this.events);

    this.story.events.onFreezeControl.add(function () {
        this.isControlFrozen = true;
    }, this);
    this.story.events.onReleaseControl.add(function () {
        this.isControlFrozen = false;
    }, this);
    this.story.events.onDisableCurrentEntity.add(function () {
        if (this.lastOverlap) {
            this.lastOverlap.disabled = true;
        }
    }, this);
    this.story.events.onShowMusicBox.add(function (melodyKey) {
        this.isControlFrozen = true;
        this._spawnMusicBox(melodyKey);
    }, this);
};

PlayState._spawnMusicBox = function (melodyKey) {
    this.musicBox = new MusicBox(this.minigameGroup, this.keys, this.sfx,
        MusicBox.MELODIES[melodyKey]);

    this.musicBox.events.onSuccess.addOnce(function () {
        this._clearMusicBox();
        this.isControlFrozen = false;
        this.events.onPuzzleSuccess.dispatch({type: 'musicbox', key: melodyKey});
    }, this);

    this.game.time.events.add(1000, function () {
        this.musicBox.play();
    }, this);
};

PlayState._clearMusicBox = function () {
    this.musicBox = null;
    this.minigameGroup.removeAll();
};

PlayState._handleCollisions = function () {
    this.cursorTooltip.erase();
    let oldOverlap = this.lastOverlap;
    let overlapping = false;

    // TODO: this assumes ONLY one overlap at a given frame… it probably should
    //       be more flexible!
    this.game.physics.arcade.overlap(this.heroine, this.gameObjects,
    function (heroine, object) {
        let entityData = {
            scene: this.scene.key,
            type: object.type,
            id: object.id
        };

        this.cursorTooltip.write(object.type, Tooltip.COLORS.WHITE);

        // wasn't overlapping last frame
        if (this.lastOverlap !== object) {
            this.events.onTouch.dispatch(entityData);
        }
        this.lastOverlap = object;
        overlapping = true;
    }, (h, o) => !o.disabled, this);

    if (!overlapping) { this.lastOverlap = null; }

    if (oldOverlap !== this.lastOverlap && oldOverlap !== null) {
        this.events.onUntouch.dispatch({
            scene: this.scene.key,
            type: oldOverlap.type,
            id: oldOverlap.id
        });
    }
};

PlayState._findEntity = function (type, id) {
    let found = this.gameObjects.filter(function (entity) {
       return entity.type === type && entity.id === id;
    });
    return found.first;
};

module.exports = PlayState;

},{"./prefabs/heroine.js":5,"./ui/tooltip.js":7,"./ui/type_writer.js":8,"./world/music_box.js":9,"./world/scene.js":10,"./world/story.js":11}],3:[function(require,module,exports){
'use strict';

function Artifact(game, x, y, args) {
    Phaser.Sprite.call(this, game, x, y, 'artifact');

    this.anchor.setTo(0.5, 1);
    this.frame = 0;
    this.animations.add('activate', [0, 1, 2, 0], 10);

    this.type = 'artifact';
    this.id = args.artifactId;

    this.game.physics.enable(this);
}

Artifact.prototype = Object.create(Phaser.Sprite.prototype);
Artifact.prototype.constructor = Artifact;

module.exports = Artifact;

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
'use strict';

const MOVE_SPEED = 200;

function Heroine(game, x, y) {
   Phaser.Sprite.call(this, game, x, y, 'heroine');

   this.anchor.setTo(0.5, 1);
   this.game.physics.enable(this);
   this.body.collideWorldBounds = true;

   this.animations.add('idle', [0, 1], 2);
   this.animations.add('run', [2, 3, 4, 5, 6], 10);

   this.animations.play('idle', null, true);
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

},{}],6:[function(require,module,exports){
'use strict';

function MusicGem(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, 'music_gem');
    this.animations.add('inactive', [2]);
    this.animations.add('active', [0, 2], 3);
    this.animations.add('wrong', [1, 2], 3);
    this.animations.add('error', [1, 1, 2, 1, 1, 2, 1, 1, 2], 15);
    this.animations.add('success', [0, 0, 2, 0, 0, 2, 0, 0, 2], 15);

    this.animations.play('inactive');
}

MusicGem.prototype = Object.create(Phaser.Sprite.prototype);
MusicGem.prototype.constructor = MusicGem;

module.exports = MusicGem;

},{}],7:[function(require,module,exports){
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
    this.lineFont.text = text;
    this.lineImage.tint = color || COLORS.GRAY;
    this.lineImage.visible = true;
};

Tooltip.prototype.erase = function () {
    this.lineImage.visible = false;
    this.lineFont.text = '';
};

Tooltip.COLORS = COLORS;


module.exports = Tooltip;

},{}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
'use strict';

var MusicGem = require('../prefabs/music_gem.js');

const MELODIES = {
    TEST: [
        {index: 0, start: 0, duration: 300},
    ],
    SANDMAN: [
        {index: 0, start: 0, duration: 300},
        {index: 3, start: 1000, duration: 300},
        {index: 2, start: 1500, duration: 300},
        {index: 1, start: 2000, duration: 300}
    ]
};

function MusicBox(group, keys, sfx, melody) {
    this.game = group.game;
    this.group = group;
    this.keys = keys;
    this.events = {
        onSuccess: new Phaser.Signal(),
        onFailure: new Phaser.Signal()
    };
    this.sfx = sfx;
    this.sfx.notes = sfx.notes;

    let bg = this.group.add(new Phaser.Image(this.game, 0, 0, 'music_box_bg'));

    let offsetx = this.game.width / 2 - bg.width / 2;
    let offsety = 100;

    bg.position.setTo(offsetx, offsety);

    this.gems = [
        this.group.add(new MusicGem(this.game, offsetx + 32, offsety + 40)),
        this.group.add(new MusicGem(this.game, offsetx + 160, offsety + 40)),
        this.group.add(new MusicGem(this.game, offsetx + 288, offsety + 40)),
        this.group.add(new MusicGem(this.game, offsetx + 416, offsety + 40))
    ];

    // this.group.position.setTo(this.game.width / 2 - bg.width / 2, 100);
    this.group.fixedToCamera = true;

    this.melody = melody;
}

MusicBox.prototype.activate = function () {
    this.play();
};

MusicBox.prototype.play = function () {
    this.isListening = false;

    this.timer = this.game.time.create(); // this will be autodestroyed
    this.melody.forEach(function (note) {
        this.timer.add(note.start, this._playNote, this, note.index);
        this.timer.add(note.start + note.duration, this._stopNote, this,
            note.index);
    }, this);
    this.timer.start();

    this.timer.onComplete.addOnce(this.listen, this);
};

MusicBox.prototype.listen = function () {
    this.isListening = true;
    this.listenBuffer = [];

    // bind up keys
    this.keys.left.onDown.add(this._recordNote0, this);
    this.keys.down.onDown.add(this._recordNote1, this);
    this.keys.up.onDown.add(this._recordNote2, this);
    this.keys.right.onDown.add(this._recordNote3, this);
};

MusicBox.prototype.cleanUpEvents = function () {
    this.keys.left.onDown.remove(this._recordNote0, this);
    this.keys.down.onDown.remove(this._recordNote1, this);
    this.keys.up.onDown.remove(this._recordNote2, this);
    this.keys.right.onDown.remove(this._recordNote3, this);
};

MusicBox.prototype._recordNote0 = function () { this._recordNote(0); };
MusicBox.prototype._recordNote1 = function () { this._recordNote(1); };
MusicBox.prototype._recordNote2 = function () { this._recordNote(2); };
MusicBox.prototype._recordNote3 = function () { this._recordNote(3); };

MusicBox.prototype._recordNote = function (index) {
    this.listenBuffer.push(index);

    if (this.melody[this.listenBuffer.length -1].index === index) {
        // success!
        this._playNote(index);
        if (this.listenBuffer.length === this.melody.length) {
            this.cleanUpEvents();
            this.game.time.events.add(800, this._showSuccess, this);
            this.game.time.events.add(1500, function () {
                this.events.onSuccess.dispatch();
            }, this);
        }
    }
    else {
        // error
        this._playNote(index, true);
        this.cleanUpEvents();
        this.game.time.events.add(800, this._showError, this);
        this.game.time.events.add(1500, function () {
            this.events.onFailure.dispatch();
            this.play();
        }, this);
    }
};

MusicBox.prototype._showSuccess = function () {
    this.sfx.success.play();
    this.gems.forEach(function (gem) {
        gem.animations.play('success');
    });
};

MusicBox.prototype._showError = function () {
    this.sfx.error.play();
    this.gems.forEach(function (gem) {
        gem.animations.play('error');
    });
};

MusicBox.prototype._playNote = function (index, isError) {
    this.gems[index].animations.play(isError ? 'wrong' : 'active');
    this.sfx.notes[index].play();
};

MusicBox.prototype._stopNote = function (index) {
    this.gems[index].animations.play('inactive');
};


MusicBox.MELODIES = MELODIES;

module.exports = MusicBox;

},{"../prefabs/music_gem.js":6}],10:[function(require,module,exports){
'use strict';

var Cloud = require('../prefabs/cloud.js');
var Artifact = require('../prefabs/artifact.js');

const TILES = [
    { gid: 106, sprite: Artifact, args: { artifactId: 0 } },
    { gid: 107, sprite: Artifact, args: { artifactId: 1 } }
];


const LAYERS = ['background01', 'foreground00', 'foreground01', 'logic'];

function getPositionFromIndex(data, index) {
    return {
        row: Math.floor(index / data.width),
        col: index % data.width
    };
}

function Scene(game, sceneKey, attrezzoGroup, spritesGroup) {
    this.game = game;
    this.key = sceneKey;
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
            if (tile === -1) { return; }

            let position = getPositionFromIndex(data, index);
            if (layerName !== 'logic') {
                this.map.putTile(tile, position.col, position.row, l);
            }
            else {
                let entity = TILES.find(x => x.gid === tile);
                if (entity) {
                    spritesGroup.add(new entity.sprite(
                        this.game,
                        position.col * data.tilewidth + data.tilewidth / 2,
                        (position.row + 1) * data.tileheight,
                        entity.args));
                }
            }
        }, this);

        return l;
    }, this);

    this.layers[0].resizeWorld();
    this.layers[this.layers.length-1].visible = false; // hide logic layer

    this._spawnAttrezzo(attrezzoGroup);
}

Scene.prototype._spawnAttrezzo = function (group) {
    group.add(new Cloud(this.game, 100, 130));
    group.add(new Cloud(this.game, 500, 250));
    group.add(new Cloud(this.game, 1200, 80));
};

module.exports = Scene;

},{"../prefabs/artifact.js":3,"../prefabs/cloud.js":4}],11:[function(require,module,exports){
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
    this.callbacks = {};
    this.visitedScenes = {};
    this.globals = {};

    this.textBuffer = [];
    this.events = {
        onReleaseControl: new Phaser.Signal(),
        onFreezeControl: new Phaser.Signal(),
        onShowMusicBox: new Phaser.Signal(),
        onDisableCurrentEntity: new Phaser.Signal()
    };

    this.gameEvents.onPuzzleSuccess.add(function (puzzle) {
        let callback = this.callbacks[
            `onPuzzleSuccess:${puzzle.type}:${puzzle.key}`];
        if (callback) { callback(); }
    }, this);

    this.gameEvents.onAction.add(function (entity) {
        let callback = this.callbacks[
            `onAction:${entity.scene}:${entity.type}:${entity.id}`];
        if (callback) { callback(); }
    }, this);

    this.gameEvents.onTouch.add(function (entity) {
        let callback = this.callbacks[
            `onTouch:${entity.scene}:${entity.type}:${entity.id}`];
        if (callback) { callback(); }
    }, this);

    this.gameEvents.onUntouch.add(function (entity) {
        let callback = this.callbacks[
            `onUntouch:${entity.scene}:${entity.type}:${entity.id}`];
        if (callback) { callback(); }
    }, this);

    this.gameEvents.onSceneEnter.add(function (sceneKey) {
        let wasVisited = this.visitedScenes[sceneKey] !== undefined;
        this.visitedScenes[sceneKey] = wasVisited ?
            this.visitedScenes[sceneKey] + 1 : 1;

        let enterCallback = this.callbacks[`onSceneEnter:${sceneKey}`];
        let firstEnterCallback =
            this.callbacks[`onSceneFirstEnter:${sceneKey}`];

        if (!wasVisited && firstEnterCallback) { firstEnterCallback(); }
        if (enterCallback) { enterCallback(!wasVisited); }
    }, this);
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
    this.callbacks['onTouch:room00:artifact:0'] = function () {
        if (!this.globals.sawArtifact) {
            this.events.onFreezeControl.dispatch();
            this.speak(CHARAS.HEROINE, 'What is this thing?');
            this.commitPage();
            this.speak(CHARAS.HEROINE, 'It looks like some kind of artifact.');
            this.commitPage();
            this.speak(CHARAS.HEROINE, 'I don\'t know why, but I have the impression');
            this.speak(CHARAS.HEROINE, 'that it is ancient.');
            this.commitPage();
            this.speak(CHARAS.HEROINE, 'What will happen if I touch it?');
            this.commitPage();
            this.writer.print();
            this.writer.events.onQueueFinish.addOnce(function () {
                this.events.onReleaseControl.dispatch();
                this.globals.sawArtifact = true;
                this.tooltip.write('Press <SPACEBAR> to interact.');
            }, this);
        }
        else {
            this.tooltip.write('Press <SPACEBAR> to interact.');
        }
    }.bind(this);

    this.callbacks['onAction:room00:artifact:1'] = function () {
        this.events.onFreezeControl.dispatch();
        this.speak(CHARAS.HEROINE, 'Another of these artifacts...');
        this.speak(CHARAS.HEROINE, 'Let\'s solve this!');
        this.commitPage();
        this.writer.print();
        this.writer.events.onQueueFinish.addOnce(function () {
            this.events.onReleaseControl.dispatch();
            this.events.onShowMusicBox.dispatch('SANDMAN');
            this.events.onDisableCurrentEntity.dispatch();
        }, this);
    }.bind(this);

    this.callbacks['onAction:room00:artifact:0'] = function () {
        this.tooltip.erase();
        this.events.onShowMusicBox.dispatch('TEST');
        this.events.onDisableCurrentEntity.dispatch();
    }.bind(this);

    this.callbacks['onPuzzleSuccess:musicbox:TEST'] = function () {
        this.events.onFreezeControl.dispatch();
        this.speak(CHARAS.HEROINE, 'That was easy!');
        this.commitPage();
        this.speak(CHARAS.HEROINE, 'But has it changed anything?');
        this.commitPage();
        this.writer.print();
        this.writer.events.onQueueFinish.addOnce(function () {
            this.events.onReleaseControl.dispatch();
        }, this);
    }.bind(this);

    this.callbacks['onPuzzleSuccess:musicbox:SANDMAN'] = function () {
        this.events.onFreezeControl.dispatch();
        this.speak(CHARAS.GOD, 'Was this short? You bet!');
        this.commitPage();
        this.speak(CHARAS.GOD, 'As you can see, I\'m in a real hurry');
        this.speak(CHARAS.GOD, 'to finish on time.');
        this.commitPage();
        this.speak(CHARAS.GOD, 'Please cheer me up on Twitter!');
        this.speak(CHARAS.GOD, 'Thanks <3');
        this.speak(CHARAS.GOD, '@ladybenko');
        this.commitPage();
        this.speak(CHARAS.HEROINE, 'What the hell was that?');
        this.commitPage();
        this.writer.print();
        this.writer.events.onQueueFinish.addOnce(function () {
            this.events.onReleaseControl.dispatch();
        }, this);
    }.bind(this);

    this.callbacks['onSceneFirstEnter:room00'] = function () {
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
    }.bind(this);
};

module.exports = Story;

},{"../ui/type_writer.js":8}]},{},[1]);
