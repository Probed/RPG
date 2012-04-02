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

	RPG.Game.moveGameTile(options,{
	    tileType : 'roam',
	    tileOptions : function(tile,currentMap,tilePath) {

		var dir = Array.getSRandom(RPG.dirs);
		var newLoc = RPG[dir](options.game.point,1);
		var homeLoc = tile.options.roam.home;
		var distance = Math.sqrt(((homeLoc[0]-newLoc[0])*(homeLoc[0]-newLoc[0])) - ((homeLoc[1]-newLoc[1])*(homeLoc[1]-newLoc[1])));
		if (distance > tile.options.roam.radius) return null;

		//cant move to to a tile if it is not in the current cache
		var moveToTiles = currentMap.tiles && currentMap.tiles[newLoc[0]] && currentMap.tiles[newLoc[0]][newLoc[1]];
		if (!moveToTiles) {
		    return null;
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
		    return null;
		}

		//return new moveto info
		return {
		    point : newLoc,
		    options : {
			roam : {
			    distance : distance
			}
		    }
		};
	    },
	    storeWait : true
	}, function(universe){
	    if (!universe || Object.keys(universe).length == 0) {
		callback();
		return;
	    }
	    callback({
		universe : universe
	    });
	})

    } else {
	callback();
    }
}

RPG.TileTypes.roam.tickComplete = function(options,callback) {
    if (!options.events.universeStored && options.events.universe && Object.keys(options.events.universe).length > 0) {
	options.events.universeStored = true;
	RPG.Universe.store({
	    user : options.game.user,
	    universe : options.events.universe
	}, function(universe){
	    callback({
		universe : universe
	    });
	})
    } else {
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