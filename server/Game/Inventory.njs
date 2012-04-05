var RPG = module.exports = {};
Object.merge(RPG,require('../../common/Game/Tiles/Utilities.js'));


RPG.Inventory = new (RPG.InventoryClass = new Class({
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

	if (!options.bypassCache) {
	    var inventory = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'inventory_'+options.character.database.characterID + '_'+options.name);
	    if (inventory) {
		//RPG.Log('cached','Inventory: '+JSON.encode(inventory));
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
		    callback({
			error : err
		    });
		} else if (iResults && iResults[0]) {
		    var iResult = iResults[0];
		    //RPG.Log('database hit','Loaded Inventory: '+ (iResult['name']));
		    var inventory = {};

		    inventory[iResult['name']] = {
			options : JSON.decode(iResult['options'],true) || {}
		    };
		    inventory[iResult['name']].options.database = {
			inventoryID : iResult['inventoryID']
		    };
		    options.tilePoints = 'all';

		    if (!options.bypassCache) {
			require('../Cache.njs').Cache.merge(options.user.options.userID,'inventory_'+options.character.database.characterID + '_'+options.name,inventory);
			//RPG.Log('cached','Inventory Merge Retrieve: '+JSON.encode(require('../Cache.njs').Cache.retrieve(options.user.options.userID,'inventory_'+options.character.database.characterID + '_'+options.name)));
		    }
		    RPG.Inventory.loadTiles(options,function(tileInv){
			if (tileInv.error) {
			    callback(tileInv);
			    return;
			}
			callback(Object.merge(inventory,tileInv));
		    });

		} else {
		    callback({});
		}
	    });
    },
    /**
     * Checks for Duplicate Inventory Name
     * required options:
     * name
     *
     * optional options:
     * characterID //ignore for updates
     *
     * return
     * callback(dupeName || null if ok)
     */
    checkDupeInventoryName : function(options,callback) {

	RPG.Mysql.query(
	    'SELECT name ' +
	    'FROM inventory ' +
	    'WHERE name = ? ' +
	    'AND characterID <> ? ',
	    [
	    options.name,
	    options.characterID
	    ],
	    function(err,iResults) {
		if (err) {
		    callback({
			error : err
		    });
		} else {
		    if (iResults && iResults[0] && iResults[0]['name']) {
			callback({
			    error : 'You have a Inventory named <b>"'+iResults[0]['name']+'"</b> already.<br>Please choose another name.'
			});
		    } else {
			callback();
		    }
		}
	    }
	    );
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
	options.errors = options.errors || [];

	var remove = null;
	var update = null;
	var insert = null;

	//go through all the inventory in the universe
	Object.each(options.inventory,function(inv,name,source){
	    //get this inventory database options
	    var db = Object.getFromPath(inv,'options.database');
	    if (db && db.inventoryID) {

		//remove tiles specified in db.tileDelete (array of points)
		if (db && db.deleted) {
		    if (!remove) remove = RPG.Mysql.createQueue();
		    //perform any deletes
		    remove.queue('DELETE FROM inventory ' +
			'WHERE characterID = ? ' +
			'AND inventoryID = ? ',
			[
			options.character.database.characterID,
			db.inventoryID
			],
			function(err,info){
			    if (err) {
				options.errors.push(err);
			    } else {
				//RPG.Log('database delete','Inventory '+ db.inventoryID);
				if (info.affectedRows) {
				    Object.erase(options.inventory,name);
				} else {
				    options.errors.push('Could not delete Inventory ' + inv.options.property.name);
				}
			    }
			});
		} else if (db.inventoryID) {
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
			db.inventoryID
			],
			function(err,info){
			    if (err) {
				options.errors.push(err);
			    } else {
				//RPG.Log('database delete','Inventory '+ db.inventoryID);
				if (info.affectedRows) {
				    inv.options.database = db;
				} else {
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
			    options.errors.push(err);
			} else {

			    if (info && info.insertId) {
				inv.options.database = {
				    inventoryID : info.insertId
				}
				//RPG.Log('database Insert','Inventory '+ info.insertId+ ' ' + inv.options.property.name);
			    } else {
				options.errors.push('Could not insert inventory item ' + inv.options.property.name);
			    }
			}
		    });
	    }
	});

	//now that everything is all queued up:
	RPG.Mysql.executeQueues([remove,update,insert],true,function(){
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
		    callback(options.inventory);
		});

	    });
	});

    },
    /**
     * List available inventory
     *	    character
     *
     * returns:
     * callback(inventory || error)
     */
    listInventory : function(options,callback) {
	RPG.Mysql.query(
	    'SELECT inventoryID, i.name, options, '+
	    '   (SELECT count(1) FROM inventorytiles WHERE inventoryID = ts.inventoryID) as totalArea, ' +
	    '   (SELECT count(1) FROM inventorycache WHERE inventoryID = ts.inventoryID) as totalObjects ' +
	    'FROM inventory i ' +
	    'WHERE i.characterID = ? ' +
	    'ORDER BY i.name ASC',
	    [
	    options.character.database.characterID
	    ],
	    function(err,results) {
		if (err) {
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
					inventoryID : result['inventoryID'],
					userName : result['userName'],
					totalArea : result['totalArea'],
					totalObjects : result['totalObjects']
				    }
				},
				JSON.decode(result['options'],true)
				    )
			    };
			});

			callback(inventory);

		    } else {
			callback({
			    error : 'No Inventory found.'
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
	if (!options.tilePoints) {
	    callback({});
	    return;
	}
	var cachedTiles = null;
	if (!options.bypassCache) {
	    var cachedInv = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'inventory_'+options.character.database.characterID + '_'+options.name);
	    if (cachedInv && cachedInv[options.name]) {
		cachedTiles = cachedInv[options.name].tiles;
	    }
	}

	var points = [];
	if  (options.tilePoints == 'all') {
	//allow 'all' to go through
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
		//RPG.Log('cache','Inventory LoadTiles: none to load.');
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
		    //RPG.Log('database hit','Inventory LoadTiles: Loaded tiles from "'+options.name+"");

		    var inventory = {};
		    inventory[options.name] = {
			tiles : tiles
		    };
		    //RPG.Log('inventory tiles',inventory);
		    if (!options.bypassCache) {
			require('../Cache.njs').Cache.merge(options.user.options.userID,'inventory_'+options.character.database.characterID+'_'+options.name,Object.clone(inventory));
			//RPG.Log('cached','Inventory Tiles Merge Retrieve: '+JSON.encode(require('../Cache.njs').Cache.retrieve(options.user.options.userID,'inventory_'+options.character.database.characterID + '_'+options.name)));
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
		    //RPG.Log('database hit','No Inventory Tiles Found.');
		    callback({});
		}
	    }
	    );
    },
    /**
     * Insert the universes inventory iiles into the database,
     * required options :
     * user
     * universe
     *
     * callback(options.universe || errors)
     */
    storeTiles : function(options,callback) {
	options.errors = options.errors || [];

	var remove = null;
	var insert = null;

	//go through all the inventory in the universe
	Object.each(options.inventory,function(inv,name,source){

	    //get this inventory database options
	    var db = Object.getFromPath(inv,'options.database');
	    if (db && db.inventoryID) {
		var del = [];

		//remove tiles specified in db.tileDelete (array of points)
		if (db && db.tileDelete) {
		    //RPG.Log('database delete','Tile Delete');
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
			    'AND inventoryID in (SELECT inventoryID FROM inventory WHERE characterID = ?)',
			    [
			    db.inventoryID,
			    options.character.database.characterID
			    ],
			    function(err,info) {
				if (err) {
				    options.errors.push(err);
				} else {
				    //RPG.Log('database delete','Inventory Tiles'+ db.tileDelete.length);
				//if (!info.affectedRows) {
				//options.errors.push('Could not delete Inventory tiles ' + db.tileDelete.length);
				//}
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
			db.inventoryID,
			options.character.database.characterID
			],
			function(err,info) {
			    if (err) {
				options.errors.push(err);
			    } else {
				//RPG.Log('database deleted','Inventory Tiles '+ info.affectedRows);
			    }
			});
		}
		if (!insert) insert = RPG.Mysql.createQueue();
		//insert incoming tiles:
		var sql = 'INSERT INTO inventorytiles (inventoryID,point,tiles) VALUES ';
		var arr = [];
		Object.each(col, function(tiles,colNum) {
		    if (tiles && tiles != 'null') {
			colNum = Number.from(colNum);
			sql += '(?,GeomFromText(\'POINT('+rowNum+' '+colNum+')\'),?),'
			arr.push(db.inventoryID,JSON.encode(tiles));
		    }
		});
		sql = sql.substr(0,sql.length-1);
		if (arr && arr.length > 1) {
		    insert.queue(sql,arr,
			function(err,info) {
			    if (err) {
				options.errors.push(err);
			    }
			    //RPG.Log('insert',name +  ' Inventory Tiles Row: '+rowNum+' Cols: '+ Object.keys(col).length);
			});
		}
	    });

	});
	//now that everything is all queued up:
	RPG.Mysql.executeQueues([remove,insert],true,callback);
    },
    /**
     * required options:
     *	    user
     *	    name : name of inventory
     *	    paths : json encoded paths
     *
     * optional:
     *	    bypassCache
     */
    loadCache : function(options,callback) {
	if (!options.paths) {
	    callback({});
	    return;
	}

	var cachedTileCache = null;
	if (!options.bypassCache) {
	    var cachedInv = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'inventory_'+options.character.database.characterID+'_'+options.name);
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
	    //RPG.Log('database hit','Inventory loadCache: Loading ' + paths.length + ' tile cache objects.');
	} else {
	    //RPG.Log('no tiles',''+options.paths);
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
		//RPG.Log('database hit','Inventory loadCache: Loading ' + iResults.length + ' tile cache objects.' + sql + ' ' + arr);
		if (err) {
		    //RPG.Log('error',err);
		    callback({
			error : err
		    });
		} else if (iResults && iResults[0]) {
		    var cache = RPG.expandResultsCache(iResults,'inventoryCacheID');
		    //RPG.Log('inventory cache',cache);
		    if (!options.bypassCache) {
			var cachedUni = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'inventory_'+options.character.database.characterID+'_'+options.name);
			if (!cachedUni[iResults[0]['name']]) cachedUni[iResults[0]['name']] = {};
			Object.merge(cachedUni[iResults[0]['name']],{
			    cache : cache
			});
			//RPG.Log('cached','Inventory Cache Merge Retrieve: '+JSON.encode(require('../Cache.njs').Cache.retrieve(options.user.options.userID,'inventory_'+options.character.database.characterID + '_'+options.name)));
		    }

		    callback(cache);
		} else {
		    callback({});
		}
	    });

    },
    /**
     * required options:
     *	    user
     *	    character
     *	    universe
     *
     * optional:
     *	    bypassCache
     */
    storeCache : function(options,callback) {
	options.errors = options.errors || [];

	var remove = null;
	var insert = null;
	var update = null;

	Object.each(options.inventory,function(inv,name,source){
	    var flat = RPG.flattenCache(inv.cache);
	    Object.each(flat,function(tileOpts,path,source){
		var db = tileOpts.database;
		Object.erase(tileOpts,'database');
		if (db && db.inventoryCacheID) {

		    if (!Number.from(db.inventoryCacheID)) {
			options.errors.push('The Inventory Cache ID for "'+ path+'" must be numeric.');
			db = null;
			return;
		    }

		    if (db.deleted) {
			if (!remove) remove = RPG.Mysql.createQueue();
			remove.queue('DELETE FROM inventorycache ' +
			    'WHERE inventoryID = ? ' +
			    'AND inventoryCacheID = ? ',
			    Array.clone([inv.options.database.inventoryID,db.inventoryCacheID]),
			    function(err,results) {
				if (err) {
				    options.errors.push(err);
				} else {
				    //RPG.Log('database delete','Inventory cache '+ path);
				    if (results.affectedRows) {
					var pathName = (path = JSON.decode(path)).pop();
					Object.erase(Object.getFromPath(inv.cache,path),pathName);
				    } else {
					//RPG.Log('0 deleted','Inventory cache "'+ path);
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
			    inv.options.database.inventoryID
			    ],
			    function(err,results) {
				if (err) {
				    options.errors.push(err);
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
			inv.options.database.inventoryID,
			db.inventoryCacheID
			],
			function(err,results) {
			    if (err) {
				options.errors.push(err);
			    } else {
				//RPG.Log('database update','Inventory cache "'+ path +'" id:'+(JSON.encode(db))+'');
				if (results.affectedRows) {
				    tileOpts.database = db;
				} else {
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
			inv.options.database.inventoryID,
			path,
			tileOpts.property.folderName,
			tileOpts.property.tileName,
			JSON.encode(tileOpts)
			],
			function(err,results) {
			    if (err) {
				options.errors.push(err);
			    } else {
				//RPG.Log('database insert','Inventory cache "'+ path  +'" id:'+(results && results.insertId)+'');
				if (results.insertId) {
				    tileOpts.database = {
					inventoryCacheID : results.insertId
				    };
				} else {
				    options.errors.push('Failed to get newly inserted Cache ID :( '+JSON.encode(options.tile));
				}
			    }
			});
		    Object.erase(source,path);
		}
	    });
	});
	//now that everything is all queued up:
	RPG.Mysql.executeQueues([remove,update,insert],true,callback);
    }
}))();