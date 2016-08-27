'use strict';

var Scene = require('./world/scene.js');
var Heroine = require('./prefabs/heroine.js');

var PlayState = {};

PlayState.create = function () {
    this._setupInput();

    let background = this.game.add.image(0, 0, 'background');
    background.fixedToCamera = true;

    this.scene = new Scene(this.game, 'room00');
    this.characters = this.game.add.group();

    this.heroine = new Heroine(this.game, 100, 384);
    this.characters.add(this.heroine);
    this.game.camera.follow(this.heroine);
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
    this.game.debug.text(this.game.time.fps, 2, 14, '#fff');
};

PlayState._setupInput = function () {
    this.keys = this.game.input.keyboard.createCursorKeys();
};

module.exports = PlayState;
