/**
 * Teleports a Character from one map location to another map & location
 *
 */
if (!RPG) var RPG = {};
if (!RPG.Tiles) RPG.Tiles = {};
if (!RPG.Tiles.teleportTo) RPG.Tiles.teleportTo = {};
if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../../../server/Map/Universe.njs'));
    Object.merge(RPG,require('../../../server/Map/MapEditor.njs'));
    Object.merge(RPG,require('../../../server/Character/Character.njs'));
    Object.merge(RPG,require('../Generators/Dungeon.js'));
    Object.merge(RPG,require('../Generators/House.js'));
    Object.merge(RPG,require('../Generators/Terrain.js'));
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

//RPG.Tiles.teleportTo.onBeforeLeave = function(options,callback) {
//    callback();
//}

RPG.Tiles.teleportTo.activate = RPG.Tiles.teleportTo.onBeforeEnter = function(options,callback) {

    if (options.contents.warn && typeof exports == 'undefined') {
	//client side
	RPG.yesORno.show({
	    title : 'Teleport to <b>' + (options.contents.mapName || options.merged.property.tileName)+'</b>',
	    content : new Element('div',{
		html : 'Would you like to teleport to <b>'+(options.contents.mapName || options.merged.property.tileName)+'</b>?'
	    }),
	    height : 60,
	    width : 200,
	    yes : function() {
		callback();
	    },
	    no : function() {
		callback({
		    teleportTo:'Canceled'
		});
	    }
	})
    } else {
	callback();
    }
}

//RPG.Tiles.teleportTo.onLeave = function(options,callback) {
//    callback();
//}


RPG.Tiles.teleportTo.activateComplete = RPG.Tiles.teleportTo.onEnter = function(options,callback) {
    if (typeof exports != 'undefined') {

	if (options.game.clientEvents && ((options.game.clientEvents.activate && options.game.clientEvents.activate.teleportTo == 'Canceled') || (options.game.clientEvents.onBeforeEnter && options.game.clientEvents.onBeforeEnter.teleportTo == 'Canceled'))) {
	    //client canceled.
	    callback();
	    return;
	}

	//Server-Side:
	if (!options.contents.mapName && options.contents.generator) {

	    /**
	     * Generate the map
	     */
	    var newUniverse = {
		options : options.game.universe.options
	    };
	    var rand = Object.clone(RPG.Random);
	    rand.seed =(Math.random() * (99999999999 - 1) + 1);
	    var mapName = options.merged.property.tileName;

	    RPG.Generator[options.contents.generator].random(mapName,{
		properties : {
		    Difficulty : options.game.character.Difficulty,
		    level : options.game.character.level
		}
	    },rand,function(random){
		Object.merge(newUniverse,random.universe);
		var charStartPoint = Array.getSRandom(random.generated.possibleStartLocations,rand);
		newUniverse.options.settings.activeMap = mapName;
		/**
		 * Update the new map start points to teleport back to where they came from
		 */
		random.generated.possibleStartLocations.each(function(loc){
		    //at each start location in the new universe
		    //find or create a tile with teleportTo properties and update it to point to the current map
		    var m = newUniverse && newUniverse.maps && newUniverse.maps[mapName];
		    if (!m) return;
		    var tiles = m.tiles[loc[0]] && m.tiles[loc[0]][loc[1]];
		    if (!tiles) return;
		    var found = null;
		    tiles.each(function(tilePath){
			var tile = Object.getFromPath(m.cache,tilePath);
			if (!tile) return;
			Object.each(tile.options,function(content,key){
			    if (key == 'teleportTo') {
				found = tile;
				tile.options.teleportTo.mapName = options.game.character.location.mapName;
				tile.options.teleportTo.point = options.game.character.location.point;
			    }
			});
		    });
		    //no teleport tile fouond.. generate one
		    if (!found) {
			RPG.pushTile(m.tiles,loc,
			    RPG.createTile('world.earth.teleport',m.cache,{
				property : {
				    tileName : 'GT',
				    folderName : random.options.properties.name
				},
				teleportTo : {
				    mapName : options.game.character.location.mapName,
				    point : options.game.character.location.point
				}
			    })
			    );
		    }
		});

		/**
			 * Update the current map tile cache with the newly generated map name so it knows what to load next time
			 */

		newUniverse.maps[options.game.character.location.mapName] = {
		    options : options.game.universe.maps[options.game.character.location.mapName].options
		};//make an entry in the new universe for the current maps cached tiles
		var newCache = newUniverse.maps[options.game.character.location.mapName].cache = {};
		var curCache = options.game.universe.maps[options.game.character.location.mapName].cache;


		//loop through each of the tiles at the current location
		Object.each(options.tiles,function(tilePath){
		    if (!tilePath) return;
		    //get the cached object from the current universe
		    var curTile = Object.getFromPath(curCache,tilePath);
		    if (!curTile || !curTile.options) return;
		    if (Object.keys(curTile.options).contains('teleportTo')) {

			//make an entry in the new universe for the updated detils of the tile
			var newTile = Object.pathToObject(newCache,tilePath);
			newTile.child.options = curTile.options;
			//finally set the teleportTo mapName option and starting location
			newTile.child.options.teleportTo.mapName = mapName;
			newTile.child.options.teleportTo.point = charStartPoint;
		    }
		});


		//console.log(newUniverse.maps[options.game.character.location.mapName]);
		//we do not want this placed in cache yet otherwise the getViewableTiles method returns nothing
		var storeoptions = {
		    user : options.game.user,
		    universe : newUniverse,
		    bypassCache : true
		};

		RPG.Universe.store(storeoptions,function(universe) {
		    if (!universe || universe.error) {
			callback(universe);
			return;
		    }

		    var updateCharacter = Object.clone(options.game.character);
		    var charDiff = {
			location : {
			    universeID : universe.options.database.universeID,
			    mapID : universe.maps[mapName].options.database.mapID,
			    mapName : mapName,
			    point : charStartPoint
			}
		    };
		    updateCharacter = Object.merge(updateCharacter,charDiff);

		    storeoptions.character = updateCharacter;

		    RPG.Character.store(storeoptions,function(character) {
			if (character.error) {
			    callback(character);
			    return;
			}

			options.game.character = updateCharacter;

			if (options.event == 'activateComplete') {
			    RPG.Tile.getViewableTiles(Object.merge({
				bypassCache : true
			    },options.game), function(viewableUniverse) {
				viewableUniverse.options = {
				    settings : {
					activateMap : options.contents.mapName
				    }
				};
				Object.merge(options.game.universe,viewableUniverse);
				callback({
				    game : {
					universe : viewableUniverse,
					character : charDiff
				    },
				    events : options.events
				});
			    });
			} else {
			    callback({
				traverse : false,
				teleportTo : Object.clone(character.location)
			    });
			}
		    });
		});
	    });


	} else if (options.contents.mapName) {
	    //Handle teleportation requests to existing maps
	    //Server-Side:
	    //load the map :
	    RPG.Universe.load({
		user : options.game.user,
		mapName : options.contents.mapName,
		universeID : options.game.character.location.universeID,
		tilePoints : [options.contents.point],
		bypassCache : true
	    }, function(universe){
		if (universe.error) {
		    callback(universe);
		    return;
		}

		var updateCharacter = Object.clone(options.game.character);
		var charDiff = {
		    location : {
			mapID : universe.maps[options.contents.mapName].options.database.mapID,
			mapName : options.contents.mapName,
			point : options.contents.point
		    }
		};
		updateCharacter = Object.merge(updateCharacter,charDiff);
		var updateUniverse = {
		    options : Object.clone(universe.options)
		};
		updateUniverse.options.settings.activeMap = options.contents.mapName;

		var storeoptions = {
		    user : options.game.user,
		    universe : updateUniverse,
		    character : updateCharacter
		};
		RPG.Universe.store(storeoptions,function(universe) {
		    if (!universe || universe.error) {
			callback(universe);
			return;
		    }
		    //remove all but wha we want to send back to the client
		    universe.options = {
			settings : {
			    activateMap : options.contents.mapName
			}
		    };

		    RPG.Character.store(storeoptions,function(character) {
			if (character.error) {
			    callback(character);
			    return;
			}

			options.game.character = updateCharacter;

			if (options.event == 'activateComplete') {
			    RPG.Tile.getViewableTiles(Object.merge({
				bypassCache : true
			    },options.game), function(viewableUniverse) {
				viewableUniverse.options = {
				    settings : {
					activateMap : options.contents.mapName
				    }
				};
				Object.merge(options.game.universe,viewableUniverse);
				callback({
				    game : {
					universe : viewableUniverse,
					character : charDiff
				    },
				    events : options.events
				});
			    });
			} else {
			    callback({
				traverse : false,
				teleportTo : Object.clone(character.location)
			    });
			}
		    });//end save character
		});//end save universe
	    });//end load map
	}

    } else {
	//Client Side:
	if (options.events && ((options.events.activate && options.events.activate.teleportTo == 'Canceled') || (options.events.onBeforeEnter && options.events.onBeforeEnter.teleportTo == 'Canceled'))) {
	    callback();
	    return;
	}

	//only send back to server when 'activated'. (onEnter is sent back with traverse)
	if (options.event == 'activateComplete' && options.events.activate && !options.events.activate.error) {

	    new Request.JSON({
		url : '/index.njs?xhr=true&a=Play&m=ActivateTile&characterID='+options.game.character.database.characterID+'',
		onFailure : function(results) {
		    RPG.Error.notify(results);
		    if (results.responseText) {
			var resp = JSON.decode(results.responseText,true);
			if (resp.game) {
			    Object.merge(options.game,resp.game);
			}
		    }
		    callback();
		},
		onSuccess : function(results) {
		    results.game && Object.merge(options.game,results.game);
		    callback({
			activate : results.events
		    });
		}
	    }).post(JSON.encode(options.events));//send the results of the clientside events to the server for validation

	} else {
	    callback();
	}
    }
}