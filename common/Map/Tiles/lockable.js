/**
 * These are tiles that can locked/unlocked
 * locked tiles prevent a character from entering them unil unlocked.
 */

if (!RPG) var RPG = {};
if (!RPG.Tiles) RPG.Tiles = {};
if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../../Character/Character.js'));
    Object.merge(RPG,require('../../../server/Map/MapEditor.njs'));
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
RPG.Tiles.lockable = function(options,callback) {

    switch (options.event) {
	case 'onBeforeEnter' :
	    if (options.contents.locked) {
		if (typeof exports == 'undefined') {
		    //client
		    //@todo unlock attempt
		    RPG.Unlock.show(options,{
			success : function(solution){
			    callback(solution);
			},
			fail : function() {
			    callback({
				traverse : false,
				error : 'Locked'
			    });
			}
		    });

		} else {
		    //server

		    //@todo check solution:
		    if (RPG.Unlock.checkSolution(options)) {
			//@todo update tile
			callback({
			    lockable : 'Unlock attempt Successful.'
			});

		    } else {

			callback({
			    traverse : false,
			    error : 'Locked'
			});
		    }
		}
	    } else {
		callback();
	    }
	    break;
	default :
	    callback();
    }
}

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
	if ($('unlockWindow')) {
	    MUI.closeWindow($('unlockWindow'));
	}

	new MUI.Window({
	    id : 'unlockWindow',
	    title : 'This needs unlocking...',
	    type : 'window',
	    loadMethod : 'html',
	    content : this.contentDiv = new Element('div'),
	    collapsible : false,
	    storeOnClose : false,
	    resizable : true,
	    maximizable : false,
	    minimizable : false,
	    closable : true,
	    height : 180,
	    width : 330,
	    onClose : function() {
		callbacks.fail && callbacks.fail();
	    },
	    require : {
		css : ['/client/Game/Puzzles/lockable/'+options.contents.type+'.css'],
		js : ['/client/Game/Puzzles/lockable/'+options.contents.type+'.js'],
		onloaded : function() {
		    this.puzzle = new RPG.Puzzles.lockable[options.contents.type](options,callbacks);
		    this.contentDiv.adopt(this.puzzle.toElement());
		}.bind(this)
	    },
	    onContentLoaded : function() {
		$('unlockWindow').adopt(RPG.elementFactory.buttons.actionButton({
		    'class' : 'WinFootRight',
		    html : 'Attempt Unlock',
		    events : {
			click : function() {
			    if (this.puzzle && this.puzzle.isSolved()) {
				callbacks.success({
				    solution : this.puzzle.solution
				});
				callbacks.fail = null;//set to null so onClose does not call again
				this.puzzle.toElement().destroy();
				$('unlockWindow').retrieve('instance').close();

			    } else {
				MUI.notification('Attempt Failed. Try again.');
			    }
			}.bind(this)
		    }
		}));

		$('unlockWindow').adopt(RPG.elementFactory.buttons.closeButton({
		    'class' : 'WinFootLeft',
		    events : {
			click : function() {
			    callbacks.fail();
			    callbacks.fail = null;//set to null so onClose does not call again
			    $('unlockWindow').retrieve('instance').close();
			}
		    }
		}));
	    }.bind(this)
	});
    },

    //serverside solution checking
    checkSolution : function(options) {
	var rand = Object.clone(RPG.Random);
	rand.seed = Number.from(options.contents.seed);
	switch (options.contents.type) {
	    case  'tumbler' :
		var code = Math.floor(rand.random(100,999));
		if (Number.from(options.game.clientEvents.onBeforeEnter.solution) == code) {
		    return true;
		} else {
		    return false;
		}
		break;
	}
	return false;
    }
}));