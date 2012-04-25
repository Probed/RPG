/**
 * These are tiles that can locked/unlocked
 * locked tiles prevent a character from entering them unil unlocked.
 */

if (!RPG) var RPG = {};
if (!RPG.TileTypes) RPG.TileTypes = {};
if (!RPG.TileTypes.lockable) RPG.TileTypes.lockable = {};
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

//RPG.TileTypes.lockable.onBeforeLeave = function(options,callback) {
//    callback();
//}

RPG.TileTypes.lockable.activate = RPG.TileTypes.lockable.onBeforeEnter = function(options,callback) {
    if (options.contents.locked) {

	//prompt the client when they activate the tile, or when the lock prevents traversal and the character is attempting to enter the tile:
	if (typeof exports == 'undefined' && ((options.event == 'activate') || (options.contents.preventTraverse && options.event == 'onBeforeEnter'))) {
	    //client
	    //@todo unlock attempt
	    RPG.Unlock.show(options,{
		success : function(unlock){
		    //send back the solution object to the server for verification
		    callback(unlock);
		},
		fail : function() {
		    callback({
			traverse : !options.contents.preventTraverse,
			error : 'Locked'
		    });
		}
	    });

	} else if (typeof exports != 'undefined' && Object.getFromPath(options,['game','clientEvents',options.event,'unlock'])) {

	    //server
	    if (RPG.Unlock.checkSolution(options)) {
		var updateUni = RPG.getUpdateUniverse({
		    universe : options.game.universe,
		    mapName : options.game.character.location.mapName,
		    tilePaths : RPG.getLastByTileType(options.game.universe.maps[options.game.character.location.mapName],'lockable',options.tiles).path,
		    point : options.game.character.location.point,
		    tileOptions : {
			lockable : {
			    locked : false
			}
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
		    var oldXp = options.game.character.xp;

		    //Calculate XP:
		    var baseXP = RPG.Unlock.calcXP(options);

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
			    lockable : ['Unlock attempt Successful.',xp],
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

		callback({
		    traverse : false,
		    error : 'Locked'
		});
	    }
	} else {
	    callback();
	}
    } else {
	callback();
    }

}

//RPG.TileTypes.lockable.onLeave = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.lockable.activateComplete = RPG.TileTypes.lockable.onEnter = function(options,callback) {
//    callback();
//}

/**
 * Client side unlock window
 */
RPG.Unlock = new (new Class({

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
	if (this.unlockDialog) {
	//this.unlockDialog.close();
	}

	this.unlockDialog = new Jx.Dialog.Confirm({
	    id : 'unlockDialog',
	    label : 'This needs unlocking...',
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
		    ret[JSON.encode(RPG.getLastByTileType(options.game.universe.maps[options.game.character.location.mapName],'lockable',options.tiles).path)] = this.puzzle.solution;
		    callbacks && callbacks.success && callbacks.success({
			unlock : ret
		    });
		    this.puzzle.toElement().destroy();
		} else {
		    callbacks && callbacks.fail && callbacks.fail();
		    this.puzzle.toElement().destroy();
		}
	    }.bind(this)
	});

	this.unlockDialog.open();
	this.unlockDialog.resize();

	if (!Object.getFromPath(RPG,['Puzzles','lockable',options.contents.type])) {
	    this.unlockDialog.setBusy(true);
	    require(['/client/Game/Puzzles/lockable/'+options.contents.type+'.js'],function(){
		this.unlockDialog.setBusy(false);
		this.puzzle = new RPG.Puzzles.lockable[options.contents.type](options,callbacks);
		this.contentDiv.adopt(this.puzzle.toElement());
	    }.bind(this));
	} else {
	    this.puzzle = new RPG.Puzzles.lockable[options.contents.type](options,callbacks);
	    this.contentDiv.adopt(this.puzzle.toElement());
	}
    },

    //serverside solution checking
    checkSolution : function(options) {
	var rand = Object.clone(RPG.Random);
	rand.seed = Number.from(options.contents.seed);

	//get the solution from the client events:
	var solution = Object.getFromPath(options,['game','clientEvents',options.event,'unlock',JSON.encode(RPG.getLastByTileType(options.game.universe.maps[options.game.character.location.mapName],'lockable',options.tiles).path)]);

	//check solution
	switch (options.contents.type) {
	    case  'tumbler' :
		var code = Math.floor(rand.random(100,999));
		options.game.user.logger.trace('Tumbler Lock - Checking Solution: ' + solution + ' '+(Number.from(solution) == code?'==':'!=')+' ' + code + ' tile: '+JSON.encode(RPG.getLastByTileType(options.game.universe.maps[options.game.character.location.mapName],'lockable',options.tiles).path));
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
	    case  'tumbler' :
		return Math.floor(RPG.levelXP(options.contents.Difficulty, options.contents.level) / 50); //would take 50 unlock to gain a level
		break;
	}
	return 0;
    }
}));