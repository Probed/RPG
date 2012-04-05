/**
 * Liquid Terrain Tiles
 *
 */
var options = require('../../../TileTypes.js').TileType.Traversable({
    foot : {
	cost : [-100,100,5]
    },
    boat : {
	cost : [-100,100,5]
    }
});

if (typeof exports != 'undefined') {
    exports.options = options;
}