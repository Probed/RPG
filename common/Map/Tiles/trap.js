/**
 * These are tiles that can armed/unarmed
 * armed tiles prevent a character from entering them unil unarmed.
 */

if (!RPG) var RPG = {};
if (!RPG.Tiles) RPG.Tiles = {};
if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../../Character/Character.js'));
    Object.merge(RPG,require('../../../server/Map/MapEditor.njs'));
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
RPG.Tiles.trap = function(options,callback) {

    switch (options.event) {
	case 'onBeforeEnter' :
	    if (options.contents.armed) {
		if (typeof exports == 'undefined') {
		    //client
		    //@todo disarm attempt
		    RPG.Disarm.show(options,{
			success : function(solution){
			    callback(solution);
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

			//update the tile to make it disarmed.
			RPG.Game.updateGameTile(options,{
			    tileType : 'trap',
			    tileOptions : {
				trap : {
				    armed : false
				}
			    }
			},function(universe){
			    if (universe.error) {
				callback(universe);
				return;
			    }
			    var oldXp = options.game.character.xp;

			    //Calculate XP:
			    var baseXP = RPG.Disarm.calcXP(options);

			    //apply XP modifiers
			    RPG.Character.calcXP(baseXP,options,function(xp){
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

				    options.game.character = character;

				    //finally callback
				    callback({
					trap : 'Disarm attempt Successful. xp: '+xp
				    });

				});//end store character
			    });//end calcXP
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

			RPG.Game.updateGameTile(options,{
			    tileType : 'trap',
			    tileOptions : {
				trap : newOpts
			    },
			    bypassCache : true
			},function(universe){
			    if (universe.error) {
				callback(universe);
				return;
			    }
			    if (newOpts.armed) {
				var out = Object.clone(universe);
				Object.erase(out,'options');
				Object.erase(out.maps[options.game.character.location.mapName],'options');
				Object.merge(options.game.universe,out);//update the cache
				callback({
				    traverse : false,
				    error : 'Disarm Failed. Attempts Left: ' + (options.contents.attempts - newOpts.attempt),
				    game : {
					universe : out //send the updated tile info back to the client
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
	    break;

	case 'onEnter' :
	    //server
	    if (typeof exports != undefined && options.events.onBeforeEnter.trap) {

		//remove the tile from the current Universe so it will get reloaded from the database
		//and the client should receive the the cloned tile created above.
		RPG.removeAllTiles(options.game.universe.maps[options.game.character.location.mapName].tiles, options.game.moveTo);
		RPG.removeCacheTiles(options.game.universe.maps[options.game.character.location.mapName].cache, options.tiles);
	    }
	    callback();
	    break;

	default :
	    callback();
    }
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
	if ($('disarmWindow')) {
	    MUI.closeWindow($('disarmWindow'));
	}

	new MUI.Window({
	    id : 'disarmWindow',
	    title : 'This needs disarming...',
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
	    width : 350,
	    onClose : function() {
		callbacks.fail && callbacks.fail();
	    },
	    require : {
		css : ['/client/Game/Puzzles/trap/'+options.contents.type+'.css'],
		js : ['/client/Game/Puzzles/trap/'+options.contents.type+'.js'],
		onloaded : function() {
		    this.puzzle = new RPG.Puzzles.trap[options.contents.type](options,callbacks);
		    this.contentDiv.adopt(this.puzzle.toElement());
		}.bind(this)
	    },
	    onContentLoaded : function() {
		$('disarmWindow').adopt(RPG.elementFactory.buttons.actionButton({
		    'class' : 'WinFootRight',
		    html : 'Attempt Disarm',
		    events : {
			click : function() {
			    if (this.puzzle && this.puzzle.isSolved()) {
				callbacks.success({
				    solution : this.puzzle.solution
				});
				callbacks.fail = null;//set to null so onClose does not call again
				this.puzzle.toElement().destroy();
				$('disarmWindow').retrieve('instance').close();

			    } else {
				MUI.notification('Attempt Failed. Try again.');
			    }
			}.bind(this)
		    }
		}));

		$('disarmWindow').adopt(RPG.elementFactory.buttons.closeButton({
		    'class' : 'WinFootLeft',
		    events : {
			click : function() {
			    callbacks.fail();
			    callbacks.fail = null;//set to null so onClose does not call again
			    $('disarmWindow').retrieve('instance').close();
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
	    case  'posion' :
		var code = Math.floor(rand.random(100,999));
		if (Number.from(options.game.clientEvents.onBeforeEnter.solution) == code) {
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
		return 100 * options.contents.level * (RPG.difficultyVal(options.contents.Difficulty,'Puzzle.trap.posion') || 1);
		break;
	}
	return 0;
    }
}));