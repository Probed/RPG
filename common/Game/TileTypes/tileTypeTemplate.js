/**
 * Handles template triggers
 *
 */

if (!RPG) var RPG = {};
if (!RPG.TileTypes) RPG.TileTypes = {};
if (!RPG.TileTypes.template) RPG.TileTypes.template = {};
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

//RPG.TileTypes.template.tick = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.template.tickComplete = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.template.activate = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.template.activateComplete = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.template.onBeforeLeave = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.template.onBeforeEnter = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.template.onLeave = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.template.onEnter = function(options,callback) {
//    callback();
//}