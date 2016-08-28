'use strict';

var MusicGem = require('../prefabs/music_gem.js');

function MusicBox(group, keys, audioNotes) {
    this.game = group.game;
    this.group = group;
    this.keys = keys;
    this.events = {
        onSuccess: new Phaser.Signal(),
        onFailure: new Phaser.Signal()
    };
    this.audioNotes = audioNotes;

    let bg = this.group.add(new Phaser.Image(this.game, 0, 0, 'music_box_bg'));
    this.gems = [
        this.group.add(new MusicGem(this.game, 32, 32)),
        this.group.add(new MusicGem(this.game, 160, 32)),
        this.group.add(new MusicGem(this.game, 288, 32)),
        this.group.add(new MusicGem(this.game, 416, 32))
    ];

    this.group.position.setTo(this.game.width / 2 - bg.width / 2, 100);

    // TODO: hardcoded temp
    this.melody = [
        {index: 0, start: 0, duration: 300},
        {index: 3, start: 1000, duration: 300},
        {index: 2, start: 1500, duration: 300},
        {index: 1, start: 2000, duration: 300}
    ];
}

MusicBox.prototype.activate = function () {
    this.play();
};

MusicBox.prototype.play = function () {
    this.isListening = false;

    this.timer = this.game.time.create(); // this will be autodestroyed
    this.melody.forEach(function (note) {
        this.timer.add(note.start, this._playNote, this, note.index);
        this.timer.add(note.start + note.duration, this._stopNote, this,
            note.index);
    }, this);
    this.timer.start();

    this.timer.onComplete.addOnce(this.listen, this);
};

MusicBox.prototype.listen = function () {
    this.isListening = true;
    this.listenBuffer = [];
    // this.timer = this.game.time.create(); // this will be autodestroyed
    // this.timer.start();

    // bind up keys
    this.keys.left.onDown.add(this._recordNote0, this);
    this.keys.down.onDown.add(this._recordNote1, this);
    this.keys.up.onDown.add(this._recordNote2, this);
    this.keys.right.onDown.add(this._recordNote3, this);
};

MusicBox.prototype.cleanUpEvents = function () {
    this.keys.left.onDown.remove(this._recordNote0, this);
    this.keys.down.onDown.remove(this._recordNote1, this);
    this.keys.up.onDown.remove(this._recordNote2, this);
    this.keys.right.onDown.remove(this._recordNote3, this);
};

MusicBox.prototype._recordNote0 = function () { this._recordNote(0); };
MusicBox.prototype._recordNote1 = function () { this._recordNote(1); };
MusicBox.prototype._recordNote2 = function () { this._recordNote(2); };
MusicBox.prototype._recordNote3 = function () { this._recordNote(3); };

MusicBox.prototype._recordNote = function (index) {
    this.listenBuffer.push(index);
    this._playNote(index);

    if (this.melody[this.listenBuffer.length -1].index === index) {
        // success!
        if (this.listenBuffer.length === this.melody.length) {
            this._showSuccess();
            this.cleanUpEvents();
            this.game.time.events.add(1000, this.events.onSuccess.dispatch);
        }
    }
    else {
        // error
        this._showError();
        this.cleanUpEvents();
        this.game.time.events.add(1000, function () {
            this.events.onFailure.dispatch();
            this.play();
        }, this);
    }
};

MusicBox.prototype._showSuccess = function () {
    this.gems.forEach(function (gem) {
        gem.animations.play('success');
    });
}

MusicBox.prototype._showError = function () {
    this.gems.forEach(function (gem) {
        gem.animations.play('error');
    });
};

MusicBox.prototype._playNote = function (index) {
    this.gems[index].animations.play('active');
    this.audioNotes[index].play();
};

MusicBox.prototype._stopNote = function (index) {
    this.gems[index].animations.play('inactive');
};


module.exports = MusicBox;
