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
