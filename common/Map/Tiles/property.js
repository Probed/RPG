/**
 * Handles Property triggers
 *
 */

if (!RPG) var RPG = {};
if (!RPG.Tiles) RPG.Tiles = {};
if (typeof exports != 'undefined') {
    module.exports = RPG;
}

/**
 * Options:
 * game : the game object which includes things like the universe, character etc
 * point : the location of the tiles
 * dir : director n/e/s/w
 * tiles : the array of tiles for which the tile type is being triggered
 * merged : contains the merged options of all the tiles
 * contents : contains the options for this specific TileType from the merged options. Use This Mostly.
 * event : [onBeforeEnter, onEnter, onLeave etc]
 * events : Contains all the results from the current round of TileType event triggers
 *
 * callback : MUST CALLBACK
 */
RPG.Tiles.property = function(options,callback) {

    //ALL Tiles Have Property options be careful here
    callback();
}