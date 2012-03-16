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
		    if (RPG.Unlock.checkSolution(options)) {
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

			options.tiles.each(function(tilePath){
			    //clone each tile at the moveTo point

			    RPG.pushTile(map.tiles,options.game.moveTo,
				RPG.cloneTile(currentMap.cache,tilePath,map.cache,{
				    lockable : {
					locked : false
				    }
				})
				);
			});
			RPG.Log('debug',newUniverse);

			//save our newUniverse tile changes
			RPG.Universe.store({
			    user : options.game.user,
			    universe : newUniverse,
			    bypassCache : true
			},function(universe){
			    if (universe.error) {
				callback(universe);
				return;
			    }
			    var oldXp = options.game.character.xp;

			    //Calculate XP:
			    var baseXP = RPG.Unlock.calcXP(options);

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

				    //remove the tile from the current Universe so it will get reloaded from the database
				    //and the client should receive the the new tile created above.
				    RPG.removeAllTiles(currentMap.tiles,options.game.moveTo);
				    RPG.removeCacheTiles(currentMap.cache,options.tiles);

				    //finally callback
				    callback({
					lockable : 'Unlock attempt Successful.'
				    });

				});//end store character
			    });//end calcXP
			});//end store universe
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
	    width : 350,
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
    },

    calcXP : function(options) {
	switch (options.contents.type) {
	    case  'tumbler' :
		return 100 * options.contents.level * (RPG.difficultyVal(options.contents.Difficulty,'Puzzle.lockable.tumbler') || 1);
		break;
	}
	return 0;
    }
}));

l={
    "options":{
	"database":{
	    "universeID":10
	},
	"property":{
	    "universeName":"Loiwhifpy's Universe",
	    "author":"Generated",
	    "startMap":"StartMap"
	},
	"settings":{
	    "activeMap":"Tiigkar's Barn"
	}
    },
"maps":{
    "Tiigkar's Barn":{
	"options":{
	    "property":{
		"mapName":"Tiigkar's Barn",
		"author":"Generated"
	    },
	    "generator":{
		"":{
		    "options":{
			"properties":{
			    "name":"Fersa",
			    "seed":90861320494.69685,
			    "Difficulty":"Easy",
			    "level":1
			},
			"house":{
			    "type":"world.earth.room.house",
			    "rows":3,
			    "cols":2
			},
			"property":{
			    "lawn":"terrain.earth.solid.sand",
			    "fence":"world.earth.fence.iron",
			    "sidewalk":"world.earth.sidewalk.brick2",
			    "gate":"world.earth.gate.iron",
			    "tree":"world.earth.tree.pine",
			    "tree%":69.14937496185303
			},
			"mainFloor":{
			    "floor":"24.png",
			    "decor%":5.9363603591918945,
			    "perim%":96.80905351415277,
			    "center%":96.26843929290771,
			    "door":"world.earth.door.brick2",
			    "doorsLocked":true
			},
			"upStairs":{
			    "allow":false,
			    "floor":"3.png",
			    "decor%":46.408653259277344,
			    "perim%":76.39219760894775,
			    "center%":42.740583419799805,
			    "door":"world.earth.door.brick2"
			},
			"downStairs":{
			    "allow":false,
			    "floor":"29.png",
			    "decor%":36.327219009399414,
			    "perim%":79.1588544845581,
			    "center%":72.44300842285156,
			    "door":"world.earth.door.brick2"
			}
		    }
		}
	},
"database":{
    "minRow":0,
    "minCol":0,
    "maxRow":40,
    "maxCol":29,
    "mapID":26
}
},
"tiles":{},
"cache":{}
}
}
}