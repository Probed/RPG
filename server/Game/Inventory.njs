var RPG = module.exports = {};
Object.merge(RPG,require('../../common/Game/Tiles/Utilities.js'));

var logger = RPG.Log.getLogger('RPG.Inventory');

RPG.Inventory = new (RPG.InventoryClass = new Class({

    initialize : function() {
	logger.trace('Initialized');
    },
    /**
     * Load multiple inventories
     * options :
     *	    user
     *	    character
     *	    names
     *
     */
    loadInventories : function(options,callback) {
	if (!RPG.Constraints.requiredOptions(options,['character','user','names'],logger,callback)){
	    return;
	}

	options.user.logger.trace('Loading Inventories: ' + options.names);
	var inventory = {};
	var load = this.loadInventory;
	var loadChain = new Chain();
	var errors = [];
	options.names.each(function(name,index){
	    loadChain.chain(function(){
		if (index == 0) {
		    //options.user.logger.trace('Inventories Start Load Chain.');
		}
		options.name = name;
		load(options,function(inv){
		    if (inv && inv.error) {
			errors.push(inv.error);
		    } else {
			Object.merge(inventory,inv);
		    }
		    //options.user.logger.trace('Inventories Next Load Chain.');
		    loadChain.callChain();
		});

	    });
	});
	loadChain.chain(function(){
	    if (errors.length > 0) {
		callback({
		    error : errors
		});
	    } else {
		//options.user.logger.trace('Inventories Finished Load Chain.');
		callback(inventory);
	    }
	});
	loadChain.callChain();
    },

    /**
     * required options:
     *	    user
     *	    character
     *	    name
     *
     *
     * Returns :
     * callback(inventory || error)
     */
    loadInventory : function(options,callback) {
	if (!RPG.Constraints.requiredOptions(options,['character','user','name'],logger,callback)){
	    return;
	}

	if (!options.bypassCache) {
	    var inventory = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'inventory_'+options.character.database.characterID + '_'+options.name);
	    if (inventory) {
		options.user.logger.trace('Inventory Load "'+options.name+'" (cached)');
		RPG.Inventory.loadTiles(options,function(tileInv){
		    if (tileInv.error) {
			callback(tileInv);
			return;
		    }
		    callback(Object.merge(inventory,tileInv));
		});
		return;
	    }
	}


	var sql = '';
	var args = [];

	sql = 'SELECT inventoryID, i.name, i.options '+
	'FROM inventory i, characters c ' +
	'WHERE c.userID = ? '+
	'AND i.name = ? ' +
	'AND i.characterID = ? ' +
	'AND i.characterID = c.characterID ';
	args = [
	options.user.options.userID,
	options.name,
	options.character.database.characterID
	];

	RPG.Mysql.query(sql,args,
	    function(err,iResults) {
		if (err) {
		    options.user.logger.error('Inventory Load error: name:'+options.name + ' error: '+ JSON.encode(err));
		    callback({
			error : err
		    });
		} else if (iResults && iResults[0]) {
		    var iResult = iResults[0];
		    var inventory = {};

		    inventory[iResult['name']] = {
			options : JSON.decode(iResult['options'],true) || {}
		    };
		    inventory[iResult['name']].options.database = {
			id : iResult['inventoryID']
		    };
		    options.tilePoints = 'all';

		    if (!options.bypassCache) {
			options.user.logger.trace('Inventory Load Cached: name:'+options.name);
			require('../Cache.njs').Cache.merge(options.user.options.userID,'inventory_'+options.character.database.characterID + '_'+options.name,inventory);
		    } else {
			options.user.logger.trace('Inventory Loaded Non-cache: name:'+options.name);
		    }
		    RPG.Inventory.loadTiles(options,function(tileInv){
			if (tileInv.error) {
			    callback(tileInv);
			    return;
			}
			callback(Object.merge(inventory,tileInv));
		    });

		} else {
		    options.user.logger.trace('Inventory Load warning: name:'+options.name + ' Not Found.');
		    callback({});
		}
	    });
    },

    /**
     * Store Inventory data
     *
     * options
     *     user
     *     character
     *     inventory
     *
     * returns
     * callback(inventory || error)
     */
    storeInventory : function(options,callback) {
	if (!RPG.Constraints.requiredOptions(options,['character','user','inventory'],logger,callback)){
	    return;
	}

	options.errors = options.errors || [];

	var remove = null;
	var update = null;
	var insert = null;

	//go through all the inventory in the universe
	Object.each(options.inventory,function(inv,name,source){
	    //get this inventory database options
	    var db = Object.getFromPath(inv,'options.database');
	    if (db && db.id) {

		//remove tiles specified in db.tileDelete (array of points)
		if (db && db.deleted) {
		    if (!remove) remove = RPG.Mysql.createQueue();
		    //perform any deletes
		    remove.queue('DELETE FROM inventory ' +
			'WHERE characterID = ? ' +
			'AND inventoryID = ? ',
			[
			options.character.database.characterID,
			db.id
			],
			function(err,info){
			    if (err) {
				options.user.logger.error('Inventory Store - Delete error: name:'+name + ' error: '+ JSON.encode(err));
				options.errors.push(err);
			    } else {
				if (info.affectedRows) {
				    if (!options.bypassCache) {
					require('../Cache.njs').Cache.remove(options.user.options.userID,'inventory_'+options.character.database.characterID + '_'+name);
					options.user.logger.trace('Inventory Store Deleted (cached): inventory: '+name);
				    } else {
					options.user.logger.trace('Inventory Store Deleted (non-cached): inventory: '+name);
				    }
				    Object.erase(options.inventory,name);
				} else {
				    options.user.logger.error('Inventory Store - Delete error: name:'+name + ' error: 0 Affected Rows');
				    options.errors.push('Could not delete Inventory ' + inv.options.property.name);
				}
			    }
			});
		} else if (db.id) {
		    //perform any deletes
		    if (!update) update = RPG.Mysql.createQueue();
		    update.queue('UPDATE inventory ' +
			'SET name = ?,' +
			'options = ? ' +
			'WHERE characterID = ? ' +
			'AND inventoryID = ? ' ,
			[
			inv.options.property.name,
			JSON.encode(inv.options),
			options.character.database.characterID,
			db.id
			],
			function(err,info){
			    if (err) {
				options.user.logger.error('Inventory Store - Update error: name:'+name + ' error: '+ JSON.encode(err));
				options.errors.push(err);
			    } else {
				if (info.affectedRows) {
				    options.user.logger.trace('Inventory Store - Updated '+info.affectedRows+' name:'+name);
				    inv.options.database = db;
				} else {
				    options.user.logger.error('Inventory Store - Update error: name:'+name + ' error: 0 Affected Rows');
				    options.errors.push('Could not update inventory item ' + inv.options.property.name);
				}
			    }
			});
		}
	    } else {
		if (!insert) insert = RPG.Mysql.createQueue();
		insert.queue('INSERT INTO inventory ' +
		    'SET characterID = ?, ' +
		    'name = ?, ' +
		    'options = ?',
		    [
		    options.character.database.characterID,
		    inv.options.property.name,
		    JSON.encode(inv.options),
		    ],
		    function(err,info){
			if (err) {
			    options.user.logger.error('Inventory Store - Insert error: name:'+name + ' error: '+ JSON.encode(err));
			    options.errors.push(err);
			} else {

			    if (info && info.insertId) {
				inv.options.database = {
				    id : info.insertId
				};
				options.user.logger.trace('Inventory Insert - Updated id:'+info.insertId+' name:'+name + ' error: '+ JSON.encode(err));
			    } else {
				options.user.logger.error('Inventory Insert - Update error: name:'+name + ' error: 0 Inserted Rows');
				options.errors.push('Could not insert inventory item ' + inv.options.property.name);
			    }
			}
		    });
	    }
	});

	//now that everything is all queued up:
	options.user.logger.trace('Inventory Store - Starting Store Queue: ' + Object.keys(options.inventory));
	RPG.Mysql.executeQueues([remove,update,insert],true,function(){
	    options.user.logger.trace('Inventory Store - Finished Store Queue: ' + Object.keys(options.inventory));
	    if (options.errors && options.errors.length > 0) {
		callback({
		    error : options.errors
		})
		return;
	    }
	    RPG.Inventory.storeCache(options,function(){
		if (options.errors && options.errors.length > 0) {
		    callback({
			error : options.errors
		    })
		    return;
		}

		RPG.Inventory.storeTiles(options,function(){
		    if (options.errors && options.errors.length > 0) {
			callback({
			    error : options.errors
			})
			return;
		    }
		    Object.each(options.inventory,function(inv,name){
			if (!options.bypassCache) {
			    require('../Cache.njs').Cache.merge(options.user.options.userID,'inventory_'+options.character.database.characterID + '_'+name,Object.clone(options.inventory));
			    options.user.logger.trace('Inventory Store Updated (cached): inventory: '+name);
			}
		    });
		    callback(options.inventory);
		});

	    });
	});

    },
    /**
     * List available inventory
     *	    character,
     *	    user //@todo restrict by user
     *
     * returns:
     * callback(inventory || error)
     */
    listInventories : function(options,callback) {
	if (!RPG.Constraints.requiredOptions(options,['character','user'],logger,callback)){
	    return;
	}

	RPG.Mysql.query(
	    'SELECT inventoryID, i.name, options, '+
	    '   (SELECT count(1) FROM inventorytiles WHERE inventoryID = i.inventoryID) as totalArea, ' +
	    '   (SELECT count(1) FROM inventorycache WHERE inventoryID = i.inventoryID) as totalObjects ' +
	    'FROM inventory i ' +
	    'WHERE i.characterID = ? ' +
	    'ORDER BY i.name ASC',
	    [
	    options.character.database && options.character.database.characterID
	    ],
	    function(err,results) {
		if (err) {
		    options.user.logger.error('Inventory List error: characterID:'+(options.character.database.characterID)+ ' error: '+ JSON.encode(err));
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0]) {
			var inventory = {};

			results.each(function(result){
			    inventory[result['name']] = {
				options : Object.merge({
				    database : {
					id : result['inventoryID'],
					userName : result['userName'],
					totalArea : result['totalArea'],
					totalObjects : result['totalObjects']
				    }
				},
				JSON.decode(result['options'],true)
				    )
			    };
			});
			options.user.logger.trace('Inventory Listing '+results.length+' for characterID:'+options.character.database.characterID);
			callback(inventory);

		    } else {
			options.user.logger.warn('Inventory List not found for characterID:'+options.character.database.characterID);
			callback({
			    error : 'No Inventories found.'
			});
		    }
		}
	    }
	    );
    },
    /**
     * required options:
     *
     * user
     * character
     * name
     * tilePoints = array of points [point,point,point] (point=[x,y])
     *
     * optional:
     *	bypassCache
     *
     * Returns:
     * callback = returns an object which is mergable with a universe object.
     * return =
     *	    inventory : {
     *	     [name] : {
     *		    cache : {}
     *		    tiles : {}
     *		}
     *	    }
     *
     */
    loadTiles : function(options,callback) {
	if (!RPG.Constraints.requiredOptions(options,['character','name','user'],logger,callback)){
	    return;
	}
	if (!options.tilePoints) {
	    callback({});
	    return;
	}

	var cachedTiles = null;
	if (!options.bypassCache) {
	    var cachedInv = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'inventory_'+options.character.database.characterID + '_'+options.name);
	    options.user.logger.trace('Inventory Load Tiles (cached) from '+options.name);
	    if (cachedInv && cachedInv[options.name] && cachedInv[options.name].tiles) {
		cachedTiles = cachedInv[options.name].tiles;
	    }
	}

	var points = [];
	if  (options.tilePoints == 'all') {
	    //allow 'all' to go through
	    options.user.logger.trace('Inventory Load All Tiles');

	} else {
	    options.tilePoints.each(function(point){
		if (cachedTiles && cachedTiles[point[0]] && cachedTiles[point[0]][point[1]]) {
		//ignore cached tiles since they should already exist in on the client
		} else {
		    points.push(RPG.getPointSQL(point));
		}
	    });
	    if (points.length > 0) {
		if (points.length == 1) {
		    //for some reason using 'in' does not work with a single point. so double up the point
		    points[1] = points[0];
		}
	    } else {
		options.user.logger.trace('Inventory Load Tiles. No points specified for ' + options.name);
		callback({});
		return;
	    }
	}
	var sql = '';
	var args = [];

	sql = 'SELECT X(point) as x, Y(point) as y, tiles '+
	'FROM inventorytiles it, inventory i ' +
	'WHERE i.name = ? '+
	'AND i.characterID = ? '+
	'AND it.inventoryID = i.inventoryID '+
	(options.tilePoints=='all'?'':'AND point in (' + points.join(',')+') ') +
	'ORDER BY point ASC';

	args = [
	options.name,
	options.character.database.characterID
	];

	RPG.Mysql.query(sql,args,
	    function(err,iResults) {
		if (err) {
		    options.user.logger.error('Inventory Load Tiles error: name: '+options.name+ ' error: '+ JSON.encode(err));
		    callback({
			error: err
		    });
		    return;
		} else if (iResults && iResults[0]) {

		    var tiles = {};
		    var tCache = [];
		    iResults.each(function(iResult){
			if (!tiles[iResult['x']]) {
			    tiles[iResult['x']] = {};
			}
			tiles[iResult['x']][iResult['y']] = JSON.decode(iResult['tiles'],true);
			tiles[iResult['x']][iResult['y']].each(function(tile){
			    tCache.push(JSON.encode(tile));//push this tilePath for cache lookup
			});
		    });
		    var inventory = {};
		    inventory[options.name] = {
			tiles : tiles
		    };
		    if (!options.bypassCache) {
			require('../Cache.njs').Cache.merge(options.user.options.userID,'inventory_'+options.character.database.characterID+'_'+options.name,Object.clone(inventory));
			options.user.logger.trace('Inventory Loaded Tiles Cached: name:'+options.name + ' count: '+iResults.length);
		    } else {
			options.user.logger.trace('Inventory Loaded Tiles Non-cached: name:'+options.name + ' count: '+iResults.length);
		    }

		    options.paths = tCache.unique();
		    RPG.Inventory.loadCache(options,function(cache) {
			if (cache.error) {
			    callback(cache);
			    return;
			}

			inventory[options.name].cache = cache;
			callback(inventory);

			tiles = null;
			cache = null;
		    });
		} else {
		    options.user.logger.trace('Inventory Load Tiles warning: name: '+options.name+ ' error: No Tiles Found.');
		    callback({});
		}
	    }
	    );
    },
    /**
     * Insert the universes inventory iiles into the database,
     * required options :
     * user
     * character
     * inventory
     *
     * callback(options.universe || errors)
     */
    storeTiles : function(options,callback) {
	if (!RPG.Constraints.requiredOptions(options,['character','inventory','user'],logger,callback)){
	    return;
	}

	options.errors = options.errors || [];

	var remove = null;
	var insert = null;

	//go through all the inventory in the universe
	Object.each(options.inventory,function(inv,name,source){

	    //get this inventory database options
	    var db = Object.getFromPath(inv,'options.database');
	    if (db && db.id) {
		var del = [];

		//remove tiles specified in db.tileDelete (array of points)
		if (db && db.tileDelete) {
		    db.tileDelete.each(function(point){
			if (!point || typeOf(point) != 'string') return;
			del.push(RPG.getPointSQL(point.split(',')));
		    });

		    if (del.length > 0) {
			if (del.length == 0) {
			    del[1] = del[0];
			}
			if (!remove) remove = RPG.Mysql.createQueue();
			//perform any deletes
			remove.queue('DELETE FROM inventorytiles ' +
			    'WHERE inventoryID = ? ' +
			    'AND point in ('+del.join(',')+') '+
			    'AND inventoryID in (SELECT inventoryID FROM inventory WHERE characterID = ?) ',
			    [
			    db.id,
			    options.character.database.characterID
			    ],
			    function(err,info) {
				if (err) {
				    options.user.logger.error('Inventory Store Tiles - Delete Specific - name: '+name+ ' error: '+ JSON.encode(err));
				    options.errors.push(err);
				} else {
				    if (info.affectedRows) {
					options.user.logger.trace('Inventory Store Tiles - Deleted '+info.affectedRows+' Specific from '+name);
				    } else {
					options.user.logger.trace('Inventory Store Tiles - Deleted 0 Specific from '+name);
				    }
				}
			    }
			    );
		    }
		}
	    }
	    //For each row of tiles remove existing ones from the database
	    Object.each(inv.tiles,function(col,rowNum,source) {
		del = [];
		rowNum = Number.from(rowNum);
		Object.each(col, function(tiles,colNum) {
		    colNum = Number.from(colNum);
		    del.push(RPG.getPointSQL([rowNum,colNum]));
		});
		if (del.length > 0) {
		    if (del.length==1) {
			del[1] = del[0];
		    }
		    if (!remove) remove = RPG.Mysql.createQueue();
		    //remove all the points specified in this column
		    remove.queue('DELETE FROM inventorytiles ' +
			'WHERE inventoryID = ? ' +
			'AND point in ('+del.join(',')+') '+
			'AND inventoryID in (SELECT inventoryID FROM inventory WHERE characterID = ?)',
			[
			db.id,
			options.character.database.characterID
			],
			function(err,info) {
			    if (err) {
				options.user.logger.error('Inventory Store Tiles - Delete Incoming name: '+name+ ' error: '+ JSON.encode(err));
				options.errors.push(err);
			    } else {
				if (info.affectedRows) {
				    options.user.logger.trace('Inventory Store Tiles - Deleted '+info.affectedRows+' Incoming from '+name);
				} else {
				    options.user.logger.warn('Inventory Store Tiles - Deleted 0 Incoming from '+name);
				}
			    }
			});
		}
		if (!insert) insert = RPG.Mysql.createQueue();
		//insert incoming tiles:
		var sql = 'INSERT INTO inventorytiles (inventoryID,point,tiles) VALUES ';
		var inserts = [];
		var arr = [];
		Object.each(col, function(tiles,colNum) {
		    if (tiles && tiles != 'null' && tiles.length > 0) {
			colNum = Number.from(colNum);
			inserts.push('(?,GeomFromText(\'POINT('+rowNum+' '+colNum+')\'),?)');
			arr.push(db.id,JSON.encode(tiles));

		    }
		});
		if (arr && arr.length > 0) {
		    insert.queue(sql + inserts.join(','),arr,
			function(err,info) {
			    if (err) {
				options.user.logger.error('Inventory Store Tiles - Insert into name: '+name+ ' error: '+ JSON.encode(err));
				options.errors.push(err);
			    } else {
				if (info.insertId) {
				    options.user.logger.trace('Inventory Store Tiles - Inserted ' + inserts.length + ' into ' +name );
				} else {
				    options.user.logger.error('Inventory Store Tiles - Inserted 0 into '+name);
				}
			    }
			});
		}
	    });

	});
	//now that everything is all queued up:
	//options.user.logger.trace('Inventory Store Tiles - Starting Store Queue: ' + Object.keys(options.inventory));
	RPG.Mysql.executeQueues([remove,insert],true,function(){
	    //options.user.logger.trace('Inventory Store Tiles - Finished Store Queue: ' + Object.keys(options.inventory));
	    callback();
	});
    },
    /**
     * required options:
     *	    user
     *	    name : name of inventory
     *	    paths : json encoded paths
     *	    character
     *
     * optional:
     *	    bypassCache
     */
    loadCache : function(options,callback) {
	if (!RPG.Constraints.requiredOptions(options,['user','name','character'],logger,callback)){
	    return;
	}

	if (!options.paths) {
	    callback({});
	    return;
	}

	var cachedTileCache = null;
	if (!options.bypassCache) {
	    var cachedInv = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'inventory_'+options.character.database.characterID+'_'+options.name);
	    options.user.logger.trace('Inventory Cache Load "'+options.name+'" (cached)');
	    if (cachedInv && cachedInv[options.name]) {
		cachedTileCache = cachedInv[options.name].cache;
	    }
	}

	var paths = [];
	var pathSql = [];
	options.paths.each(function(path,index) {
	    if (cachedTileCache && Object.getFromPath(cachedTileCache,JSON.decode(path,true))) {
	    //ignore already cached paths
	    } else {
		pathSql.push("?");
		paths.push(path);
	    }
	});
	Object.erase(options,'paths');

	if (paths.length > 0) {
	    if (paths.length == 1) {
		//for some reason using 'in' does not work with a single entry. so double up
		pathSql.push("?");
		paths[1] = paths[0];
	    }
	} else {
	    options.user.logger.trace('Inventory Load Cache - No paths specified for: '+options.name);
	    callback({});
	    return;
	}
	var sql = 'SELECT inventoryCacheID, i.inventoryID, path, ic.options, i.name '+
	'FROM inventorycache ic, inventory i ' +
	'WHERE ic.inventoryID = i.inventoryID '+
	'AND i.name = ? ' +
	'AND i.characterID = ? ' +
	'AND path in ('+pathSql.join(',')+') ' +
	'ORDER BY folderName ASC';
	var arr = [
	options.name,
	options.character.database.characterID,
	].append(paths)

	RPG.Mysql.query(sql,arr,
	    function(err,iResults) {
		if (err) {
		    options.user.logger.error('Inventory Load Cache - name: '+options.name+ ' error: '+ JSON.encode(err));
		    callback({
			error : err
		    });
		} else if (iResults && iResults[0]) {
		    var cache = RPG.expandResultsCache(iResults,'inventoryCacheID');

		    if (!options.bypassCache) {
			var cachedUni = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'inventory_'+options.character.database.characterID+'_'+options.name);
			if (!cachedUni[iResults[0]['name']]) cachedUni[iResults[0]['name']] = {};
			Object.merge(cachedUni[iResults[0]['name']],{
			    cache : cache
			});
			options.user.logger.trace('Inventory Load Tiles (cached) - Loaded: '+iResults.length+' from  '+options.name);
		    } else {
			options.user.logger.trace('Inventory Load Tiles (non-cached) - Loaded: '+iResults.length+' from  '+options.name);
		    }
		    callback(cache);
		} else {
		    options.user.logger.trace('Inventory Load Tiles - None Loaded from  '+options.name);
		    callback({});
		}
	    });

    },
    /**
     * required options:
     *	    user
     *	    character
     *	    inventory
     *
     * optional:
     *	    bypassCache
     */
    storeCache : function(options,callback) {
	if (!RPG.Constraints.requiredOptions(options,['user','inventory','character'],logger,callback)){
	    return;
	}

	options.errors = options.errors || [];

	var remove = null;
	var insert = null;
	var update = null;

	Object.each(options.inventory,function(inv,name,source){
	    var flat = RPG.flattenCache(inv.cache);
	    Object.each(flat,function(tileOpts,path,source){
		var db = tileOpts.database;
		Object.erase(tileOpts,'database');
		if (db && db.id) {

		    if (!Number.from(db.id)) {
			options.errors.push('The Inventory Cache ID for "'+ path+'" must be numeric.');
			db = null;
			return;
		    }

		    if (db.deleted) {
			if (!remove) remove = RPG.Mysql.createQueue();
			remove.queue('DELETE FROM inventorycache ' +
			    'WHERE inventoryID = ? ' +
			    'AND inventoryCacheID = ? ',
			    Array.clone([inv.options.database.id,db.id]),
			    function(err,results) {
				if (err) {
				    options.user.logger.error('Inventory Store Cache - Delete error. path:'+path+' name: '+name+ ' error: '+ JSON.encode(err));
				    options.errors.push(err);
				} else {
				    if (results.affectedRows) {
					options.user.logger.trace('Inventory Store Cache - Deleted path:'+path+' name: '+name);
					var pathName = (path = JSON.decode(path)).pop();
					Object.erase(Object.getFromPath(inv.cache,path),pathName);
				    } else {
					options.user.logger.error('Inventory Store Cache - Delete error. path:'+path+' name: '+name+ ' error: 0 Affected Rows');
					options.errors.push('Could not delete Cache item "'+ path+'" :(');
				    }

				}
			    }
			    );
			Object.erase(source,path);
			return;

		    } else if (db.renamed) {
			var oldPath = Array.clone(JSON.decode(path,true))
			oldPath[oldPath.length-1] = db.renamed;
			if (!update) update = RPG.Mysql.createQueue();
			update.queue('UPDATE inventoryTiles ' +
			    "SET tiles = PREG_REPLACE('/\\?/',?,tiles) " +
			    'WHERE inventoryID = ? ',
			    [
			    JSON.encode(oldPath),
			    path,
			    inv.options.database.id
			    ],
			    function(err,results) {
				if (err) {
				    options.user.logger.error('Inventory Store Cache - Update Tiles error. path:'+path+' name: '+name+ ' error: '+ JSON.encode(err));
				    options.errors.push(err);
				} else {
				    if (results.affectedRows) {
					options.user.logger.trace('Inventory Store Cache - Updated Tiles path:'+path+' name: '+name);
				    } else {
					options.user.logger.error('Inventory Store Cache - Update Tiles error. path:'+path+' name: '+name+ ' error: 0 Affected Rows');
					options.errors.push('Could not update Cache item "'+ path+'" :(');
				    }
				}
			    });
		    }

		    if (!update) update = RPG.Mysql.createQueue();
		    update.queue('UPDATE inventorycache ' +
			'SET folderName = ?,' +
			'path = ?,' +
			'tileName = ?,' +
			'options = ? ' +
			'WHERE inventoryID = ? ' +
			'AND inventoryCacheID = ? ',
			[
			tileOpts.property.folderName,
			path,
			tileOpts.property.tileName,
			JSON.encode(tileOpts),
			inv.options.database.id,
			db.id
			],
			function(err,results) {
			    if (err) {
				options.user.logger.error('Inventory Store Cache - Update error. path:'+path+' name: '+name+ ' error: '+ JSON.encode(err));
				options.errors.push(err);
			    } else {
				if (results.affectedRows) {
				    options.user.logger.trace('Inventory Store Cache - Updated path:'+path+' name: '+name);
				    tileOpts.database = db;
				} else {
				    options.user.logger.error('Inventory Store Cache - Update error. path:'+path+' name: '+name+ ' error: 0 Affected Rows');
				    options.errors.push('Could not update Cache item "'+path+'" :(');
				}
			    }
			});
		    Object.erase(source,path);
		} else {
		    if (!insert) insert = RPG.Mysql.createQueue();
		    insert.queue('INSERT INTO inventorycache ' +
			'SET inventoryID = ?,' +
			'path = ?,' +
			'folderName = ?,' +
			'tileName = ?,' +
			'options = ?',
			[
			inv.options.database.id,
			path,
			tileOpts.property.folderName,
			tileOpts.property.tileName,
			JSON.encode(tileOpts)
			],
			function(err,results) {
			    if (err) {
				options.user.logger.error('Inventory Store Cache - Insert error. path:'+path+' into: '+name+ ' error: '+ JSON.encode(err));
				options.errors.push(err);
			    } else {
				if (results.insertId) {
				    tileOpts.database = {
					id : results.insertId
				    };
				    options.user.logger.trace('Inventory Store Cache - Inserted path:'+path+' id: '+results.insertId+' into: '+name);
				} else {
				    options.user.logger.error('Inventory Store Cache - Insert error. path:'+path+' into: '+name+ ' error: 0 Inserted Rows');
				    options.errors.push('Failed to get newly inserted Cache ID :( '+JSON.encode(options.tile));
				}
			    }
			});
		    Object.erase(source,path);
		}
	    });
	});

	//now that everything is all queued up:
	//options.user.logger.trace('Inventory Store Cache - Starting Store Queue: ' + Object.keys(options.inventory));
	RPG.Mysql.executeQueues([remove,update,insert],true,function(){
	    //options.user.logger.trace('Inventory Store Cache - Starting Store Queue: ' + Object.keys(options.inventory));
	    callback();
	});
    }
}))();