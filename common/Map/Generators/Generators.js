if (!RPG) var RPG = {};
if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../../optionConfig.js'));
    module.exports = RPG;
}

/**
 * The GeneratorBaseClass defines the the minimum requirements for a Generator
 * this Class is extened by all generators
 */
RPG.GeneratorBaseClass = new Class({

    /**
     * The name of the generator for access
     * Should be added to RPG.Generators to define available generators
     */
    name : '',

    /**
     * Option Constraints which are used to define what options this generator
     * uses to generate the content.
     *
     * The random funcion uses these constraints to generate random options.
     * keep that in mind when defining them
     *
     * Example :
     *    {
     *        property : {
     *            name : ["a-zA-Z1-9",1,10],
     *            size : [0,1,10]
     *        }
     *    }
     */
    constraints : {},

    /**
     * random uses the constraints object to generate random options then calls generate
     *
     *
     * This parent method creates a universe for the generated content to go into
     *
     * once the content has been generated we will callback. MUST proved a callback. app will appear to hang if no callback is made
     *
     * callback({
     *	    options : {},  //the random options tha were created
     *	    universe : {}, //the universe object created by random which may be merged into another universe
     *	    generated : {} //the object returned from the generate function
     *   })
     */
    random : function(mapName,rand,callback){
	rand = rand || RPG.Random;
	var universe = {
	    maps : {}
	};
	var map = universe.maps[mapName] = {};
	map.options = {
	    property : {
		mapName : mapName,
		author : 'Generated'
	    }
	};
	map.options.generator = {};
	map.options.generator[this.name] = {
	    options : RPG.optionCreator.random(this.constraints,rand)
	};
	this.generate(map.options.generator[this.name].options,rand,function(generated){
	    map.tiles = generated.tiles;
	    map.cache = generated.cache;
	    callback({
		options : map.options.generator[this.name].options,
		universe : universe,
		generated : generated
	    });
	}.bind(this));
    },

    /**
     * Takes options created from this.constraints and generates content
     *
     * callback must be provided and callback must be invoked by generate
     * app will appear to hang if no callback is made
     *
     * The object be sent back NEEDS to contain at least three objects
     * Required: {
     *     tiles : {}, //a populated map.tiles object
     *     cache : {}, //a populated map.cache object
     *     possibleStartLocations : [], //array of points where the user can enter the map
     * }
     */
    generate : function(options,rand,callback){
	callback({});
    }
});



/**
 * A List of available Map Generators and their required input
 */
RPG.Generators = {
    Terrain : {
	require :{
	    js : ['/common/map/Generators/Terrain.js','/common/map/Generators/diamond-square.js','/common/map/Generators/Words.js']
	}
    },
    Dungeon : {
	require :{
	    js : ['/common/map/Generators/Dungeon.js','/common/map/Generators/Maze.js','/common/map/Generators/Words.js']
	}
    },
    House : {
	require :{
	    js : ['/common/map/Generators/House.js','/common/map/Generators/Words.js']
	}
    },
    Maze : {
	require :{
	    js : ['/common/map/Generators/Maze.js','/common/map/Generators/Words.js']
	}
    }
}