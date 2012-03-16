var RPG = module.exports = {};

Object.merge(RPG,
    require('../Map/Universe.njs'),
    require('../Character/Character.njs'),
    require('../../common/Map/Generators/Dungeon.js'),
    require('../../common/Map/Generators/House.js'),
    require('../../common/Map/Generators/Terrain.js')
    );

RPG.InitGame = new (RPG.InitGameClass = new Class({
    Implements : [Events,Options],
    options : {},
    initialize : function(options) {
	this.setOptions(options);
    },

    /**
     * required options
     * user,
     * characterID
     */
    startGame : function(options, callback) {

	/**
	 *
	 */
	RPG.Character.load(options,function(character) {
	    if (!character || character.error) callback(character);

	    /**
	     * Determine if we need to generate a new game
	     */
	    options.character = character;
	    if (!character.location) {
		this.newGame(options, callback);
	    } else {
		callback(character);
	    }
	}.bind(this));
    },

    /**
     * required options
     * user,
     * character
     */
    newGame : function(options, callback) {
	var mapName = 'StartMap';
	var universe = {
	    options : {
		property : {
		    universeName :options.character.name + "'s Universe",
		    author : 'Generated',
		    startMap : mapName
		},
		settings : {
		    activeMap : mapName
		}
	    },
	    maps : {}
	};

	universe.maps[mapName] = {
	    options :  {
		property : {
		    mapName : mapName,
		    author : 'Generated'
		}
	    }
	};

	var rand = Object.clone(RPG.Random);
	rand.seed =(Math.random() * (99999999999 - 1) + 1);

	RPG.Generator.Terrain.random(mapName,{
	    properties : {
		Difficulty : options.character.Difficulty,
		level : options.character.level
	    }
	},rand,function(random){
	    Object.merge(universe,random.universe);
	    var charStartPoint = Array.getSRandom(random.generated.possibleStartLocations,rand);

	    options.universe = universe;
	    options.bypassCache = true;

	    RPG.Universe.store(options, function(universe) {
		if (!universe || universe.error) {
		    callback(universe);
		    return;
		}

		options.character.location = {
		    universeID : universe.options.database.universeID,
		    mapID : universe.maps[mapName].options.database.mapID,
		    mapName : mapName,
		    point : charStartPoint,
		    dir : 's'
		};

		RPG.Character.store(options,function(character) {
		    callback(character);
		});
	    });
	});


    }
}))();