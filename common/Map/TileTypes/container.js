/**
 * Handles container triggers
 *
 */

if (!RPG) var RPG = {};
if (!RPG.TileTypes) RPG.TileTypes = {};
if (!RPG.TileTypes.container) RPG.TileTypes.container = {};
if (typeof exports != 'undefined') {
    module.exports = RPG;
}

/**
 * Options:
 * game : the game object which includes things like the user, universe, character, moveTo, dir etc
 * tiles : the array of tiles for which the tile type is being triggered
 * merged : contains the merged options of all the tiles
 * contents : contains the actual options for this specific TileType from the merged options. Use This Mostly.
 * event : [onBeforeEnter, onEnter, onLeave etc]
 * events : Contains all the results from the current round of TileType event triggers
 *
 * callback : MUST CALLBACK game will appear to hang if callback is not called.
 */

//RPG.TileTypes.container.tick = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.container.tickComplete = function(options,callback) {
//    callback();
//}

RPG.TileTypes.container.activate = function(options,callback) {
    callback();
}

RPG.TileTypes.container.activateComplete = function(options,callback) {
    callback();
}

//RPG.TileTypes.container.onBeforeLeave = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.container.onBeforeEnter = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.container.onLeave = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.container.onEnter = function(options,callback) {
//    callback();
//}