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
    this.callbacks = {};
    this.visitedScenes = {};
    this.globals = {};

    this.textBuffer = [];
    this.events = {
        onReleaseControl: new Phaser.Signal(),
        onFreezeControl: new Phaser.Signal(),
        onShowMusicBox: new Phaser.Signal(),
        onDisableCurrentEntity: new Phaser.Signal()
    };

    this.gameEvents.onPuzzleSuccess.add(function (puzzle) {
        let callback = this.callbacks[
            `onPuzzleSuccess:${puzzle.type}:${puzzle.key}`];
        if (callback) { callback(); }
    }, this);

    this.gameEvents.onAction.add(function (entity) {
        let callback = this.callbacks[
            `onAction:${entity.scene}:${entity.type}:${entity.id}`];
        if (callback) { callback(); }
    }, this);

    this.gameEvents.onTouch.add(function (entity) {
        let callback = this.callbacks[
            `onTouch:${entity.scene}:${entity.type}:${entity.id}`];
        if (callback) { callback(); }
    }, this);

    this.gameEvents.onUntouch.add(function (entity) {
        let callback = this.callbacks[
            `onUntouch:${entity.scene}:${entity.type}:${entity.id}`];
        if (callback) { callback(); }
    }, this);

    this.gameEvents.onSceneEnter.add(function (sceneKey) {
        let wasVisited = this.visitedScenes[sceneKey] !== undefined;
        this.visitedScenes[sceneKey] = wasVisited ?
            this.visitedScenes[sceneKey] + 1 : 1;

        let enterCallback = this.callbacks[`onSceneEnter:${sceneKey}`];
        let firstEnterCallback =
            this.callbacks[`onSceneFirstEnter:${sceneKey}`];

        if (!wasVisited && firstEnterCallback) { firstEnterCallback(); }
        if (enterCallback) { enterCallback(!wasVisited); }
    }, this);
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
    this.callbacks['onTouch:room00:artifact:0'] = function () {
        if (!this.globals.sawArtifact) {
            this.events.onFreezeControl.dispatch();
            this.speak(CHARAS.HEROINE, 'What is this thing?');
            this.commitPage();
            this.speak(CHARAS.HEROINE, 'It looks like some kind of artifact.');
            this.commitPage();
            this.speak(CHARAS.HEROINE, 'I don\'t know why, but I have the impression');
            this.speak(CHARAS.HEROINE, 'that it is ancient.');
            this.commitPage();
            this.speak(CHARAS.HEROINE, 'What will happen if I touch it?');
            this.commitPage();
            this.writer.print();
            this.writer.events.onQueueFinish.addOnce(function () {
                this.events.onReleaseControl.dispatch();
                this.globals.sawArtifact = true;
                this.tooltip.write('Press <SPACEBAR> to interact.');
            }, this);
        }
        else {
            this.tooltip.write('Press <SPACEBAR> to interact.');
        }
    }.bind(this);

    this.callbacks['onUntouch:room00:artifact:0'] = function () {
        this.tooltip.erase();
    }.bind(this);

    this.callbacks['onAction:room00:artifact:0'] = function () {
        this.tooltip.erase();
        this.events.onShowMusicBox.dispatch('TEST');
        this.events.onDisableCurrentEntity.dispatch();
    }.bind(this);

    this.callbacks['onPuzzleSuccess:musicbox:TEST'] = function () {
        this.events.onFreezeControl.dispatch();
        this.speak(CHARAS.HEROINE, 'That was easy!');
        this.commitPage();
        this.speak(CHARAS.HEROINE, 'But has it changed anything?');
        this.commitPage();
        this.writer.print();
        this.writer.events.onQueueFinish.addOnce(function () {
            this.events.onReleaseControl.dispatch();
        }, this);
    }.bind(this);

    this.callbacks['onSceneFirstEnter:room00'] = function () {
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
    }.bind(this);
};

module.exports = Story;
