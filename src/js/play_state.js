'use strict';

var Scene = require('./world/scene.js');
var Heroine = require('./prefabs/heroine.js');
var TypeWriter = require('./ui/type_writer.js');

var PlayState = {};

PlayState.create = function () {
    this._setupInput();

    let background = this.game.add.image(0, 0, 'background');
    background.fixedToCamera = true;

    let textHudGroup = this.game.add.group();
    textHudGroup.add(new Phaser.Image(this.game, 0, 512, 'text_hud'))
        .anchor.setTo(0, 1)
        .fixedToCamera = true;

    let attrezzo = this.game.add.group();
    this.scene = new Scene(this.game, 'room00', attrezzo);
    this.characters = this.game.add.group();

    this.heroine = new Heroine(this.game, 100, 384);
    this.characters.add(this.heroine);
    this.game.camera.follow(this.heroine);

    this.typeWriter = new TypeWriter(textHudGroup, 8, 426);
    this.typeWriter.write(0, 'Use <arrow keys> to move left and right.',
        TypeWriter.COLORS.GRAY);
    this.typeWriter.write(1, 'Hello, stranger.');
    this.typeWriter.write(2, '<continue>', TypeWriter.COLORS.GRAY)
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
