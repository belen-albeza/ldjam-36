'use strict';

var Cloud = require('../prefabs/cloud.js');
var Artifact = require('../prefabs/artifact.js');

const TILES = [
    { gid: 106, sprite: Artifact, args: { artifactId: 0 } }
];


const LAYERS = ['background01', 'foreground00', 'foreground01', 'logic'];

function getPositionFromIndex(data, index) {
    return {
        row: Math.floor(index / data.width),
        col: index % data.width
    };
}

function Scene(game, sceneKey, attrezzoGroup, spritesGroup) {
    this.game = game;
    this.key = sceneKey;
    var data = JSON.parse(game.cache.getText(`map:${sceneKey}`));

    this.map = game.add.tilemap(null, data.tilewidth, data.tileheight,
        data.width, data.height);
    this.map.addTilesetImage('world', 'tiles:world',
        data.tilewidth, data.tileheight, 4, 4, 0);

    this.layers = LAYERS.map(function (layerName) {
        // create empty layer
        let l = this.map.createBlankLayer(layerName, data.width, data.height,
            data.tilewidth, data.tileheight);
        // fill layer with tile data
        let tiles = data.layers.find(x => x.name === layerName).data;
        tiles.forEach(function (tile, index) {
            if (tile === -1) { return; }

            let position = getPositionFromIndex(data, index);
            if (layerName !== 'logic') {
                this.map.putTile(tile, position.col, position.row, l);
            }
            else {
                let entity = TILES.find(x => x.gid === tile);
                if (entity) {
                    spritesGroup.add(new entity.sprite(
                        this.game,
                        position.col * data.tilewidth + data.tilewidth / 2,
                        (position.row + 1) * data.tileheight,
                        entity.args));
                }
            }
        }, this);

        return l;
    }, this);

    this.layers[0].resizeWorld();
    this.layers[this.layers.length-1].visible = false; // hide logic layer

    this._spawnAttrezzo(attrezzoGroup);
}

Scene.prototype._spawnAttrezzo = function (group) {
    group.add(new Cloud(this.game, 100, 130));
    group.add(new Cloud(this.game, 500, 250));
    group.add(new Cloud(this.game, 1200, 80));
};

module.exports = Scene;
