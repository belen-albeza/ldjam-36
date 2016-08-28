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
