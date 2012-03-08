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

			this.moveCharacter(game, function(changes){
			    if (changes.error) {
				response.onRequestComplete(response,changes);
				return;
			    }

			    Object.merge(require('../Cache.njs').Cache.retrieve(request.user.options.userID,'universe_'+changes.game.character.location.universeID),changes.game.universe);
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
    }

}))();