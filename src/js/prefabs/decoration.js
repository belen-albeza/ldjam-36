'use strict';

function Decoration(game, x, y, args) {
    Phaser.Sprite.call(this, game, x, y, args.imageKey);

    this.type = 'decoration';
    this.id = args.id;
    this.name = args.name;

    this.game.physics.enable(this);
}

Decoration.prototype = Object.create(Phaser.Sprite.prototype);
Decoration.prototype.constructor = Decoration;

module.exports = Decoration;
