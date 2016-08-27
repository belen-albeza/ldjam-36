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
