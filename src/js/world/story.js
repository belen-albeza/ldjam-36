'use strict';

var TypeWriter = require('../ui/type_writer.js');

const CHARAS = {
    GAME: {name: 'Game', color: 'GRAY'},
    HEROINE: {name: 'Heroine', color: 'BLUE'},
    GOD: {name: 'Alien God', color: 'ORANGE'},
    NARRATOR: {name: 'Narrator', color: 'EMERALD'}
};


function Story(game, typeWriter, tooltip, gameEvents, sceneKey) {
    this.game = game;
    this.writer = typeWriter;
    this.tooltip = tooltip;
    this.gameEvents = gameEvents;
    this.callbacks = {};
    this.visitedScenes = {};
    this.globals = {};
    this.sceneKey = sceneKey;

    this.textBuffer = [];
    this.events = {
        onReleaseControl: new Phaser.Signal(),
        onFreezeControl: new Phaser.Signal(),
        onShowMusicBox: new Phaser.Signal(),
        onDisableCurrentEntity: new Phaser.Signal(),
        onTeleport: new Phaser.Signal()
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
    switch(this.sceneKey) {
        case 'intro':
            this._setupIntro();
            break;
        case 'room00':
            this._setupBuilding();
            break;
    }
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
    this.callbacks['onSceneFirstEnter:intro'] = function () {
        this.events.onFreezeControl.dispatch();
        this.speak(CHARAS.HEROINE, 'What... is this place?');
        this.commitPage();
        this.speak(CHARAS.HEROINE, 'What am I doing here?');
        this.commitPage();
        this.speak(CHARAS.HEROINE, 'I can\'t remember anything...');
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

    this.callbacks['onTouch:intro:decoration:1'] = function () {
        this.tooltip.write('Press <SPACEBAR> to interact.');
    }.bind(this);

    this.callbacks['onUntouch:intro:decoration:1'] = function () {
        this.tooltip.erase();
    }.bind(this);

    this.callbacks['onAction:intro:decoration:1'] = function () {
        this.events.onFreezeControl.dispatch();
        this.tooltip.erase();
        if (!this.globals.sawWreckage) {
            this.speak(CHARAS.HEROINE, 'This looks like the wreackage of a ship.');
            this.commitPage();
            this.speak(CHARAS.HEROINE, 'My ship?');
            this.commitPage();
            this.speak(CHARAS.HEROINE, 'Am I... stranded here?');
            this.commitPage();
            this.speak(CHARAS.GOD, 'You are not lost.');
            this.commitPage();
            this.speak(CHARAS.HEROINE, 'What was that?!');
            this.commitPage();
            this.speak(CHARAS.HEROINE, 'I think I heard something.');
            this.speak(CHARAS.HEROINE, 'It must be the shock.');
            this.commitPage();
        }
        else {
            this.speak(CHARAS.HEROINE, 'No survivors, just me.');
            this.commitPage();
        }
        this.writer.print();
        this.writer.events.onQueueFinish.addOnce(function () {
            this.globals.sawWreckage = true;
            this.events.onReleaseControl.dispatch();
        }, this);
    }.bind(this);

    this.callbacks['onTouch:intro:artifact:0'] = function () {
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

    this.callbacks['onUntouch:intro:artifact:0'] = function () {
        this.tooltip.erase();
    }.bind(this);

    this.callbacks['onAction:intro:artifact:0'] = function () {
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
            this.events.onTeleport.dispatch('room00');
        }, this);
    }.bind(this);


};

Story.prototype._setupBuilding = function () {
    this.callbacks['onSceneFirstEnter:room00'] = function () {
        this.events.onFreezeControl.dispatch();
        this.speak(CHARAS.HEROINE, 'What happened?!');
        this.commitPage();
        this.speak(CHARAS.HEROINE, 'I am in a different place now');
        this.commitPage();
        this.speak(CHARAS.HEROINE, 'Is this real?');
        this.commitPage();
        this.speak(CHARAS.GOD, 'That depends of your idea of reality.');
        this.commitPage();
        this.speak(CHARAS.HEROINE, 'WHAT?!');
        this.commitPage();
        this.speak(CHARAS.HEROINE, 'Who are you?!');
        this.commitPage();
        this.speak(CHARAS.GOD, 'I am who I am.');
        this.commitPage();
        this.writer.print();
        this.writer.events.onQueueFinish.addOnce(function () {
            this.events.onReleaseControl.dispatch();
        }, this);
    }.bind(this);

    this.callbacks['onAction:room00:artifact:0'] = function () {
        this.events.onFreezeControl.dispatch();
        this.speak(CHARAS.HEROINE, 'Another of these artifacts...');
        this.speak(CHARAS.HEROINE, 'Let\'s solve this!');
        this.commitPage();
        this.writer.print();
        this.writer.events.onQueueFinish.addOnce(function () {
            this.events.onReleaseControl.dispatch();
            this.events.onShowMusicBox.dispatch('SANDMAN');
            this.events.onDisableCurrentEntity.dispatch();
        }, this);
    }.bind(this);

    let onFinishFirstArtifact = function () {
        this.events.onFreezeControl.dispatch();
        this.speak(CHARAS.HEROINE, 'I think I\'m getting the hang of this...');
        this.commitPage();
        this.writer.print();
        this.writer.events.onQueueFinish.addOnce(function () {
            this.events.onReleaseControl.dispatch();
        }, this);
    }.bind(this);

    let onFinishSecondArtifact = function () {
        this.events.onFreezeControl.dispatch();
        this.speak(CHARAS.NARRATOR, 'Was this short? You bet!');
        this.commitPage();
        this.speak(CHARAS.NARRATOR, 'As you can see, I\'m was in a hurry');
        this.speak(CHARAS.NARRATOR, 'to finish on time for the jam.');
        this.commitPage();
        this.speak(CHARAS.NARRATOR, 'Please let me know if you liked it!');
        this.speak(CHARAS.NARRATOR, 'Thanks <3');
        this.speak(CHARAS.NARRATOR, '@ladybenko');
        this.commitPage();
        this.speak(CHARAS.HEROINE, 'What the hell was that?');
        this.commitPage();
        this.writer.print();
        this.writer.events.onQueueFinish.addOnce(function () {
            this.events.onReleaseControl.dispatch();
        }, this);
    }.bind(this);

    this.callbacks['onPuzzleSuccess:musicbox:SANDMAN'] = function () {
        if (this.globals.didSolveFirstArtifact) {
            onFinishSecondArtifact();
        }
        else {
            this.globals.didSolveFirstArtifact = true;
            onFinishFirstArtifact();
        }
    }.bind(this);

    this.callbacks['onAction:room00:artifact:1'] = function () {
        this.events.onShowMusicBox.dispatch('PASODOBLE');
        this.events.onDisableCurrentEntity.dispatch();
    }.bind(this);

    this.callbacks['onPuzzleSuccess:musicbox:PASODOBLE'] = function () {
        if (this.globals.didSolveFirstArtifact) {
            onFinishSecondArtifact();
        }
        else {
            this.globals.didSolveFirstArtifact = true;
            onFinishFirstArtifact();
        }
    }.bind(this);
};

module.exports = Story;
