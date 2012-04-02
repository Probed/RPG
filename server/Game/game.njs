var RPG = module.exports = {};
Object.merge(RPG,
    require('./init.njs'),
    require('../Map/Universe.njs')
    );

RPG.Game = new (RPG.GameClass = new Class({
    Implements : [Events,Options],
    routeAccepts : ['PlayCharacter','MoveCharacter','ActivateTile'],

    require : {
	css : [
	'/client/mochaui/themes/charcoal/css/Map/Tile.css',
	'/client/mochaui/themes/charcoal/css/Character/CharacterEquipment.css',
	],
	js : [
	'/client/Game/Game.js',
	'/client/Character/Character.js',
	'/client/Character/CharacterEquipment.js',
	'/common/Map/Tiles/Utilities.js',
	'/common/Map/Generators/Utilities.js',
	'/client/Map/Map.js'
	]
    },

    options : {},
    initialize : function(options) {
	this.setOptions(options);
    },

    /**
     * process game requests:
     */
    onRequest : function(request,response) {
	if (!request.user.isLoggedIn) {
	    response.onRequestComplete(response,{
		error : 'Must be logged in to play.'
	    });
	    return;
	}

	RPG.InitGame.startGame({
	    user : request.user,
	    characterID : request.url.query.characterID
	}, function(character) {
	    if (!character || character.error) {
		response.onRequestComplete(response,character);
		return;
	    }

	    this.loadGame({
		user : request.user,
		character : character
	    },function(game) {
		if (game.error) {
		    response.onRequestComplete(response,game);
		    return;
		}
		switch (true) {
		    //process game commands:

		    /**
		     * Move a Character from One Tile to another.
		     *
		     * Casues a 'tick' and 'tickComplete' event upon successful move
		     *
		     */
		    case request.url.query.m == 'MoveCharacter' :
			game.dir = request.url.query.dir;
			game.clientEvents = JSON.decode(request.data,true);
			this.moveCharacter(game, function(changes){
			    if (changes.error) {
				response.onRequestComplete(response,changes);
				return;
			    }
			    response.onRequestComplete(response,RPG.Game.removeSecrets(changes));
			});
			break;

		    /**
		     * Activate the tile the character is currently on
		     *
		     */
		    case request.url.query.m == 'ActivateTile' :
			game.clientEvents = JSON.decode(request.data,true);
			this.activateTile(game, function(changes){
			    if (changes.error) {
				response.onRequestComplete(response,changes);
				return;
			    }
			    response.onRequestComplete(response,RPG.Game.removeSecrets(changes));
			});
			break;

		    default :
			RPG.Game.getViewableTiles(game,function(universe){
			    if (universe.error) {
				response.onRequestComplete(response,universe);
				return;
			    }
			    Object.merge(game.universe,universe);
			    Object.erase(game,'mapID');
			    Object.erase(game,'mapOrTileset');
			    Object.erase(game,'universeID');
			    Object.erase(game,'user');
			    Object.erase(game,'tilePoints');
			    //send out the loaded game
			    game.require = this.require;
			    response.onRequestComplete(response,RPG.Game.removeSecrets(game));
			    Object.erase(game,'require');
			}.bind(this));
			break
		}

	    }.bind(this));
	}.bind(this));

    },

    //makes a clone, make sure to call just before sending to client
    //the clone is to avoid modifying the cached object
    removeSecrets : function(game,internal) {
	if (!internal) internal = {};
	if (!internal.path) internal.path = [];
	if (!internal.cloned) {
	    internal.cloned = true;
	    game = Object.clone(game);
	}

	if (typeof game == 'object') {
	    Object.each(game,function(content,key,source){
		if (key == 'secret') {
		    Object.erase(source,key);
		} else {
		    RPG.Game.removeSecrets(content,internal);
		}
	    });
	}
	return game;
    },

    /**
     * Required options:
     * user
     * character
     *
     * callback(game || error)
     */
    loadGame : function(options,callback) {

	RPG.Universe.load(options,function(universe) {
	    if (!universe || universe.error) {
		callback(universe);
		return;
	    }
	    options.universe = universe;
	    callback(options);
	});
    },


    /**
     * required options:
     * user,
     * character,
     * universe
     *
     * returns : object from RPG.Tile.loadTiles excluding cached tiles
     */
    getViewableTiles : function(options,callback) {

	var radius = RPG.calcSightRadius(options.character);
	if (!radius || radius < 2) {
	    radius = 1;
	}
	var circle = RPG.getCircleArea(options.character.location.point,radius);

	Object.merge(options,{
	    tilePoints : circle.area
	});

	RPG.Tile.load(options,function(universe){
	    callback(universe,circle);
	});
    },

    /**
     * required options
     * user
     * character
     * universe
     * dir = direction (n,e,s,w)
     */
    moveCharacter : function(game,callback) {
	if (!RPG.dirs.contains(game.dir)) {
	    callback({
		error : 'Invalid direction: ' + game.dir
	    });
	}

	game.moveTo = RPG[game.dir](game.character.location.point,1);

	//before changes
	var beforeCharacter = Object.clone(game.character);
	var beforeUniOptions = Object.clone(game.universe.options);

	RPG.moveCharacterToTile(game,function(moveEvents) {
	    if (moveEvents.error) {
		callback(moveEvents);
		return;
	    }

	    RPG.Game.tick(game, function(universe){
		Object.erase(game,'user');
		Object.erase(game,'mapID');
		Object.erase(game,'mapOrTileset');
		Object.erase(game,'universeID');
		Object.merge(game.universe,universe);

		//remove universe/map options to reduce amount sent back to client
		//@todo make Object.diff-able incase things changed
		Object.each(universe.maps,function(map){
		    Object.erase(map,'options');
		});

		//only send back the difference in options:
		universe.options = Object.diff(beforeUniOptions,game.universe.options);

		callback({
		    game : {
			universe : universe,//only send back the new stuff
			character : Object.diff(beforeCharacter,game.character)
		    },
		    events : Object.cleanEmpty(moveEvents)
		});
		beforeCharacter = null;
		beforeUniOptions = null;
	    });
	});
    },

    /**
     * Activate Tile
     *
     */
    activateTile : function(game,callback) {
	game.moveTo = game.character.location.point;//don't move anywhere but need to set moveTo for compatibility

	var beforeCharacter = Object.clone(game.character);
	var beforeUniOptions = Object.clone(game.universe.options);

	RPG.activateTile(game, function(events){
	    RPG.Game.getViewableTiles(Object.merge({
		bypassCache : true
	    },game), function(viewableUniverse) {

		viewableUniverse.options = Object.diff(beforeUniOptions,game.universe.options);

		Object.merge(game.universe,viewableUniverse);
		callback({
		    game : {
			universe : viewableUniverse,
			character : Object.diff(beforeCharacter, game.character)
		    },
		    events : events
		});
	    });


	});
    },

    /**
     * This will update a tile on the current characters map
     *
     * options:
     * (see the TileType eg: teleportTo for all options)
     *
     * updateOptions:
     * tileType : the tileType to match
     * tileOptions : the new options to merge with existing options
     *
     * optional updateOptions
     * point : the point on the current map to update. if no point, options.game.moveTo is used.
     * bypassCache : defaults false. determine if we should update the game cache
     */
    updateGameTile : function(options,updateOptions,callback) {
	if (typeof updateOptions.bypassCache != 'boolean') updateOptions.bypassCache = false;

	//create a empty universe with same options as current
	//this universe is what gets saved since it only contains the updated tiles
	var newUniverse = {
	    options : options.game.universe.options,
	    maps : {}
	};

	//create an empty map with current map options for updating
	var map = newUniverse.maps[options.game.character.location.mapName] = {
	    options : options.game.universe.maps[options.game.character.location.mapName].options,
	    tiles : {},
	    cache : {}
	};

	var currentMap = options.game.universe.maps[options.game.character.location.mapName];

	if (updateOptions.tileType && updateOptions.tileOptions) {
	    options.tiles.each(function(tilePath){
		var c = Object.getFromPath(currentMap.cache,tilePath);
		if (!c) return;
		var newOptions = {};
		if (c.options[updateOptions.tileType]) {
		    newOptions = updateOptions.tileOptions;
		}
		//clone each tile at the moveTo point
		RPG.pushTile(map.tiles, updateOptions.point || options.game.moveTo, RPG.cloneTile(currentMap.cache, tilePath, map.cache,newOptions));
	    });
	}

	if (updateOptions.cache) {
	    map.cache = updateOptions.cache;
	}

	if (updateOptions.storeWait) {
	    callback(newUniverse);
	} else {
	    //save our newUniverse tile changes
	    RPG.Universe.store({
		user : options.game.user,
		universe : newUniverse,
		bypassCache : updateOptions.bypassCache
	    },callback);
	}
    },

    /**
     * This will move a tile on the current characters map
     *
     * options: (see the TileType eg: teleportTo for all options)
     *
     * updateOptions:
     * tileType : the tileType to match
     * tileOptions : function calling back for info for each tileType being moved
     * point : the point on the current map to update. if no point, options.game.moveTo is used.
     *
     * optional updateOptions
     * bypassCache : defaults false. determine if we should update the game cache
     */
    moveGameTile : function(options,updateOptions,callback) {
	if (typeof updateOptions.bypassCache != 'boolean') updateOptions.bypassCache = false;

	//create a empty universe with same options as current
	//this universe is what gets saved since it only contains the updated tiles
	var newUniverse = {
	    options : options.game.universe.options,
	    maps : {}
	};

	//create an empty map with current map options for updating
	var map = newUniverse.maps[options.game.character.location.mapName] = {
	    options : options.game.universe.maps[options.game.character.location.mapName].options,
	    tiles : {},
	    cache : {}
	};

	var currentMap = options.game.universe.maps[options.game.character.location.mapName];

	var moved = false;

	if (updateOptions.tileType && updateOptions.tileOptions) {
	    options.tiles.each(function(tilePath){
		var c = Object.getFromPath(currentMap.cache,tilePath);
		if (!c) return;
		if (c.options[updateOptions.tileType]) {

		    var moveInfo = updateOptions.tileOptions(c,currentMap,tilePath);
		    if (!moveInfo) {
			return;
		    }

		    //ensure the client will get the new Tile
		    if (!map.tiles) map.tiles = {};
		    if (!map.tiles[moveInfo.point[0]])map.tiles[moveInfo.point[0]] = {};
		    map.tiles[moveInfo.point[0]][moveInfo.point[1]] = Array.clone(currentMap.tiles[moveInfo.point[0]][moveInfo.point[1]]);

		    //push the tile to the new location and set it's new options
		    RPG.pushTile(map.tiles, moveInfo.point, RPG.cloneTile(currentMap.cache, tilePath, map.cache, moveInfo.options));

		    //ensure the client will get the new Tile
		    if (!map.tiles) map.tiles = {};
		    if (!map.tiles[options.game.point[0]])map.tiles[options.game.point[0]] = {};
		    map.tiles[options.game.point[0]][options.game.point[1]] = currentMap.tiles[options.game.point[0]][options.game.point[1]];

		    //remove the tile from the old location
		    RPG.removeTile(map.tiles, tilePath, options.game.point);

		    moved = true;
		}
	    });
	}
	if (!moved) {
	    callback({});
	    return;
	}

	if (updateOptions.cache) {
	    map.cache = updateOptions.cache;
	}

	if (updateOptions.storeWait) {
	    callback(newUniverse);
	} else {
	    //save our newUniverse tile changes
	    RPG.Universe.store({
		user : options.game.user,
		universe : newUniverse,
		bypassCache : updateOptions.bypassCache
	    },callback);
	}
    },

    tick : function(options,callback) {

	//find out what the character can see:
	RPG.Game.getViewableTiles(options,function(universe,circle){
	    //RPG.Log('Viewable',''+circle.area.length);
	    var tickEvents = {};//results of tick events
	    var tickChain = new Chain();
	    var tickCompleteChain = new Chain();

	    //go through all visable tiles
	    circle.area.each(function(point){
		//get the map for the character
		var map = options.universe.maps[options.character.location.mapName];
		if (!map) return;

		//get the tile at the location of the circle point
		var tiles = map.tiles && map.tiles[point[0]] && map.tiles[point[0]][point[1]];
		if (!tiles) return

		//add it to the chain
		tickChain.chain(function(){

		    options.point = point;

		    //RPG.Log('tick Chain',point+''+tiles);
		    //trigger a tick event on each tile
		    RPG.triggerTileTypes(options,tiles,'tick',tickEvents,function(tickResults) {
			if (tickResults) {
			    Object.merge(tickEvents,tickResults);
			}
			//move to the next tile
			tickChain.callChain();
		    });
		});

		//add it to the complete chain
		tickCompleteChain.chain(function(){
		    options.point = point;
		    //RPG.Log('tick Chain complete',''+tiles);
		    //trigger a tick event on each tile
		    RPG.triggerTileTypes(options,tiles,'tickComplete',tickEvents,function(tickResults) {
			if (tickResults) {
			    Object.merge(tickEvents,tickResults);
			}
			//move to the next tile
			tickCompleteChain.callChain();
		    });
		});
	    });

	    //Called Last when all triggers are complete
	    tickChain.chain(function(){
		//RPG.Log('tick Chain','Complete');
		//RPG.Log('tick Chain Complete','Started');
		//start the complete chain
		tickCompleteChain.callChain();
	    });

	    //All Finished. Finally callback
	    tickCompleteChain.chain(function(){
		//RPG.Log('tick Chain Complete','Complete');

		if (tickEvents.universe) {
		    //merge the tick events with the universe so the client will receive any updates
		    Object.merge(universe,tickEvents.universe);
		}
		callback(universe);
	    });

	    //start triggering
	    //RPG.Log('tick Chain','Started');
	    tickChain.callChain();
	});
    }

}))();