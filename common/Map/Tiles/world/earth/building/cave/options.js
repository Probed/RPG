/**
 * Hut Tiles
 */
var options = require('../../../../TileTypes.js').TileType.Teleport({
    generator : ['Dungeon']
});

if (typeof exports != 'undefined') {
    exports.options = options;
}