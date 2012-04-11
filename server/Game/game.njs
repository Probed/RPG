var RPG = module.exports = {};
Object.merge(RPG,
    require('./init.njs'),
    require('./Universe.njs'),
    require('./Map.njs'),
    require('./Tileset.njs'),
    require('./Inventory.njs'),
    require('../../common/Game/TileTypes/item.js')
    );

RPG.Game = new (RPG.GameClass = new Class({
    routeAccepts : ['PlayCharacter','MoveCharacter','ActivateTile','InventorySwap'],

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

	    RPG.Game.loadGame(game,function(game) {
		if (game.error) {
		    response.onRequestComplete(response,{
			error : game.error
		    });
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

		    /**
		     * Swap an inventory item
		     */
		    case request.url.query.m == 'InventorySwap' :
			var options = {};
			options.game = game;
			options.swap = JSON.decode(request.data,true);
			RPG.TileTypes.item.inventorySwap(options, function(events){
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

	RPG.Game.getViewableTiles(game, function(universeChanges) {

	    //create an object that will get sent back to the cliend
	    var toClient = {};
	    if (events) {
		//merge any events[event].game objects into the client response
		Object.each(events,function(event,name,source){
		    if (event && event.game) {
			Object.merge(toClient,event.game);
			Object.erase(event,'game');//remove it so the client does not recive a dupe
		    }
		});

		//merge any events.game objects into the client response
		if (events.game) {
		    Object.merge(toClient,events.game);
		    Object.erase(events,'game');
		}
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
	    Object.merge(game,toClient);//updates cached object. beware

	    toClient.events = events;

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

	RPG.moveCharacterToTile(game,function(moveEvents) {
	    if (moveEvents.error) {
		callback(moveEvents);
		return;
	    }
	    RPG.Game.tick(game, function(tickEvents){
		callback(Object.merge(moveEvents,tickEvents));
	    });
	});
    },

    tick : function(game,callback) {

	//find out what the character can see:
	var circle = RPG.Game.getViewableArea(game);
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

		//trigger a tick event on each tile
		RPG.triggerTileTypes(game,tiles,'tick',tickEvents,function(tickResults) {
		    if (tickResults) {
			Object.merge(tickEvents,{
			    tick : tickResults
			});
		    }
		    //move to the next tile
		    tickChain.callChain();
		});
	    });

	    //add it to the complete chain
	    tickCompleteChain.chain(function(){
		game.point = point;
		//trigger a tick event on each tile
		RPG.triggerTileTypes(game,tiles,'tickComplete',tickEvents,function(tickResults) {
		    if (tickResults) {
			Object.merge(tickEvents,{
			    tickComplete : tickResults
			});
		    }
		    //move to the next tile
		    tickCompleteChain.callChain();
		});
	    });
	});

	//Called Last when all triggers are complete
	tickChain.chain(function(){
	    //start the complete chain
	    tickCompleteChain.callChain();
	});

	//All Finished. Finally callback
	tickCompleteChain.chain(function(){
	    callback(tickEvents);
	});

	//start triggering
	tickChain.callChain();
    }
}))();