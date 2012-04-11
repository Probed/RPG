/**
 * Handles item triggers
 *
 */

if (!RPG) var RPG = {};
if (!RPG.TileTypes) RPG.TileTypes = {};
if (!RPG.TileTypes.item) RPG.TileTypes.item = {};

if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../../Character/Character.js'));
    Object.merge(RPG,require('../../../server/Game/Universe.njs'));
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
	var item = Object.getFromPath(options,'game.clientEvents.activate.item');

	if (item) {
	    var cachedMap = options.game.universe.maps[options.game.character.location.mapName];
	    var updateMap = null;

	    var updateUniverse = {
		options : options.game.universe.options,
		maps : {}
	    };
	    updateUniverse.maps[options.game.character.location.mapName] = updateMap = {
		options : cachedMap.options,
		tiles : {},
		cache : {}
	    }

	    var cachedInv = options.game.inventory.character;
	    var inv = null;
	    var storeoptions = {
		user : options.game.user,
		character : options.game.character,
		universe : updateUniverse,
		bypassCache : false,
		inventory : {
		    character : inv = {
			options : cachedInv.options,
			tiles : {},
			cache : {}
		    }
		}
	    };

	    var items = 0;
	    var errors = [];

	    var point = options.game.character.location.point;

	    //when removing a tile we need to put the unchanged ones in the update map since it is all or nothing update with tiles
	    RPG.setTiles(updateMap.tiles,point,RPG.getTiles(cachedMap.tiles,point));

	    //go through each of the tiles at the charcters current location
	    options.tiles.each(function(tilePath){
		var tile = Object.getFromPath(cachedMap.cache,tilePath);

		//check to see if the tile is an item
		if (tile && tile.options && tile.options.item) {

		    //put a copy of this tile in our temporary universe - this will be marked for deletion
		    RPG.cloneTile(cachedMap.cache,tilePath,updateMap.cache,{
			database : {
			    deleted : true//mark for deletion
			}
		    });

		    //make a copy of the tilecache and put it in thier inventory
		    RPG.cloneTile(cachedMap.cache,tilePath,inv.cache,{
			database : {
			    id : 0 //mark for insert
			}
		    });

		    //remove the item from the temp map
		    RPG.removeTile(updateMap.tiles,tilePath,point);

		    //Push the item tile into the inventory map
		    //@todo determine where
		    var x = 0;
		    var y = 0;
		    var placed = false;
		    var firstAvail = null;
		    var used = 0;
		    var cachedTiles = null;
		    var invTile = null;
		    for (x = 0; x<inv.options.property.maxRows; x++) {
			for (y = 0; y<inv.options.property.maxCols; y++) {
			    cachedTiles = cachedInv.tiles && cachedInv.tiles[x] && cachedInv.tiles[x][y];
			    if (cachedTiles && cachedTiles.length > 0) {
				used++;
			    } else if (!firstAvail) {
				firstAvail = [x,y];
			    }
			    //check to see if a tile of the type is already in the inventory
			    if (RPG.tilesContainsPartialPath(cachedInv.tiles,RPG.trimPathOfNameAndFolder(tilePath),[x,y])) {
				//lookup exact type based on image name:
				invTile = Object.getFromPath(cachedInv.cache,cachedTiles[0]);
				if (invTile) {
				    var cacheImgName = Object.getFromPath(invTile,'options.property.image.name');
				    var itemImgName = Object.getFromPath(tile.options,'property.image.name');
				    if (cacheImgName === itemImgName) {
					RPG.pushTiles(storeoptions.inventory.character.tiles,[x,y],Array.clone(cachedTiles).append([tilePath]));
					items++;
					placed = true;
				    }
				}
			    }
			}
		    }
		    if (!placed && firstAvail) {
			RPG.pushTile(storeoptions.inventory.character.tiles,firstAvail,tilePath);
			items++;
		    } else if (!placed && !firstAvail) {
			errors.push('Could not take item '+tile.options.property.tileName+'. Inventory Full.');
		    }
		}
	    });
	    if (items == 0) {
		if (errors.length > 0) {
		    callback({
			error : errors
		    });
		} else {
		    callback();
		}

	    } else {

		RPG.Universe.store(storeoptions,function(universe){
		    if (universe.error) {
			callback(universe);
			return;
		    }
		    RPG.Inventory.storeInventory(storeoptions,function(inventory){
			if (inventory && inventory.error) {
			    callback(inventory);
			    return;
			}
			universe.options = {};//no universe options changed
			Object.each(universe.maps,function(map){
			    map.options = {};//no map options changed
			});
			var toClient = {
			    item : item,
			    game : {
				inventory : inventory,
				universe : universe
			    }
			};
			if (errors.length > 0) {
			    toClient.error = errors;
			}
			callback(toClient);
		    });
		});

	    }
	} else {
	    callback();
	}
    }
}

RPG.TileTypes.item.activateComplete = function(options,callback) {
    if (typeof exports == 'undefined') {
	//client-side
	callback();

    } else if (typeof exports != 'undefined') {
	//server-side
	var item = options.events.activate && options.events.activate.item;
	if (item) {
	    //remove all the tiles from the cache so that the client will receive new ones
	    RPG.removeAllTiles(options.game.universe.maps[options.game.character.location.mapName].tiles,options.game.character.location.point);
	}
	callback();
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

RPG.TileTypes.item.inventorySwap = function(options,callback) {

    //create a fakeUni because we are dealing with an 'inventory' type map thingy
    var fakeUni = RPG.swapTiles({
	universe : {
	    maps : options.game.inventory
	},
	swap : options.swap
    });

    if (!fakeUni || fakeUni.error) {
	callback({
	    error : (fakeUni && fakeUni.error) || 'Inventory Swap Failed. Nothing Moved.'
	});
	return;
    }

    if (typeof exports != 'undefined') {
	//server
	RPG.Inventory.storeInventory({
	    user : options.game.user,
	    character : options.game.character,
	    inventory : fakeUni.maps
	}, function(inventory) {
	    if (inventory && inventory.error) {
		callback(inventory);
		return;
	    }
	    callback({
		inventory : true //don't need to return anything except success because the client will have generated exaclty the same results (hopefully)'
	    });
	});

    } else {
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=Play&m=InventorySwap&characterID='+options.game.character.database.characterID,
	    onFailure : function(results) {
		RPG.Error.notify(results);
		if (results.responseText) {
		    var resp = JSON.decode(results.responseText,true);
		    if (resp) {
			options.game.events = resp.events;//make sure this isn't merged
			Object.merge(options.game,results);
		    }
		    callback(resp);
		} else {
		    callback();
		}
	    },
	    onSuccess : function(results) {
		if (Object.getFromPath(results,'events.error')) {
		    RPG.Error.show(results.events.error);
		}
		if (Object.getFromPath(results,'events.inventory')) {
		    Object.merge(options.game.inventory,fakeUni.maps);
		}
		options.game.events = results && results.events;
		Object.merge(options.game,results);
		callback(results);
	    }
	}).post(JSON.encode(options.swap));
    }

}

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
	var itemCount = 0;
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
			    itemCount++;
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

	if (itemCount == 1) {
	    //automatically take all
	    callbacks.success({
		item : 'all'
	    });
	    callbacks.fail = null;//set to null so onClose does not call again
	    $('itemWindow').retrieve('instance').close();
	} else if (itemCount == 0) {

	    callbacks.fail();
	    callbacks.fail = null;//set to null so onClose does not call again
	    $('itemWindow').retrieve('instance').close();
	}
    }

}));