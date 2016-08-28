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
