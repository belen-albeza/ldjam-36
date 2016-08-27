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
