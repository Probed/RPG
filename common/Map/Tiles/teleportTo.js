/**
 * Teleports a Character from one map location to another map & location
 *
 */
if (!RPG) var RPG = {};
if (!RPG.Tiles) RPG.Tiles = {};
if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../../optionConfig.js'));
    Object.merge(RPG,require('./Tiles.js'));
    Object.merge(RPG,require('./Utilities.js'));
    Object.merge(RPG,require('../Generators/Utilities.js'));
//    Object.merge(RPG,require('../Generators/Dungeon.js'));
//    Object.merge(RPG,require('../Generators/House.js'));
//    Object.merge(RPG,require('../Generators/Terrain.js'));
    module.exports = RPG;
}


/**
 * Options:
 * game : the game object which includes things like the universe, character etc
 * tiles : the array of tiles for which the tile type is being triggered
 * merged : contains the merged options of all the tiles
 * contents : contains the options for this specific TileType from the merged options. Use This Mostly.
 * event : [onBeforeEnter, onEnter, onLeave etc]
 *
 * callback : MUST CALLBACK
 */
RPG.Tiles.teleportTo = function(options,callback) {

    switch (options.event) {
	case 'onBeforeEnter' :
	    if (options.contents.warn && typeof exports != 'undefined') {
		//warn then callback (client side only)
		callback();
	    } else {
		callback();
	    }
	    break;


	case 'onEnter' :
	    if (!options.contents.mapName && options.contents.generator) {
//		var g = RPG.Generator[options.contents.generator].random(options.merged.property.tileName);
//		var randRow = Object.getSRandom(g.generated.tiles);
//		var randCol = Object.getSRandom(randRow.rand);
//		var charStartPoint = [Number.from(randRow.key),Number.from(randCol.key)];

		if (typeof exports != 'undefined') {//server
		//save new universe

		} else {//client

		}
		callback();
	    } else {
		callback({
		    error : 'No suitable map found for teleportation.'
		});
	    }
	    break;


	default :
	    callback();
    }
}