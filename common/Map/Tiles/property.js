/**
 * Handles Property triggers
 *
 */

if (!RPG) var RPG = {};
if (!RPG.Tile) RPG.Tile = {};
if (typeof exports != 'undefined') {
    Object.merge(
	RPG,require('../../optionConfig.js'),
	RPG,require('./Tiles.js'),
	RPG,require('../Generators/Utilities.js'));
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
 *
 * callback : MUST CALLBACK
 */
RPG.Tile.property = function(options,callback) {

    //ALL Tiles Have Property options be careful here
    callback();
}