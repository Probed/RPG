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
    if (typeof exports != 'undefined' && options.contents.can) {
	//server side

	var move = {};

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
	RPG.Game.moveGameTiles(options,move,function(universe){
	    var moveClone = Object.clone(move);//send back to the client
	    Object.erase(options.events.tick,'move');//remove so we don't call RPG.moveGameTiles more than once.
	    callback({
		move : moveClone,
		game : {
		    universe : universe
		}
	    });
	});
    } else {
	//client
	callback();
    }
}

//RPG.TileTypes.roam.onBeforeLeave = function(options,callback) {
//    callback();
//}
//
//RPG.TileTypes.roam.onBeforeEnter = function(options,callback) {
//    callback();
//}
//
//RPG.TileTypes.roam.onLeave = function(options,callback) {
//    callback();
//}
//
//RPG.TileTypes.roam.onEnter = function(options,callback) {
//    callback();
//}