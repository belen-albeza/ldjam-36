'use strict';

var Cloud = require('./prefabs/cloud.js');

var TitleState = {};

const TEXT = [
    { txt: 'The Language of the Gods', offset: 0 },
    { txt: 'by', offset: 2 },
    { txt: '@ladybenko', offset: 3}
];


TitleState.init = function () {
    this.game.stage.setBackgroundColor(0xeec39a);
};

TitleState.create = function () {
    // this.game.world.resize(this.game.width, this.game.height);
    this.game.world.setBounds(0, 0, this.game.width, this.game.height);
    this.game.add.image(0, 0, 'background');
    let group = this.game.add.group();

    this.lines = TEXT.map(function (line) {
        let font = this.game.add.retroFont('font', 16, 24,
            Phaser.RetroFont.TEXT_SET2.replace(' ', '') + ' ');
        font.text = line.txt;

        let img = this.game.add.image(
            this.game.world.width / 2, 160 + line.offset * 32, font);
        img.anchor.setTo(0.5, 0);
        img.tint = 0x45283c;
    }, this);

    let font = this.game.add.retroFont('font', 16, 24,
        Phaser.RetroFont.TEXT_SET2.replace(' ', '') + ' ');
    font.text = 'Press <SPACEBAR> to start';
    let tip = this.game.add.image(this.game.world.width / 2, 496, font);
    tip.anchor.setTo(0.5, 1);
    tip.tint = 0x595652;

    group.add(new Cloud(this.game, 100, 130));
    group.add(new Cloud(this.game, 500, 250));
    group.add(new Cloud(this.game, 1200, 80));

    let space = this.game.input.keyboard.addKey(Phaser.KeyCode.SPACEBAR);
    this.game.input.keyboard.addKeyCapture([Phaser.KeyCode.SPACEBAR]);
    space.onUp.add(function () {
        this.game.state.start('play', true, false, 'intro');
    }, this);
};

module.exports = TitleState;
