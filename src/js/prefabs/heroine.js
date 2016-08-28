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
