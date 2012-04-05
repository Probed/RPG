var RPG = module.exports = {};
Object.merge(RPG,
    require('./init.njs'),
    require('./Universe.njs'),
    require('./Map.njs'),
    require('./Tileset.njs'),
    require('./Inventory.njs')
    );

RPG.Game = new (RPG.GameClass = new Class({
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
	'/common/Game/Tiles/Utilities.js',
	'/common/Game/Generators/Utilities.js',
	'/client/Game/Map.js'
	]
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

	//RPG.Log('BeforeInit',require('../Cache.njs').Cache.list(request.user.options.userID)+'');
	RPG.InitGame.startGame({
	    user : request.user,
	    characterID : request.url.query.characterID
	}, function(game) {

	    if (!game || game.error) {
		response.onRequestComplete(response,{
		    error : game.error
		});
		return;
	    }

	    //RPG.Log('BeforeLoad',require('../Cache.njs').Cache.list(request.user.options.userID)+'');
	    RPG.Game.loadGame(game,function(game) {
		if (game.error) {
		    response.onRequestComplete(response,{
			error : game.error
		    });
		    return;
		}
		//RPG.Log('AfterLoad',require('../Cache.njs').Cache.list(request.user.options.userID)+'');
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
			RPG.Game.moveCharacter(game, function(events){
			    RPG.Game.requestComplete(game,events,response);
			});
			break;

		    /**
		     * Activate the tile the character is currently on
		     *
		     */
		    case request.url.query.m == 'ActivateTile' :
			game.clientEvents = JSON.decode(request.data,true);
			game.moveTo = game.character.location.point;//don't move anywhere but need to set moveTo for compatibility
			RPG.activateTile(game, function(events){
			    RPG.Game.requestComplete(game,events,response);
			});
			break;

		    default :
			/**
			 * This gets called at the start of playing
			 *
			 *  returns the full contents of the cached game.
			 */
			RPG.Game.getViewableTiles(game,function(universe){
			    //RPG.Log('AfterGetViewable',require('../Cache.njs').Cache.list(request.user.options.userID)+'');
			    if (universe.error) {
				response.onRequestComplete(response,universe);
				return;
			    }
			    Object.merge(game.universe,universe);

			    //remove some options that get set in load/save/etc that we don't want to send to the client
			    Object.erase(game,'mapID');
			    Object.erase(game,'universeID');
			    Object.erase(game,'characterID');
			    Object.erase(game,'inventoryID');
			    Object.erase(game,'user');
			    Object.erase(game,'tilePoints');

			    //send out the loaded game
			    game.require = RPG.Game.require;
			    response.onRequestComplete(response,RPG.Game.removeSecrets(game));
			    Object.erase(game,'require');
			});
			break
		}

	    });
	});

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
		if ((typeOf(content) == 'object') && Object.keys(content||{}).length == 0) {
		    Object.erase(source,key);
		    return;
		}
		if (key == 'secret') {
		    Object.erase(source,key);
		} else {
		    RPG.Game.removeSecrets(content,internal);
		}
		if ((typeOf(content) == 'object') && Object.keys(content||{}).length == 0) {
		    Object.erase(source,key);
		    return;
		}
	    });
	}
	return game;
    },

    /**
     * All Game responses are handled here
     *
     * All TileTypes may modify the 'game' object to remove tiles etc then getViewableTiles will reload thoes tiles for sending to the client
     */
    requestComplete : function(game, events, response) {
	Object.erase(game,'bypassCache');//incease it is here..
	//RPG.Log('debug',''+Object.keys(game));
	RPG.Game.getViewableTiles(game, function(universeChanges) {

	    //create an object that will get sent back to the cliend
	    var toClient = {};
	    if (events) {
		//merge any events[event].game objects into the client response
		Object.each(events,function(event,name,source){
		    if (event && event.game) {
			//RPG.Log('Game',name + ' ' + JSON.encode(event.game));
			Object.merge(toClient,event.game);
			Object.erase(source,name);//remove it so the client does not recive a dupe
		    }
		});

		//merge any events.game objects into the client response
		if (events.game) {
		    //RPG.Log('Game','Events ' + JSON.encode(events.game));
		    Object.merge(toClient,events.game);
		    Object.erase(events,'game');
		}
		toClient.events = events;
	    }
	    if (universeChanges && !universeChanges.error && universeChanges.maps) {
		//merge loaded universe tile data which will override any event universe data
		if (!toClient.universe) toClient.universe = {};
		if (!toClient.universe.maps) toClient.universe.maps = {};
		Object.each(universeChanges.maps,function(map,mapName){

		    if (!toClient.universe.maps[mapName]) toClient.universe.maps[mapName] = {};
		    if (!toClient.universe.maps[mapName].tiles) toClient.universe.maps[mapName].tiles = {};
		    if (!toClient.universe.maps[mapName].cache) toClient.universe.maps[mapName].cache = {};

		    //merge all but options since getViewable does not change map options
		    Object.merge(toClient.universe.maps[mapName].tiles,map.tiles);
		    Object.merge(toClient.universe.maps[mapName].cache,map.cache);
		});
	    }
	    //RPG.Log('toClient',toClient);
	    Object.merge(game,toClient);

	    //and send the cleaned up resonse back to the client
	    response.onRequestComplete(response,RPG.Game.removeSecrets(toClient));
	});

    },

    /**
     * Required options:
     * user
     * character
     *
     * callback(game || error)
     */
    loadGame : function(game,callback) {
	//RPG.Log('LoadGame','Loading Game Universe');
	RPG.Universe.load(game,function(universe) {
	    if (!universe || universe.error) {
		callback(universe);
		return;
	    }

	    game.universe = universe;
	    callback(game);

	});
    },


    /**
     * required options:
     * user,
     * character,
     * universe
     *
     * returns : object from RPG.Map.loadMap excluding cached tiles
     */
    getViewableTiles : function(game,callback) {

	var circle = RPG.Game.getViewableArea(game);
	Object.merge(game,{
	    tilePoints : circle.area
	});

	RPG.Map.loadMap(game,function(universe){
	    callback(universe,circle);
	});
    },

    getViewableArea : function(game) {
	var radius = RPG.calcSightRadius(game.character);
	if (!radius || radius < 2) {
	    radius = 1;
	}
	return RPG.getCircleArea(game.character.location.point,radius);
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


	//RPG.Log('MoveEnvent','MoveEnvent Start');
	RPG.moveCharacterToTile(game,function(moveEvents) {
	    //RPG.Log('MoveEnvent','MoveEnvent End');
	    if (moveEvents.error) {
		callback(moveEvents);
		return;
	    }

	    //RPG.Log('Tick','Tick Start');
	    RPG.Game.tick(game, function(universe){
		//RPG.Log('Tick','Tick End');
		callback(moveEvents);
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

    tick : function(game,callback) {

	//find out what the character can see:
	var circle = RPG.Game.getViewableArea(game);
	//RPG.Log('Viewable',''+circle.area.length);
	var tickEvents = {};//results of tick events
	var tickChain = new Chain();
	var tickCompleteChain = new Chain();

	//go through all visable tiles
	circle.area.each(function(point){
	    //get the map for the character
	    var map = game.universe.maps[game.character.location.mapName];
	    if (!map) return;

	    //get the tile at the location of the circle point
	    var tiles = map.tiles && map.tiles[point[0]] && map.tiles[point[0]][point[1]];
	    if (!tiles) return

	    //add it to the chain
	    tickChain.chain(function(){

		game.point = point;

		//RPG.Log('tick Chain',point+''+tiles);
		//trigger a tick event on each tile
		RPG.triggerTileTypes(game,tiles,'tick',tickEvents,function(tickResults) {
		    if (tickResults) {
			Object.merge(tickEvents,tickResults);
		    }
		    //move to the next tile
		    tickChain.callChain();
		});
	    });

	    //add it to the complete chain
	    tickCompleteChain.chain(function(){
		game.point = point;
		//RPG.Log('tick Chain complete',''+tiles);
		//trigger a tick event on each tile
		RPG.triggerTileTypes(game,tiles,'tickComplete',tickEvents,function(tickResults) {
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
	    callback(tickEvents);
	//RPG.Log('tick Chain Complete','Complete');
	});

	//start triggering
	//RPG.Log('tick Chain','Started');
	tickChain.callChain();
    }

}))();