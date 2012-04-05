var RPG = module.exports = {};

Object.merge(RPG,
    require('./Universe.njs'),
    require('../Character/Character.njs'),
    require('../../common/Game/Generators/Dungeon.js'),
    require('../../common/Game/Generators/House.js'),
    require('../../common/Game/Generators/Terrain.js')
    );

RPG.InitGame = new (RPG.InitGameClass = new Class({
    /**
     * required options
     * user,
     * characterID
     */
    startGame : function(game, callback) {

	/**
	 *
	 */
	RPG.Character.load(game,function(character) {
	    if (!character || character.error) {
		callback(character);
		return;
	    }

	    game.character = character;

	    game.tilePoints = 'all';
	    RPG.Inventory.loadInventory({
		user : game.user,
		character : game.character,
		name : 'character'
	    }, function(inventory){
		Object.erase(game,'tilePoints');
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
		    RPG.InitGame.newGame(game, callback);
		} else {
		    callback(game);
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
	    game.bypassCache = true;

	    RPG.Universe.store(game, function(universe) {
		if (!universe || universe.error) {
		    callback(universe);
		    return;
		}
		Object.erase(game,'bypassCache');

		game.character.location = {
		    universeID : universe.options.database.universeID,
		    mapID : universe.maps[mapName].options.database.mapID,
		    mapName : mapName,
		    point : charStartPoint,
		    dir : 's'
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