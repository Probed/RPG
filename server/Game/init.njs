var RPG = module.exports = {};

Object.merge(RPG,
    require('../Map/MapEditor.njs'),
    require('../Character/Character.njs'),
    require('../../common/Map/Generators/Dungeon.js')
//    require('../../common/Map/Generators/House.js'),
//    require('../../common/Map/Generators/Terrain.js')
    );

RPG.InitGame = new (RPG.InitGameClass = new Class({
    Implements : [Events,Options],
    options : {},
    initialize : function(options) {
	this.setOptions(options);
    },

    startGame : function(user, characterID, callback) {

	/**
	 *
	 */
	RPG.Character.loadCharacter(user.options.userID,characterID,function(character) {
	    if (!character || character.error) callback(character);

	    /**
	     * Determine if we need to generate a new game
	     */
	    if (!character.location) {
		this.newGame(user, character, callback);
	    } else {
		callback(character);
	    }
	}.bind(this));
    },

    newGame : function(user, character, callback) {
	var mapName = 'StartMap';
	var universe = {
	    options : {
		property : {
		    universeName :character.name + "'s Universe",
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


//	var rt = RPG.Generator.Terrain.random(mapName,rand);
//	Object.merge(universe,rt.universe);

//	var randRow = Object.getSRandom(rt.generated.sand,rand);
//	var randCol = Object.getSRandom(randRow.rand,rand);
//	var charStartPoint = [Number.from(randRow.key),Number.from(randCol.key)];
//
//	var h = RPG.Generator.House.random(mapName,rand);
//	Object.merge(universe,h.universe);
//	var charStartPoint = h.generated.frontGate[0];

	var d = RPG.Generator.Dungeon.random(mapName,rand);
	Object.merge(universe,d.universe);
	var charStartPoint = d.generated.stairsUp;

	RPG.MapEditor.beginUserUniverseSave(
	//request
	{
	    user : user,
	    url : {
		query :{
		    universeName : universe.options.property.universeName
		}
	    },
	    data : universe
	},
	//response
	{
	    onRequestComplete : function(r,universe) {
		if (!universe || universe.error) {
		    callback(universe);
		    return;
		}
		character.location = {
		    universeID : universe.options.database.universeID,
		    mapID : universe.maps[mapName].options.database.mapID,
		    mapName : mapName,
		    point : charStartPoint,
		    dir : 's'
		};

		RPG.Character.beginCharacterSave(
		//request
		{
		    user : user,
		    url : {
			query : {
			    characterID : character.database.characterID
			}
		    },
		    data : character
		},
		//response
		{
		    onRequestComplete : function(r,character) {
			callback(character);
		    }
		});
	    }
	});
    }
}))();