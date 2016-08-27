'use strict';

var Cloud = require('../prefabs/cloud.js');

const LAYERS = ['background00', 'background01', 'foreground00', 'foreground01'];

function getPositionFromIndex(data, index) {
    return {
        row: Math.floor(index / data.width),
        col: index % data.width
    };
}

function Scene(game, sceneKey, attrezzoGroup) {
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
            let position = getPositionFromIndex(data, index);
            if (tile !== -1) {
                this.map.putTile(tile, position.col, position.row, l);
            }
        }, this);

        return l;
    }, this);

    this.layers[0].resizeWorld();

    this._spawnAttrezzo(attrezzoGroup);
}

Scene.prototype._spawnAttrezzo = function (group) {
    group.add(new Cloud(this.game, 100, 130));
    group.add(new Cloud(this.game, 500, 250));
    group.add(new Cloud(this.game, 1200, 80));
};

module.exports = Scene;
