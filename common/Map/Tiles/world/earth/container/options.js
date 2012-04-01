/*
 * Container Tiles
 *
 */
exports.options = Object.merge(
    require('../../../TileTypes.js').TileType.Lockable({
	preventTraverse : [false],
	collectable : [true]
    }),
    require('../../../TileTypes.js').TileType.Container()
    );