/**
 * Tile Types:
 *
 * Here we define tile types used by various different tiles
 * each can be overriden by providing an options argument
 *
 *  a TileType function returns an options constraints object that is compatible with RPG.optionsCreator and RPG.optionsValidator in /common/optionConfig.js
 *
 *  The options constraint object is used to determine what values are allowed
 *
 *  TileTypes can be merged together to give a tile multiple types.
 *  eg. Object.merge(
 *	    RPG.TileType.Traversable({
 *		foot : { cost : [-100,100,1] }
 *	    }),
 *	    RPG.TileType.Teleport()
 *	);
 *	This tile will allow a character to walk over it on foot (cost:(default=1)) only, and triggers a teleport check
 *
 *	The final object would look somthing like this:
 *	{
 *	    property : {
 *		...(all tiles receive the property object from /common/Map/Tiles/options.js)...
 *	    },
 *	    traversable : {
 *		...
 *	    },
 *	    teleportTo : {
 *		...
 *	    }
 *	}
 *
 *	All Newly created tiles (using RPG.createTile) will be populated with default values then merged with their final values overwriting any defaults
 *
 *	A corrpsponding file needs to be created in /common/Map/Tiles where the fileName = options_constraint name ie: teleportTo.js or  traverse.js  (not the TileType name
 *	this file will be used to perform the actions associated with the tiletype
 */
if (!RPG) var RPG = {};
if (!RPG.TileType) RPG.TileType = {};
if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../../Random.js'));
    Object.merge(RPG,require('../../Character/Character.js'));
    module.exports = RPG;
}

RPG.TileType.Property = function(options) {
    return {
	property : Object.merge({
	    tileName : ["/^[a-zA-Z0-9'.`_ ]+$/",1,50],
	    folderName : ["/^[a-zA-Z0-9]+$/",1,50],
	    image : {
		name : [],
		size : [-200,200,100],
		top : [-200,200,0],
		left : [-200,200,0],
		repeat : ['no-repeat','repeat-x','repeat-y','repeat']
	    }
	},options||{})
    };
}


/**
 * Teleport Tile:
 * options :
 *	warn : true/false. Warn the user they are about to be teleported.
 *	mapName : the name of the map we teleporting to
 *	generator : the name of the Generator (from RPG.Generators) that will be used to build the map if no mapName is provided
 *	point : [x,y] location on the map where the character will be teleported to
 */
RPG.TileType.Teleport = function(options) {
    return {
	teleportTo : Object.merge({
	    warn : [false],
	    mapName : [],
	    generator : [''].append(Object.keys(require('../Generators/Generators.js').Generators)),
	    point : []
	},options)
    };
}

/**
 * Traversable Tile:
 *
 * These are tiles a character can actually walk on
 *
 * options :
 *	foot : cost
 *	etc
 */
RPG.TileType.Traversable = function(options) {
    return {
	traverse : Object.merge({
	    foot : {
		cost : [-100,100,100]
	    },
	    steed : {
		cost : [-100,100,100]
	    },
	    vehicle : {
		cost : [-100,100,100]
	    },
	    boat : {
		cost : [-100,100,100]
	    },
	    spaceship : {
		cost : [-100,100,100]
	    }
	},options||{})
    };
}

/**
 * lockable Tile:
 *
 * These are tiles that can locked/unlocked
 * locked tiles prevent a character from entering them unil unlocked.
 *
 * options :
 *	locked : true/false
 *	type : what puzzle to load to unlock the tile
 *	level : how difficult it is to unlock the tile
 *	Difficulty : difficulty setting
 *	seed : seed used to generate puzzle
 */
RPG.TileType.Lockable = function(options) {
    return {
	lockable : Object.merge({
	    locked : [false],
	    type : ['tumbler'],
	    level : [1,100,1],
	    Difficulty : Object.keys(RPG.Difficulty),
	    seed : [0,99999999999,Math.floor((Math.random() * (99999999999 - 1) + 1))]
	},options||{})
    };
}


/**
 * Trap Tile:
 *
 * These are tiles that can cause nasty things to happen to a character if they are not disarmed
  *
 * options :
 *	armed : true/false
 *	type : what puzzle to load to disarm the trap
 *	level : how difficult it is to unlock the tile
 *	Difficulty : difficulty setting
 *	seed : seed used to generate puzzle
 */
RPG.TileType.Trap = function(options) {
    return {
	trap : Object.merge({
	    armed : [true],
	    type : ['posion'],
	    level : [1,100,1],
	    Difficulty : Object.keys(RPG.Difficulty),
	    seed : [0,99999999999,Math.floor((Math.random() * (99999999999 - 1) + 1))],
	    attempts : [1,999,10],
	    attempt : 0
	},options||{})
    };
}