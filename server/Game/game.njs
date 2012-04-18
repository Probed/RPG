var RPG = module.exports = {};

Object.merge(RPG,require('./init.njs'));
Object.merge(RPG,require('./Universe.njs'));
Object.merge(RPG,require('./Map.njs'));
Object.merge(RPG,require('./Tileset.njs'));
Object.merge(RPG,require('./Inventory.njs'));
Object.merge(RPG,require('../../common/Game/TileTypes/item.js'));
Object.merge(RPG,require('../Cache.njs'));

RPG.Game = new (RPG.GameClass = new Class({
    routeAccepts : ['PlayCharacter','MoveCharacter','ActivateTile','InventorySwap'],


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

	//check the cache to see if we have a game for this character
	var game = RPG.Cache.retrieve(request.user.options.userID,'game'+request.url.query.characterID);
	if (!game) {
	    //no game found. initialize the game and store it in the cache
	    RPG.InitGame.startGame({
		user : request.user,
		characterID : request.url.query.characterID
	    },function(loadedGame) {
		if (loadedGame && loadedGame.error) {
		    response.onRequestComplete(response,{
			error : loadedGame.error
		    });
		    return;
		}
		RPG.Cache.store(request.user.options.userID,'game'+request.url.query.characterID,loadedGame);
		//call this.onRequest again now that our cache has been populated.
		RPG.Game.onRequest(request,response);
	    });
	    return; //exit the function and wait for InitGame to complete and call this.onRequest again.
	} else {
	    game.user = request.user;
	}

	//At this point the cache has been populated and we can process the incoming request.


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
		    Object.merge(game.universe,universe);//update game cache with viewable tiles

		    //send out the loaded game
		    response.onRequestComplete(response,RPG.Game.removeSecrets(game));
		});
		break
	}

    },

    //makes a clone, make sure to call just before sending to client
    //the clone is to avoid modifying the cached object
    removeSecrets : function(game,internal) {
	if (!internal) internal = {};
	if (!internal.path) internal.path = [];
	if (!internal.cloned) {
	    internal.cloned = true;

	    //before we clone, we will remove stuff we don't wnat in the cache
	    Object.erase(game,'mapID');
	    Object.erase(game,'mapName');
	    Object.erase(game,'universeID');
	    Object.erase(game,'characterID');
	    Object.erase(game,'inventoryID');
	    Object.erase(game,'tilePoints');
	    Object.erase(game,'user');

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
     * required options:
     * user,
     * character,
     * universe
     *
     * returns : universe with newly visible tiles in it
     */
    getViewableTiles : function(game,callback) {
	var circle = RPG.Game.getViewableArea(game);
	var tiles = Object.getFromPath(game,['universe','maps',game.character.location.mapName,'tiles']);
	var newlyVisible = [];
	//remove tilepoints that are already cached.
	circle.area.each(function(point){
	    if (tiles && tiles[point[0]] && tiles[point[0]][point[1]]) {
	    //ignore cached tiles since they should already exist in on the client
	    } else {
		newlyVisible.push(point);
	    }
	});
	Object.merge(game,{
	    tilePoints : newlyVisible
	});

	if (newlyVisible && newlyVisible.length > 0) {
	    RPG.Map.loadMap(game,function(universe){
		callback(universe,circle,newlyVisible);
	    });
	} else {
	    callback({},circle,newlyVisible);
	}
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