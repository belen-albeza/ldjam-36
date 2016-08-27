'use strict';

const LINE_COUNT = 3;
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

function TypeWriter(group, x, y) { // 8, 426
    this.game = group.game;

    this.lineFonts = [];
    for (let i = 0; i < LINE_COUNT; i++) {
        this.lineFonts.push(this.game.add.retroFont('font', 16, 24,
            Phaser.RetroFont.TEXT_SET2.replace(' ', '') + ' '));
    }

    this.lineImages = this.lineFonts.map(function (line, i) {
        let img = group.add(new Phaser.Image(this.game, x, y + i * 28, line));
        img.fixedToCamera = true;
        return img;
    }, this);
}

TypeWriter.prototype.write = function (line, text, color) {
    console.log(line, text, color);
    this.lineFonts[line].text = text;
    this.lineImages[line].tint = color || COLORS.WHITE;
};

TypeWriter.COLORS = COLORS;

module.exports = TypeWriter;
