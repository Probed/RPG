/**
 * Handles item triggers
 *
 */

if (!RPG) var RPG = {};
if (!RPG.TileTypes) RPG.TileTypes = {};
if (!RPG.TileTypes.item) RPG.TileTypes.item = {};
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

//RPG.TileTypes.item.tick = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.item.tickComplete = function(options,callback) {
//    callback();
//}

RPG.TileTypes.item.activate = function(options,callback) {
    if (typeof exports == 'undefined') {
	//client-side
	RPG.ItemList.show(options,{
	    success : function(success){
		callback(success);
	    },
	    fail : function(){
		callback();//no error.. just do nothing
	    }
	});

    } else if (typeof exports != 'undefined') {
	//server-side
	callback();
    }
}

RPG.TileTypes.item.activateComplete = function(options,callback) {
    if (typeof exports == 'undefined') {
	//client-side
	callback();

    } else if (typeof exports != 'undefined') {
	//server-side
	var item = Object.getFromPath(options,'game.clientEvents.activate.item');

	if (item == 'all') {

	    var cachedMap = options.game.universe.maps[options.game.character.location.mapName];
	    var tmpMap = null;

	    var tmpUni = {
		options : options.game.universe.options,
		maps : {}
	    };
	    tmpUni.maps[options.game.character.location.mapName] = tmpMap = {
		options : options.game.universe.maps[options.game.character.location.mapName].options,
		tiles : {},
		cache : {}
	    }

	    var items = 0;
	    //go through each of the tiles at the charcters current location
	    options.tiles.each(function(tilePath){
		var tile = Object.getFromPath(cachedMap.cache,tilePath);
		var point = options.game.character.location.point;
		//check to see if the tile is an item
		if (tile && tile.options && tile.options.item) {

		    var opts = Object.clone(tile.options);

		    //mark the item for deletion
		    opts.database.deleted = true;

		    //put a copy of this tile in our temporary universe
		    RPG.cloneTile(cachedMap.cache,tilePath,tmpMap.cache,opts);

		    //remove the path from the cached map
		    RPG.removeTile(cachedMap.tiles,tilePath,point);

		    //ensure all other tiles get updated
		    if (!tmpMap.tiles[point[0]]) tmpMap.tiles[point[0]] = {};
		    tmpMap.tiles[point[0]][point[1]] = cachedMap.tiles[point[0]][point[1]];

		    items++;
		}
	    });
	    if (items == 0) {
		callback();
	    } else {
		var storeoptions = {
		    user : options.game.user,
		    character : options.game.character,
		    universe : Object.clone(tmpUni),
		    bypassCache : false
		};
		RPG.Universe.store(storeoptions,function(universe){
		    if (universe.error) {
			callback(universe);
			return;
		    }
		    //now that the item has been successfully removed from the universe, we need to add it to the characters inventory
		    options.tiles.each(function(tilePath){
			//remove the 'database' option since we are now inserting
			var tmpTile = Object.getFromPath(tmpMap.cache,tilePath);
			if (tmpTile && tmpTile.options && tmpTile.options.item) {
			    Object.erase(tmpTile.options,'database');//get rid of any database stuff so it will be inserted
			}
		    });

		    storeoptions.tableId = 'inventory';
		    storeoptions.map = tmpMap;
		    RPG.Tile.storeCache(storeoptions,function(universe){
			if (universe && universe.error) {
			    callback(universe);
			    return;
			}

			//remove all the tiles from the cache so that the client will receive new ones
			RPG.removeAllTiles(cachedMap.tiles,options.game.character.location.point);
			callback();
		    });
		});

	    }

	} else {
	    callback();
	}
    }
}

//RPG.TileTypes.item.onBeforeLeave = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.item.onBeforeEnter = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.item.onLeave = function(options,callback) {
//    callback();
//}

//RPG.TileTypes.item.onEnter = function(options,callback) {
//    callback();
//}



/**
 * Client Side Item List window
 */
RPG.ItemList = new (new Class({

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
	if ($('itemWindow')) {
	    MUI.closeWindow($('itemWindow'));
	}

	new MUI.Window({
	    id : 'itemWindow',
	    title : 'What do you want to take?',
	    type : 'window',
	    loadMethod : 'html',
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
	    onContentLoaded : function() {
		$('itemWindow').adopt(RPG.elementFactory.buttons.actionButton({
		    'class' : 'WinFootRight',
		    html : 'Take All',
		    events : {
			click : function() {
			    callbacks.success({
				item : 'all'
			    });
			    callbacks.fail = null;//set to null so onClose does not call again
			    $('itemWindow').retrieve('instance').close();
			}.bind(this)
		    }
		}));

		$('itemWindow').adopt(RPG.elementFactory.buttons.closeButton({
		    'class' : 'WinFootLeft',
		    events : {
			click : function() {
			    callbacks.fail();
			    callbacks.fail = null;//set to null so onClose does not call again
			    $('itemWindow').retrieve('instance').close();
			}
		    }
		}));
	    }.bind(this),
	    content : new HtmlTable({
		zebra : false,
		selectable : false,
		useKeyboard : false,
		properties : {
		    cellpadding : 0,
		    border : 0,
		    align : 'center',
		    styles : {
			'border-spacing' : '8px',
			'border-collapse' : 'separate'
		    }
		},
		rows : (function(){
		    var rows = [];
		    var row = null;
		    var r = 0;
		    var c = 0;

		    var map = options.game.universe.maps[options.game.character.location.mapName];
		    var tmp = {
			tiles : {},
			cache : {}
		    };

		    //go through each of the tiles at the charcters current location
		    options.tiles.each(function(tilePath){
			var tile = Object.getFromPath(map.cache,tilePath);

			//check to see if the tile is an item
			if (tile && tile.options && tile.options.item) {
			    //push the item to our tmp map for display
			    RPG.pushTile(tmp.tiles,[r,c],RPG.createTile(RPG.trimPathOfNameAndFolder(tilePath),tmp.cache,tile.options));
			    r++;
			    if ((r % 3) == 0) {
				r = 0;
				c++;
			    }
			    if ((c % 3) == 0) {
				c = 0;
			    }
			}
		    });

		    for (r=0;r<3;r++) {
			row = [];
			for (c=0;c<3;c++) {

			    var styles = RPG.getMapTileStyles({
				map : tmp,
				row : r,
				col : c,
				rowOffset : 0,
				colOffset : 0,
				zoom : 32
			    });
			    row.push({
				properties : {
				    'class' : 'textTiny',
				    styles : Object.merge(styles,{
					border : '1px solid white',
					'background-size' : '100% 100%',
					'background-position' : '0% 0%'
				    })
				},
				content : '&nbsp;'
			    });
			}
			rows.push(row);
		    }
		    return rows;
		})()
	    }).toElement()
	});
    }

}));