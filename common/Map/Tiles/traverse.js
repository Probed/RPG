/**
 * Allows a character to move into the tile
 *
 */

if (!RPG) var RPG = {};
if (!RPG.Tiles) RPG.Tiles = {};
if (!RPG.Tiles.Traverse) RPG.Tiles.traverse = {};
if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../../../server/Map/MapEditor.njs'));
    Object.merge(RPG,require('../../../server/Character/Character.njs'));
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

//RPG.Tiles.traverse.onBeforeLeave = function(options,callback) {
//    callback();
//}

RPG.Tiles.traverse.onBeforeEnter = function(options,callback) {
    callback({
	traverse : true
    });
};

//RPG.Tiles.traverse.onLeave = function(options,callback) {
//    callback();
//}

RPG.Tiles.traverse.onEnter = function(options,callback) {
    if (options.events.onBeforeEnter.traverse) {
	if (typeof exports != 'undefined') {
	    //Server-Side
	    options.game.character.location.point = options.game.moveTo;
	    options.game.character.location.dir = options.game.dir.charAt(0);

	    RPG.Character.store({
		user : options.game.user,
		character : options.game.character
	    },function(character) {
		if (character.error) {
		    callback(character);
		    return;
		}
		Object.merge(options.game.character,character);
		callback();
	    });
	} else {
	    callback();
	}
    } else {
	callback({
	    error : 'Cannot move to that tile.'
	});
    }
}