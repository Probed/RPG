var RPG = module.exports = {};
Object.merge(RPG,
    require('./init.njs'),
    require('../Map/Universe.njs')
    );

RPG.Game = new (RPG.GameClass = new Class({
    Implements : [Events,Options],
    routeAccepts : ['PlayCharacter','MoveCharacter'],

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
		    case request.url.query.m == 'MoveCharacter' :
			game.dir = request.url.query.dir;
			game.clientEvents = JSON.decode(request.data,true);
			this.moveCharacter(game, function(changes){
			    if (changes.error) {
				response.onRequestComplete(response,changes);
				return;
			    }
			    require('../Cache.njs').Cache.merge(request.user.options.userID,'universe_'+changes.game.character.location.universeID,changes.game.universe);
			    response.onRequestComplete(response,changes);
			});
			break;

		    default :
			RPG.Tile.getViewableTiles(game,function(universe){
			    if (universe.error) {
				response.onRequestComplete(response,universe);
				return;
			    }
			    Object.merge(game.universe,universe);
			    Object.erase(game,'mapID');
			    Object.erase(game,'mapOrTileset');
			    Object.erase(game,'universeID');
			    Object.erase(game,'user');
			    //send out the loaded game
			    game.require = this.require;
			    response.onRequestComplete(response,game);
			    Object.erase(game,'require');
			}.bind(this));
			break
		}

	    }.bind(this));
	}.bind(this));

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
     * required options
     * user
     * character
     * universe
     * dir = direction (n,e,s,w)
     */
    moveCharacter : function(options,callback) {
	if (!RPG.dirs.contains(options.dir)) {
	    callback({
		error : 'Invalid direction: ' + options.dir
	    });
	}

	options.moveTo = RPG[options.dir](options.character.location.point,1);


	RPG.moveCharacterToTile(options,function(moveEvents) {
	    if (moveEvents.error) {
		callback(moveEvents);
		return;
	    }
	    RPG.Tile.getViewableTiles(options,function(universe){
		Object.erase(options,'mapID');
		Object.erase(options,'mapOrTileset');
		Object.erase(options,'universeID');
		Object.erase(options,'user');
		Object.merge(options.universe,universe);
		callback({
		    game : {
			universe : universe,//only send back the new stuff
			character : options.character
		    },
		    events : Object.cleanEmpty(moveEvents)
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

	//save our newUniverse tile changes
	RPG.Universe.store({
	    user : options.game.user,
	    universe : newUniverse,
	    bypassCache : updateOptions.bypassCache
	},callback);
    }

}))();