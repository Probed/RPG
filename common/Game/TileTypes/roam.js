/**
 * Handles Roam triggers
 *
 */

if (!RPG) var RPG = {};
if (!RPG.TileTypes) RPG.TileTypes = {};
if (!RPG.TileTypes.roam) RPG.TileTypes.roam = {};
if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../../../server/Game/game.njs'));
    Object.merge(RPG,require('../../../server/Log/Log.njs'));
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

RPG.TileTypes.roam.tick = function(options,callback) {

    var move = {};//hold our move options

    options.tiles.each(function(tilePath,index) {

	var currentMap = options.game.universe.maps[options.game.character.location.mapName];
	var tile = Object.getFromPath(currentMap.cache,tilePath);
	if (!tile || !tile.options || !tile.options.roam) return; //only care about roam tiles.

	var dir = Array.getSRandom(RPG.dirs);
	var newLoc = RPG[dir](options.game.point,1);
	var homeLoc = tile.options.roam.home;
	var distance = Math.sqrt(((homeLoc[0]-newLoc[0])*(homeLoc[0]-newLoc[0])) - ((homeLoc[1]-newLoc[1])*(homeLoc[1]-newLoc[1])));
	if (distance > tile.options.roam.radius) return;

	//cant move to to a tile if it is not in the current cache
	var moveToTiles = currentMap.tiles && currentMap.tiles[newLoc[0]] && currentMap.tiles[newLoc[0]][newLoc[1]];
	if (!moveToTiles) {
	    return;
	}
	var moveToOk = false;

	//see if the new location tile is traversable
	moveToTiles.each(function(moveToPath){
	    var m = Object.getFromPath(currentMap.cache,moveToPath);
	    if (m && m.options && m.options.traverse) {
		moveToOk = true;
	    }
	});
	//return if not traversable:
	if (!moveToOk) {
	    return;
	}

	move[JSON.encode(newLoc)] = {};
	move[JSON.encode(newLoc)][JSON.encode(tilePath)] = {
	    from : options.game.point,
	    dir : dir
	};
    });
    if (Object.keys(move).length > 0) {
	callback({
	    move : move //this will get merged with other 'tick' roams then in tick complete it is parsed and saved.
	});
    } else {
	callback();
    }
}

RPG.TileTypes.roam.tickComplete = function(options,callback) {
    if (typeof exports != 'undefined') {
	//server
	var move = Object.getFromPath(options,'events.tick.move');
	if (!move) {
	    callback();
	    return;
	}
	var moveUni = RPG.moveTiles({
	    universe : options.game.universe,
	    mapName : options.game.character.location.mapName,
	    move : move
	});

	if (!moveUni || (moveUni && moveUni.error)) {
	    callback({
		error : moveUni.error
	    });
	    return;
	}

	RPG.Universe.store({
	    user : options.game.user,
	    universe : moveUni
	},function(universe){
	    if (universe && universe.error) {
		callback({
		    error : universe.error
		});
		return;
	    }

	    var moveClone = Object.clone(move);//send back to the client
	    Object.erase(options.events.tick,'move');//remove so we don't call store more than once.

	    //since the client does not process 'tick' events we need to send back the information to be merged with the client game
	    callback({
		move : moveClone,
		game : {
		    universe : moveUni //send back to the client our updated universe
		}
	    });
	});
    } else {
	//client
	callback();
    }
}