/**
 * These are tiles that can armed/unarmed
 * armed tiles prevent a character from entering them unil unarmed.
 */

if (!RPG) var RPG = {};
if (!RPG.TileTypes) RPG.TileTypes = {};
if (!RPG.TileTypes.trap) RPG.TileTypes.trap = {};
if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../../Character/Character.js'));
    Object.merge(RPG,require('../../../server/Game/game.njs'));
    Object.merge(RPG,require('../../../server/Character/Character.njs'));
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


//RPG.TileTypes.trap.onBeforeEnter = function(options,callback) {
//    callback();
//}

RPG.TileTypes.trap.onBeforeEnter = function(options,callback) {
    if (options.contents.armed) {
	if (typeof exports == 'undefined') {
	    //client
	    //@todo disarm attempt
	    RPG.Disarm.show(options,{
		success : function(disarm){
		    callback(disarm);
		},
		fail : function() {
		    callback({
			traverse : false,
			error : 'Trap still Armed.'
		    });
		}
	    });

	} else {
	    //server
	    if (RPG.Disarm.checkSolution(options)) {

		var updateUni = RPG.getUpdateUniverse({
		    universe : options.game.universe,
		    mapName : options.game.character.location.mapName,
		    tilePaths : RPG.getLastByTileType(options.game.universe.maps[options.game.character.location.mapName],'trap',options.tiles).path,
		    point : options.game.character.location.point,
		    tileOptions : {
			trap : {
			    armed : false
			}
		    }
		});

		RPG.Universe.store({
		    user : options.game.user,
		    universe : updateUni
		},function(universe){
		    if (universe.error) {
			callback(universe);
			return;
		    }
		    var oldXp = options.game.character.xp;

		    //Calculate XP:
		    var baseXP = RPG.Disarm.calcXP(options);

		    //apply XP modifiers
		    var xp = RPG.calcXP(baseXP,options);
		    options.game.character.xp += xp;

		    //save the characters xp
		    RPG.Character.store({
			user : options.game.user,
			character : options.game.character
		    }, function(character){
			if (character.error) {
			    options.game.character.xp = oldXp;
			    callback(character);
			    return;
			}

			Object.merge(options.game.character,character);
			updateUni.options = {};//no universe options changed. remove it
			Object.each(updateUni.maps,function(map){
			    map.options = {};//no map options changed. remove it
			});
			//finally callback
			callback({
			    trap : ['Successful Disarmed',xp],
			    game : {
				universe : updateUni,
				character : {
				    xp : options.game.character.xp
				}
			    }
			});

		    });//end store character
		});//end store universe
	    } else {
		//increment the attempt counter
		options.contents.attempt = (Number.from(options.contents.attempt) || 0) + 1;
		options.contents.attempts = Number.from(options.contents.attempts);
		var newOpts = {
		    armed : true,
		    attempt : options.contents.attempt
		};
		if (newOpts.attempt >= options.contents.attempts) {
		    //@todo damage them
		    newOpts.armed = false;
		}

		updateUni = RPG.updateTile({
		    universe : options.game.universe,
		    mapName : options.game.character.location.mapName,
		    tilePaths : RPG.getLastByTileType(options.game.universe.maps[options.game.character.location.mapName],'trap',options.tiles).path,
		    point : options.game.character.location.point,
		    tileOptions : {
			trap : newOpts
		    }
		});

		if (updateUni && updateUni.error) {
		    callback({
			error : updateUni.error
		    });
		    return;
		}

		RPG.Universe.store({
		    user : options.game.user,
		    universe : updateUni
		},function(universe){
		    if (universe.error) {
			callback(universe);
			return;
		    }
		    if (newOpts.armed) {
			updateUni.options = {};//no universe options changed. remove it
			Object.each(updateUni.maps,function(map){
			    map.options = {};//no map options changed. remove it
			});
			callback({
			    traverse : false,
			    error : 'Disarm Failed. Attempts Left: ' + (options.contents.attempts - newOpts.attempt),
			    game : {
				universe : updateUni //send the updated tile info back to the client
			    }
			});
		    } else {
			callback({
			    trap : 'Trap Sprung!'
			});
		    }
		});
	    }
	}
    } else {
	callback();
    }
}

//RPG.TileTypes.trap.onLeave = function(options,callback) {
//    callback();
//}

RPG.TileTypes.trap.onEnter = function(options,callback) {

    if (typeof exports != 'undefined') {

	//server
	if (Object.getFromPath(options,'events.onBeforeEnter.trap')) {
    //remove the tile from the current Universe so it will get reloaded from the database
    //and the client should receive the the cloned tile created above.
    //RPG.removeAllTiles(options.game.universe.maps[options.game.character.location.mapName].tiles, options.game.moveTo);
    //	    RPG.removeCacheTiles(options.game.universe.maps[options.game.character.location.mapName].cache, options.tiles);
    }
    }

    callback();
}


/**
 * Client side disarm window
 */
RPG.Disarm = new (new Class({

    /**
     * required options:
     * options : all the game/event/etc options
     *
     * callbacks
     * success : callback
     * fail : callback
     *
     */
    show : function(options,callbacks) {
	this.trapDialog = new Jx.Dialog.Confirm({
	    id : 'trapkDialog',
	    label : 'It\'s a trap...',
	    question : this.contentDiv = new Element('div'),
	    minimize : false,
	    destroyOnClose : true,
	    resizable : true,
	    maximizable : false,
	    height : 300,
	    width : 360,
	    onClose : function(dialog, value) {
		if (value && this.puzzle && this.puzzle.isSolved()) {
		    var ret = {};
		    //ret becomes like: { '["path","to","tile"]' : solution }
		    ret[JSON.encode(RPG.getLastByTileType(options.game.universe.maps[options.game.character.location.mapName],'trap',options.tiles).path)] = this.puzzle.solution;
		    callbacks && callbacks.success && callbacks.success({
			disarm : ret
		    });
		    this.puzzle.toElement().destroy();
		} else {
		    callbacks && callbacks.fail && callbacks.fail();
		    this.puzzle.toElement().destroy();
		}
	    }.bind(this)
	});

	this.trapDialog.open();
	this.trapDialog.resize();

	if (!Object.getFromPath(RPG,['Puzzles','trap',options.contents.type])) {
	    this.trapDialog.setBusy(true);
	    require(['/client/Game/Puzzles/trap/'+options.contents.type+'.js'],function(){
		this.trapDialog.setBusy(false);
		this.puzzle = new RPG.Puzzles.trap[options.contents.type](options,callbacks);
		this.contentDiv.adopt(this.puzzle.toElement());
	    }.bind(this));
	} else {
	    this.puzzle = new RPG.Puzzles.trap[options.contents.type](options,callbacks);
	    this.contentDiv.adopt(this.puzzle.toElement());
	}
    },

    //serverside solution checking
    checkSolution : function(options) {
	var rand = Object.clone(RPG.Random);
	rand.seed = Number.from(options.contents.seed);

	//get the solution from the client events:
	var solution = Object.getFromPath(options,['game','clientEvents','onBeforeEnter','disarm',JSON.encode(RPG.getLastByTileType(options.game.universe.maps[options.game.character.location.mapName],'trap',options.tiles).path)]);

	switch (options.contents.type) {
	    case  'posion' :
		var code = Math.floor(rand.random(100,999));
		options.game.user.logger.trace('Posion Trap - Checking Solution: ' + solution + ' '+(Number.from(solution) == code?'==':'!=')+' ' + code + ' tile: '+JSON.encode(RPG.getLastByTileType(options.game.universe.maps[options.game.character.location.mapName],'trap',options.tiles).path));
		if (Number.from(solution) == code) {
		    return true;
		} else {
		    return false;
		}
		break;
	}
	return false;
    },

    calcXP : function(options) {
	switch (options.contents.type) {
	    case  'posion' :
		return Math.floor(RPG.levelXP(options.contents.Difficulty, options.contents.level) / 50); //would take 50 disarms to gain a level
		break;
	}
	return 0;
    }
}));