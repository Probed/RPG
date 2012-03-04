/**
 * Allows a character to move into the tile
 *
 */

if (!RPG) var RPG = {};
if (!RPG.Tiles) RPG.Tiles = {};
if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../../../server/Map/MapEditor.njs'));
    Object.merge(RPG,require('../../../server/Character/Character.njs'));
    module.exports = RPG;
}

/**
 * Options:
 * game : the game object which includes things like the universe, character etc
 * point : the location of the tiles
 * dir : director n/e/s/w
 * tiles : the array of tiles for which the tile type is being triggered
 * merged : contains the merged options of all the tiles
 * contents : contains the actual options for this specific TileType from the merged options. Use This Mostly.
 * event : [onBeforeEnter, onEnter, onLeave etc]
 * events : Contains all the results from the current round of TileType event triggers
 *
 * callback : MUST CALLBACK
 */
RPG.Tiles.traverse = function(options,callback) {

    switch (options.event) {
	case 'onBeforeEnter' :
	    callback({
		traverse : true
	    });
	    break;


	case 'onEnter' :
	    if (options.events.onBeforeEnter.traverse) {

		if (typeof exports != 'undefined') {
		    //Server-Side
		    options.game.character.location.point = options.point;
		    options.game.character.location.dir = options.dir.charAt(0);

		    RPG.Character.beginCharacterSave({
			user : options.game.user,
			url : {
			    query : {
				characterID : options.game.character.database.characterID
			    }
			},
			data : options.game.character
		    },
		    //response
		    {
			onRequestComplete : function(r,character) {
			    if (character.error) {
				callback(character);
				return;
			    }
			    options.game.character = character;
			    callback();
			}
		    });
		} else {
		    //Client-Side
		    new Request.JSON({
			url : '/index.njs?xhr=true&a=Play&m=MoveCharacter&characterID='+options.game.character.database.characterID+'&dir='+options.dir,
			onFailure : function(error) {
			    RPG.Error.notify(error);
			    callback();
			},
			onSuccess : function(results) {
			    Object.merge(options.game,results.game);
			    callback({
				traverse : results.events
			    });
			}
		    }).get();
		}
	    } else {
		callback();
	    }
	    break;


	default :
	    callback();
    }

}