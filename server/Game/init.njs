var RPG = module.exports = {};

Object.merge(RPG,
    require('./Universe.njs'),
    require('../Character/Character.njs'),
    //    require('../../common/Game/Generators/Test.js')
    require('../../common/Game/Generators/Dungeon.js'),
    require('../../common/Game/Generators/House.js'),
    require('../../common/Game/Generators/Terrain.js')
    );

var logger = RPG.Log.getLogger('RPG.InitGame');

RPG.InitGame = new (RPG.InitGameClass = new Class({

    initialize : function() {
	logger.info('Initialize.');
    },
    /**
     * required options
     * user,
     * characterID
     */
    startGame : function(game, callback) {
	if (!RPG.Constraints.requiredOptions(game,['characterID','user'],logger,callback)){
	    return;
	}
	game.user.logger.info('Starting Game for characterID: ' + game.characterID);
	/**
	 * Load Charater
	 */
	RPG.Character.load(game,function(character) {
	    if (!character || character.error) {
		callback(character);
		return;
	    }

	    game.character = character;

	    RPG.Inventory.loadInventories({
		user : game.user,
		character : game.character,
		names : ['character','equipment'],
		tilePoints : 'all'
	    }, function(inventory){
		if (!inventory || inventory.error) {
		    callback(inventory);
		    return;
		}

		game.inventory = inventory;

		/**
		 * Determine if we need to generate a new game
		 */
		game.character = character;
		if (!character.location) {

		    //create a new universe and store it in the game
		    RPG.InitGame.newGame(game, callback);

		} else {

		    //load the existing universe
		    RPG.Universe.load(game,function(universe) {
			if (!universe || universe.error) {
			    callback(universe);
			    return;
			}

			game.universe = universe;
			callback(game);

		    });
		}
	    });
	});
    },

    /**
     * required options
     * user,
     * character
     */
    newGame : function(game, callback) {
	if (!RPG.Constraints.requiredOptions(game,['character','user'],logger,callback)){
	    return;
	}

	game.user.logger.trace('New Game Detected for characterID: ' + game.character.database.characterID);

	var mapName = 'StartMap';
	var universe = {
	    options : {
		property : {
		    universeName :game.character.name + "'s Universe",
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
		Difficulty : game.character.Difficulty,
		level : game.character.level
	    }
	},rand,function(random){
	    Object.merge(universe,random.universe);
	    var charStartPoint = Array.getSRandom(random.generated.possibleStartLocations,rand);

	    game.universe = universe;

	    RPG.Universe.store(game, function(universe) {
		if (!universe || universe.error) {
		    callback(universe);
		    return;
		}

		//now that the universe has been saved we can remove the tiles/cache from map so the client doesn't recieve them.
		game.universe.maps[mapName].tiles = {};
		game.universe.maps[mapName].cache = {};

		game.character.location = {
		    universeID : universe.options.database.id,
		    mapID : universe.maps[mapName].options.database.id,
		    mapName : mapName,
		    point : charStartPoint,
		    dir : Array.getSRandom(RPG.dirs,rand)
		};

		RPG.Character.store(game,function(character) {
		    if (character && character.error) {
			callback(character);
			return;
		    }
		    callback(game);
		});
	    });
	});
    }
}))();