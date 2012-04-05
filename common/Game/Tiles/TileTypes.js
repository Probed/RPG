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
 *		...(all tiles receive the property object from /common/Game/Tiles/options.js)...
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
 *	A corrpsponding file needs to be created in /common/Game/Tiles where the fileName = options_constraint name ie: teleportTo.js or  traverse.js  (not the TileType name
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
 *	generator : the name of the Generator (from RPG.Generators.Map) that will be used to build the map if no mapName is provided
 *	point : [x,y] location on the map where the character will be teleported to
 */
RPG.TileType.Teleport = function(options) {
    return {
	teleportTo : Object.merge({
	    warn : [true],
	    mapName : [],
	    generator : [''].append(Object.keys(require('../Generators/Generators.js').Generators.Map)),
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
	    }
	},options||{})
    };
}

/**
 * lockable Tile:
 *
 * These are tiles that can locked/unlocked
 * locked tiles can prevent a character from entering them unil unlocked.
 */
RPG.TileType.Lockable = function(options) {
    return {
	lockable : Object.merge({
	    locked : [false],   //is it locked?
	    type : ['tumbler'], //what puzzle to load to unlock the tile
	    level : [1,100,1],  //how difficult it is to unlock the tile
	    Difficulty : Object.keys(RPG.Difficulty), //difficulty setting
	    seed : [0,99999999999,Math.floor((Math.random() * (99999999999 - 1) + 1))], //seed used to generate puzzle
	    secret : '',
	    preventTraverse : [true], //stop the character from entering tiles that are locked
	    collectable : [false] //allow the character to collect this locked tile into thier inventory
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
	    secret : '',
	    attempts : [1,999,10],
	    attempt : 0
	},options||{})
    };
}



/**
 * Switch Tile:
 *
 * These tiles allow you to switch options of another tile
 *
 * options :
 *	type : what type of switch is this
 *	state : what is the current state of the switch eg : ['On','Off']
 *
 *	states : {
 *	    'On'  : [] array of on changes
 *	    'Off' : [] array of off changes
 *	    //etc
 *	}
 *
 *  @todo this will not display correctly in the Map Editor. need to fix optionsConfig to handle array of objects
  */
RPG.TileType.Switch = function(options) {
    return {
	'switch' : Object.merge({
	    auto : [false],
	    type : ['lever'],
	    state : ['Open','Closed'],
	    states : {
		'Open' : [{
		    path : '',
		    options : ''
		}],
		'Closed' : [{
		    path : '',
		    options : ''
		}]
	    }
	},options||{})
    };
}


/**
 * NPC
 *
 * Much like an actual character, NPC's have gender/race/class/stats etc
 *
 *
 */
RPG.TileType.NPC = function(options) {
    return {
	npc : Object.merge(
	    //clone and filter the character options:
	    Object.filter(RPG.character_options,function(value,key){
		return key != 'portrait' && key != 'name';
	    }),
	    //add some NPC only options
	    {
		lives : 1,//override character lives
		disposition : ['Terrified','Frightend','Cautious','Friendly','Neutral','Angered','Hostile','Bloodthirsty']
	    }
	    ,options||{})
    };
}

/**
 * Roam
 *
 * Allows the tile to move around
 */
RPG.TileType.Roam = function(options) {
    return {
	roam : Object.merge({
	    can : [true],
	    home : '',//spawn point
	    radius : [0,15,0]//how far can they go
	}
	,options||{})
    };
}


/**
 * Container
 *
 */
RPG.TileType.Container = function(options) {
    return {
	container : Object.merge({
	    items : [{}]//@todo this will not display correctly in the Map Editor. need to fix optionsConfig to handle array of objects
	}
	,options||{})
    };
}

/**
 * Item
 *
 */
RPG.TileType.Item = function(options) {
    return {
	item : Object.merge({
	    generator : Object.keys(require('../Generators/Generators.js').Generators.Item),
	    identified : [false],
	    level : [0,100,0],
	    cost : [0,5,0],
	    weight : [1,1,1]
	}
	,options||{})
    };
}