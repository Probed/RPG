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


/**
 * Activating an item on the map will place that item into the characters inventory
 */
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
	    var cachedInv = options.game.inventory.character;
	    var items = 0;
	    var errors = [];
	    var point = options.game.character.location.point;

	    //clone the top most item at the characters current location and set it to be deleted from the map
	    var tile = RPG.getLastByTileType(cachedMap, 'item', options.tiles);
	    var updateUniverse = RPG.getUpdateUniverse({
		universe : options.game.universe,
		mapName : options.game.character.location.mapName,
		tilePaths : tile.path,
		point : options.game.character.location.point,
		tileOptions : {
		    database : {
			deleted : true
		    }
		}
	    });
	    if (updateUniverse.error) {
		errors.push(updateUniverse.error)
	    }

	    //get our inventory update object
	    var updateInventory = RPG.getUpdateMap({
		maps : options.game.inventory,
		mapName : 'character'
	    });

	    if (updateInventory.error) {
		errors.push(updateInventory.error)
	    }

	    //loop through the characters inventory slots to find the first available slot
	    var x = 0;
	    var y = 0;
	    var placed = false;
	    var firstAvail = null;
	    var used = 0;
	    for (x = 0; x<updateInventory.character.options.property.maxRows; x++) {
		for (y = 0; y<updateInventory.character.options.property.maxCols; y++) {
		    //check to see if the slot contains an item already
		    if ((Object.getFromPath(cachedInv,['tiles',x,y]) || []).length > 0) {
			used++;
		    } else if (!firstAvail) {
			firstAvail = [x,y];
		    }
		}
	    }
	    if (!placed && firstAvail) {
		//remove the item from the update universe map
		if (!RPG.removeTile(updateUniverse.maps[options.game.character.location.mapName].tiles, tile.path, point)) {
		    errors.push('Failed to remove the tile: ' + tile.path + ' from ' + options.game.character.location.mapName);
		}

		//clone and push the tile to thier inventory
		if (!RPG.pushTile(updateInventory.character.tiles,firstAvail,
		    RPG.cloneTile(cachedMap.cache,tile.path,updateInventory.character.cache,{
			database : {
			    id : 0 //mark for insert
			}
		    }))) {
		    errors.push('Failed to move the tile: ' + tile.path + ' to character inventory');
		}
		items++;
	    } else if (!placed && !firstAvail) {
		errors.push('Could not take item '+updateUniverse.tileName+'. Inventory Full.');
	    }

	    if (items == 0) {
		if (errors.length > 0) {
		    callback({
			error : errors
		    });
		} else {
		    callback();
		}

	    } else {

		RPG.Universe.store({
		    user : options.game.user,
		    universe : updateUniverse
		},function(universe){
		    if (universe.error) {
			callback(universe);
			return;
		    }
		    RPG.Inventory.storeInventory({
			user : options.game.user,
			character : options.game.character,
			inventory : updateInventory
		    },function(inventory){
			if (inventory && inventory.error) {
			    callback(inventory);
			    return;
			}

			updateUniverse.options = {};//no universe options changed
			Object.each(updateUniverse.maps,function(map){
			    map.options = {};//no map options changed
			});
			inventory.options = {}; //no options changed;
			Object.each(inventory,function(inv){
			    inv.options = {};//no inv options changed
			});

			Object.merge(options.game.universe,universe);
			Object.merge(options.game.inventory,inventory);

			var toClient = {
			    item : item,
			    game : {
				inventory : inventory,
				universe : universe
			    }
			};
			callback(toClient);
		    });
		});

	    }
	} else {
	    callback();
	}
    }
}

RPG.TileTypes.item.inventorySwap = function(options,callback) {

    var updates = null;

    updates = RPG.swapTiles({
	fromMaps : options.game.inventory,
	toMaps : options.game.inventory,
	swap : options.swap
    });

    if (!updates || updates.error) {
	callback({
	    error : (updates && updates.error) || 'Item Swap Failed. Nothing Moved.'
	});
	return;
    }

    if (typeof exports != 'undefined') {
	//server
	RPG.Inventory.storeInventory({
	    user : options.game.user,
	    character : options.game.character,
	    inventory : Object.merge(updates[0],updates[1])
	}, function(inventory) {
	    if (inventory && inventory.error) {
		callback(inventory);
		return;
	    }
	    //update the game cache
	    Object.merge(options.game.inventory,inventory);
	    callback({
		inventory : true //don't need to return anything except success because the client will have generated exaclty the same results (hopefully)'
	    });
	});

    } else {
	//client
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=Play&m=InventorySwap&characterID='+options.game.character.database.characterID,
	    onFailure : function(results) {
		RPG.Dialog.notify(results);
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
		    RPG.Dialog.error(results.events.error);
		}
		if (Object.getFromPath(results,'events.inventory')) {
		    Object.merge(options.game.inventory,updates[0],updates[1]);
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
	var itemCount = 0;
	options.tiles.each(function(tilePath){
	    var tile = Object.getFromPath(options.game.universe.maps[options.game.character.location.mapName].cache,tilePath);
	    if (tile && tile.options && tile.options.item) {
		itemCount++;
	    }
	});

	if (itemCount == 1) {//@todo 11 is test only so we can see dialog in action
	    //automatically take all
	    callbacks.success({
		item : 'all'
	    });
	} else if (itemCount == 0) {

	    callbacks.fail();
	} else {
	    if (this.itemDialog && this.itemDialog.close) {
		this.itemDialog.close();
	    }

	    this.itemDialog = new Jx.Dialog({
		id : 'itemDialog',
		label : 'Select any items you want',
		minimizable : false,
		destroyOnClose : true,
		resize : true,
		maximizable : false,
		modal : false,
		height : 192,
		width : 235,
		onClose : function(dialog, value) {
		    callbacks.success({
			item : 'all'
		    });
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
			    'background-color' : '#3e3e3e',
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
					'class' : 'textTiny CharacterInventory'
				    },
				    content : (new RPG.Item(options.game,tmp.cache,tmp.tiles[r] && tmp.tiles[r][c] && tmp.tiles[r][c][0],new Element('div',{
					html : '&nbsp;',
					styles : Object.merge(styles,{
					    'background-size' : '100% 100%',
					    'background-position' : '0% 0%',
					    //'background-color' : '#3e3e3e',
					    'display' : 'inline-block'
					})
				    }))).toElement()
				});
			    }
			    rows.push(row);
			}
			return rows;
		    })()
		}).toElement()
	    });
	    this.itemDialog.open();
	    this.itemDialog.resize();
	}
    }

}));