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

	}

	RPG.InitGame.startGame(request.user, request.url.query.characterID, function(character) {
	    if (!character || character.error) {
		response.onRequestComplete(response,character);
		return;
	    }

	    this.loadGame({
		userID : request.user.options.userID,
		character : character

	    },function(game) {
		if (game.error) {
		    response.onRequestComplete(response,game);
		    return;
		}

		switch (true) {
		    //process game commands:
		    case request.url.query.m == 'MoveCharacter' :
			this.moveCharacter({
			    user : request.user,
			    game : game,
			    dir : request.url.query.dir
			},
			function(universe){
			    Object.merge(require('../Cache.njs').Cache.retrieve(request.user.options.userID,'universe_'+character.location.universeID),universe);
			    response.onRequestComplete(response,universe);
			});
			break;

		    default :
			RPG.Tile.getViewableTiles({
			    userID : request.user.options.userID,
			    character : character,
			    universe : game.universe
			},function(universe){
			    if (universe.error) {
				response.onRequestComplete(response,universe);
				return;
			    }
			    Object.merge(game.universe,universe);

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
     * userID
     * character
     *
     * callback(gameObject)
     */
    loadGame : function(options,callback) {

	RPG.Universe.loadUniverse({
	    userID : options.userID,
	    character : options.character
	},function(universe) {
	    if (!universe || universe.error) {
		callback(universe);
		return;
	    }
	    callback({
		character : options.character,
		universe : universe
	    });
	}.bind(this));
    },

    /**
     * required options
     * user,
     * characterID,
     * point,
     */
    moveCharacter : function(options,callback) {
	if (!RPG.dirs.contains(options.dir)) {
	    callback({
		error : 'Invalid direction: ' + options.dir
	    });
	}

	options.userID = options.user.options.userID;
	var newLoc = RPG[options.dir](options.game.character.location.point,1);

	if (RPG.canMoveToTile({
	    universe : options.game.universe,
	    character : options.game.character,
	    point : newLoc
	})) {
	    options.game.character.location.point = newLoc;
	    options.game.character.location.dir = options.dir.charAt(0);

	    RPG.Character.beginCharacterSave({
		user : options.user,
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
		    RPG.Tile.getViewableTiles({
			userID : options.userID,
			universe : options.game.universe,
			character : character
		    },callback);
		}.bind(this)
	    });
	} else {
	    callback({
		error : 'Cannot move to that tile.'
	    })
	}

    }

}))();