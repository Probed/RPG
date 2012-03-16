/**
 * Door Tiles
 */
exports.options = Object.merge(
    require('../../../TileTypes.js').TileType.Traversable({
	foot : {
	    cost : [-100,100,1]
	}
    }),
    require('../../../TileTypes.js').TileType.Lockable()
    );