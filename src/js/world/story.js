'use strict';

var TypeWriter = require('../ui/type_writer.js');

const CHARAS = {
    GAME: {name: 'Game', color: 'GRAY'},
    HEROINE: {name: 'Heroine', color: 'BLUE'},
    GOD: {name: 'Alien God', color: 'ORANGE'}
};


function Story(game, typeWriter, tooltip, gameEvents) {
    this.game = game;
    this.writer = typeWriter;
    this.tooltip = tooltip;
    this.gameEvents = gameEvents;

    this.textBuffer = [];
    this.events = {
        onReleaseControl: new Phaser.Signal(),
        onFreezeControl: new Phaser.Signal()
    };
}

Story.prototype.start = function () {
    this._setupIntro();
};

Story.prototype.speak = function (character, text) {
    if (this.textBuffer.length === TypeWriter.LINE_COUNT) {
        console.warn('The type writer can\'t accept more lines');
    }
    else {
        this.textBuffer.push({
            text: text,
            color: TypeWriter.COLORS[character.color]
        });
    }
};

Story.prototype.commitPage = function () {
    if (this.textBuffer.length > 0) {
        this.writer.page(this.textBuffer);
        this.textBuffer = [];
    }
    else {
        console.warn('There are no lines for the type writer');
    }
};

Story.prototype._setupIntro = function () {
    // this.events.onRoomEnter.addOnce(function () {
        this.events.onFreezeControl.dispatch();
        this.speak(CHARAS.HEROINE, 'What... is this?');
        this.commitPage();
        this.speak(CHARAS.HEROINE, 'What am I doing here...?');
        this.commitPage();
        this.writer.print();

        this.tooltip.write('Press <SPACEBAR> to continue.');

        this.writer.events.onQueueFinish.addOnce(function () {
            this.tooltip.write('Press <ARROW KEYS> to move left and right.');
            this.events.onReleaseControl.dispatch();
            this.gameEvents.onHeroineMove.addOnce(function () {
                this.tooltip.erase();
            }, this);
        }, this);
    // }, this);
};

module.exports = Story;
