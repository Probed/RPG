/**
 * Allows a character to move into the tile
 *
 */

if (!RPG) var RPG = {};
if (!RPG.TileTypes) RPG.TileTypes = {};
if (!RPG.TileTypes.Traverse) RPG.TileTypes.traverse = {};
if (typeof exports != 'undefined') {
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

//RPG.TileTypes.traverse.onBeforeLeave = function(options,callback) {
//    callback();
//}

RPG.TileTypes.traverse.onBeforeEnter = function(options,callback) {
    callback({
	traverse : true
    });
};

//RPG.TileTypes.traverse.onLeave = function(options,callback) {
//    callback();
//}

RPG.TileTypes.traverse.onEnter = function(options,callback) {
    if (typeof exports != 'undefined') {

	//Server-Side
	if (options.events.onBeforeEnter.traverse) {

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

		//send the back to the client
		callback({
		    game : {
			character : {
			    location : {
				point : options.game.moveTo,
				dir : options.game.dir.charAt(0)
			    }
			}
		    }
		});
	    });
	} else {
	    callback();//do nothing
	    return;
	}
    } else {

	//client-side
	if (options.events.onBeforeEnter.traverse) {
	    callback();
	} else {
	    callback({
		error : 'Cannot move to that tile.'
	    });
	}
    }
}