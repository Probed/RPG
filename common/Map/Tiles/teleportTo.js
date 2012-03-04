/**
 * Teleports a Character from one map location to another map & location
 *
 */
if (!RPG) var RPG = {};
if (!RPG.Tiles) RPG.Tiles = {};
if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../../../server/Map/MapEditor.njs'));
    Object.merge(RPG,require('../../../server/Character/Character.njs'));
    Object.merge(RPG,require('../Generators/Dungeon.js'));
    Object.merge(RPG,require('../Generators/House.js'));
    Object.merge(RPG,require('../Generators/Terrain.js'));
    module.exports = RPG;
}


/**
 * Options:
 * game : the game object which includes things like the universe, character etc
 * tiles : the array of tiles for which the tile type is being triggered
 * point : the location of the tiles
 * dir : director n/e/s/w
 * merged : contains the merged options of all the tiles
 * contents : contains the options for this specific TileType from the merged options. Use This Mostly.
 * event : [onBeforeEnter, onEnter, onLeave etc]
 * events : Contains all the results from the current round of TileType event triggers
 *
 * callback : MUST CALLBACK
 */
RPG.Tiles.teleportTo = function(options,callback) {

    switch (options.event) {
	case 'onBeforeEnter' :
	    if (options.contents.warn && typeof exports == 'undefined') {
		console.log('warning about to be teleported');
		callback();
	    } else {
		callback();
	    }
	    break;


	case 'onEnter' :

	    if (!options.contents.mapName && options.contents.generator) {

		if (typeof exports != 'undefined') {
		    //Server-Side:
		    //
		    //new generated map:
		    var newUniverse = {
			options : options.game.universe.options
		    };
		    var rand = Object.clone(RPG.Random);
		    rand.seed =(Math.random() * (99999999999 - 1) + 1);
		    var mapName = options.merged.property.tileName;

		    var g = RPG.Generator[options.contents.generator].random(mapName,rand);
		    Object.merge(newUniverse,g.universe);
		    var randRow = Object.getSRandom(g.generated.tiles,rand);
		    var randCol = Object.getSRandom(randRow.rand,rand);
		    var charStartPoint = [Number.from(randRow.key),Number.from(randCol.key)];

		    newUniverse.options.settings.activeMap = mapName;

		    RPG.MapEditor.beginUserUniverseSave(
		    //request
		    {
			user : options.game.user,
			url : {
			    query :{
				universeName : newUniverse.options.property.universeName
			    }
			},
			data : newUniverse
		    },
		    //response
		    {
			onRequestComplete : function(r,universe) {
			    if (!universe || universe.error) {
				callback(universe);
				return;
			    }
			    options.game.character.location = Object.merge(options.game.character.location,{
				universeID : universe.options.database.universeID,
				mapID : universe.maps[mapName].options.database.mapID,
				mapName : mapName,
				point : charStartPoint
			    });

			    RPG.Character.beginCharacterSave(
			    //request
			    {
				user : options.game.user,
				url : {
				    query : {
					characterID : options.game.character.database.characterID
				    }
				},
				data : options.game.character
			    },
			    //response
			    {
				onRequestComplete : function(r,character) {
				    if (character.error) {
					callback(character);
					return;
				    }
				    callback({
					traverse : false,
					teleportTo : Object.clone(character.location)
				    });
				}
			    });
			}
		    });

		} else {
		    //Client-Side:
		   
		    callback();
		}

	    } else {
		callback();
	    }
	    break;


	default :
	    callback();
    }
}