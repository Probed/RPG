/**
 * Door Tiles
 */
var options = require('../../../TileTypes.js').TileType.Traversable({
    foot : {
	cost : [-100,100,1]
    }
});

if (typeof exports != 'undefined') {
    exports.options = options;
}