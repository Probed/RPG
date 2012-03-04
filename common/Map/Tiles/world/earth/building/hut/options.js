/**
 * Hut Tiles
 */
var options = require('../../../../TileTypes.js').TileType.Teleport({
    generator : ['House']
});

if (typeof exports != 'undefined') {
    exports.options = options;
}