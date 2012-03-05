/**
 * Hut Tiles
 */
var options = require('../../../../TileTypes.js').TileType.Teleport({
    generator : ['Maze']
});

if (typeof exports != 'undefined') {
    exports.options = options;
}