/**
 * These tiles can switch the options of another tile
 *
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
RPG.Tiles['switch'] = function(options,callback) {
    var paths = null;
    switch (options.event) {
	case 'onBeforeEnter' :
	    if (typeof exports == 'undefined') {
		//client
		if (!options.contents.auto) {
		    RPG.Switch.show(options,{
			success : function(state){
			    callback(state);
			},
			fail : function() {
			    callback();
			}
		    });
		} else {
		    callback();
		}

	    } else {
		//server
		var state = options.game.clientEvents.onBeforeEnter['switch'] && options.game.clientEvents.onBeforeEnter['switch'].state;
		if (options.contents.auto) {
		    //automaically cycle through the states
		    var idx = Object.keys(options.contents.states).indexOf(options.contents.state);
		    state = Object.keys(options.contents.states)[idx+1] || Object.keys(options.contents.states)[0];
		}

		if (!Object.keys(options.contents.states).contains(state)) {
		    callback();
		    return;
		}

		//aggragate all the paths for a single load from the db
		paths = [];
		options.contents.states[state].each(function(change){
		    paths.push(JSON.encode(change.path.split('.')));
		});

		//make a call to the database since we cannot be assured the tiles will be in the cache
		RPG.Tile.loadTilesCache({
		    user : options.game.user,
		    character: options.game.character,
		    paths : paths,
		    bypassCache : true
		}, function(cache) {
		    if (cache.error) {
			callback({
			    error : cache.error
			});
			return;
		    }

		    //go through each statechange in the array
		    options.contents.states[state].each(function(change) {
			var tile = Object.getFromPath(cache,change.path);
			if (!tile) return;
			Object.merge(tile.options,JSON.decode(change.options,true));
		    });
		    //now store updated tiles
		    RPG.Game.updateGameTile(options,{
			cache : cache
		    },function(universe) {
			if (universe.error) {
			    callback({
				error : universe.error
			    });
			    return;
			}
			//finally callback with the paths so that 'onEnter' can use the list to remove tiles from the cache
			callback({
			    switchPaths : paths
			});
		    });
		});

	    }
	    break;

	case 'onEnter' :
	    //server
	    if (typeof exports != 'undefined' && options.events.onBeforeEnter.switchPaths) {

		//remove the tile from the current Universe so it will get reloaded from the database
		//and the client should receive any switched ones
		paths = [];

		//find and remove all tiles of the specified path
		options.events.onBeforeEnter.switchPaths.each(function(path){
		    path = JSON.decode(path);
		    paths.push(path);
		    var tiles = options.game.universe.maps[options.game.character.location.mapName].tiles;
		    RPG.EachTile(tiles, true, function(tile) {
			if (RPG.tilesContainsPath(tiles,path,[tile.row,tile.col])) {
			    RPG.removeAllTiles(tiles,[tile.row,tile.col]);
			}
		    });
		});
		RPG.removeCacheTiles(options.game.universe.maps[options.game.character.location.mapName].cache,paths);
		Object.erase(options.events.onBeforeEnter,'switchPaths');
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
RPG.Switch = new (new Class({

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
	if ($('switchWindow')) {
	    MUI.closeWindow($('switchWindow'));
	}

	new MUI.Window({
	    id : 'switchWindow',
	    title : 'Choose carefully.',
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
		css : ['/client/Game/Puzzles/switch/'+options.contents.type+'.css'],
		js : ['/client/Game/Puzzles/switch/'+options.contents.type+'.js'],
		onloaded : function() {
		    this.puzzle = new RPG.Puzzles['switch'][options.contents.type](options,callbacks);
		    this.contentDiv.adopt(this.puzzle.toElement());
		}.bind(this)
	    },
	    onContentLoaded : function() {
		$('switchWindow').adopt(RPG.elementFactory.buttons.actionButton({
		    'class' : 'WinFootRight',
		    html : 'Change Switch',
		    events : {
			click : function() {
			    if (this.puzzle && this.puzzle.isSolved()) {
				callbacks.success({
				    'switch' : {
					state : this.puzzle.solution
				    }
				});
				callbacks.fail = null;//set to null so onClose does not call again
				this.puzzle.toElement().destroy();
				$('switchWindow').retrieve('instance').close();
			    } else {
				MUI.notification('Nothing\'s Changed.');
			    }
			}.bind(this)
		    }
		}));

		$('switchWindow').adopt(RPG.elementFactory.buttons.closeButton({
		    'class' : 'WinFootLeft',
		    events : {
			click : function() {
			    callbacks.fail();
			    callbacks.fail = null;//set to null so onClose does not call again
			    $('switchWindow').retrieve('instance').close();
			}
		    }
		}));
	    }.bind(this)
	});
    }
}));