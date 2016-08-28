'use strict';

function Artifact(game, x, y, args) {
    Phaser.Sprite.call(this, game, x, y, 'artifact');

    this.anchor.setTo(0, 1);
    this.frame = 0;
    this.animations.add('activate', [0, 1, 2, 0], 10);

    this.type = 'artifact';
    this.id = args.artifactId;
    this.name = 'Artifact';

    this.game.physics.enable(this);
}

Artifact.prototype = Object.create(Phaser.Sprite.prototype);
Artifact.prototype.constructor = Artifact;

module.exports = Artifact;
