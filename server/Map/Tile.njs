var RPG = module.exports = {};
Object.merge(RPG,
    require('../Character/Character.njs'),
    require('../../common/Map/Tiles/Utilities.js'),
    require('../../common/Map/Generators/Utilities.js')
    );

RPG.Tile = new (RPG.TileClass = new Class({
    Implements : [Events,Options],
    options : {},
    initialize : function(options) {
	this.setOptions(options)
    },

    /**
     * required options:
     *
     * user
     * character || mapID || mapName
     * tilePoints = array of points [point,point,point] (point=[x,y])
     *
     * optional options :
     * mapOrTileset
     * @todo includeCached
     *
     * Returns:
     * callback = returns an object which is mergable with a universe object.
     * return = {
     *	    maps : {
     *	     [mapName] : {
     *		    cache : {}
     *		    tiles : {}
     *		}
     *	    }
     * }
     */
    load : function(options,callback) {
	options.mapOrTileset = options.mapOrTileset || 'map';
	var universe = {};
	var cachedUni = {};
	var cachedTiles = null;

	if (options.character) {
	    options.mapID = options.character.location.mapID;
	    cachedUni = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'universe_'+options.character.location.universeID);
	    if (cachedUni && cachedUni.maps && cachedUni.maps[options.character.location.mapName]) {
		cachedTiles = cachedUni.maps[options.character.location.mapName].tiles;
	    }
	}

	var pointSql = '';
	if  (options.tilePoints == 'all') {
	//allow 'all' to go through
	} else {
	    var cnt = 0;
	    var points = '';
	    options.tilePoints.each(function(point){
		if (cachedTiles && cachedTiles[point[0]] && cachedTiles[point[0]][point[1]]) {


		//ignore cached tiles since they should already exist in on the client
		} else {
		    points += RPG.getPointSQL(point);
		    points += ',';
		    cnt++;
		}
	    });

	    if (points.length > 0) {
		if (cnt == 1) {
		    //for some reason using 'in' does not work with a single point. so double up the point
		    points += points;
		}
		pointSql = 'AND point in (';
		pointSql += points.substr(0,points.length-1);
		pointSql += ') ';
	    } else {
		//RPG.Log('cache','Tiles: none to load.');
		callback({});
		return;
	    }
	}
	var sql = '';
	var args = [];
	if (options.mapOrTileset == 'map') {
	    sql = 'SELECT X(point) as x, Y(point) as y, tiles, m.mapName '+
	    'FROM maptiles mt, maps m, universes un ' +
	    'WHERE mt.mapID = m.mapID '+
	    'AND m.map'+(options.mapID?'ID':'Name')+' = ? ' +
	    'AND m.universeID = un.universeID '+
	    'AND un.userID = ? '+
	    pointSql +
	    'ORDER BY point ASC';
	    args = [
	    options['map'+(options.mapID?'ID':'Name')],
	    options.user.options.userID
	    ];
	} else {
	    sql = 'SELECT X(point) as x, Y(point) as y, tiles, t.name '+
	    'FROM tilesettiles tt, tilesets t ' +
	    'WHERE t.tilesetID = ? '+
	    'AND t.userID = ? '+
	    'AND tt.tilesetID = t.tilesetID '+
	    pointSql +
	    'ORDER BY point ASC';
	    args = [
	    options.tilesetID,
	    options.user.options.userID
	    ];
	}
	require('../Database/mysql.njs').mysql.query(sql,args,
	    function(err,mtResults) {
		Object.erase(options,'tilePoints');
		if (err) {
		    RPG.Log('error',err);
		    callback({
			error: err
		    });
		    return;
		} else if (mtResults && mtResults[0]) {
		    if (!universe.maps) universe.maps = {};

		    var tiles = {};
		    var tCache = [];
		    var mapName = null;
		    mtResults.each(function(mtResult){
			mapName = mtResult['mapName'] || mtResult['name'];

			if (!tiles[mtResult['x']]) {
			    tiles[mtResult['x']] = {};
			}
			tiles[mtResult['x']][mtResult['y']] = JSON.decode(mtResult['tiles'],true);
			tiles[mtResult['x']][mtResult['y']].each(function(tile){
			    tCache.push(JSON.encode(tile));
			});
		    });
		    //RPG.Log('database hit','Tiles: Loaded ' + cnt + ' tiles from "'+mapName+"");
		    options.paths = tCache.unique();
		    RPG.Tile.loadTilesCache(options,function(cache) {
			if (cache.error) {
			    callback(cache);
			    return;
			}

			universe.maps[mapName] = {
			    cache : cache,
			    tiles : tiles
			};
			callback(universe);

			tiles = null;
			cache = null;
			universe = null;
		    });
		} else {
		    //RPG.Log('database hit','No Tiles Found.');
		    callback({});
		}
	    }
	    );
    },

    /**
     * Required options:
     * user
     * character || mapID || mapName
     * paths = array of json encoded paths ['["p1","p2"]','["p3","p4"]']
     *
     * Returns:
     * callback = map cache object (mergable with a universe Map object
     * eg: {terrain : { solid : { ... } } }
     *
     */
    loadTilesCache : function(options,callback) {
	options.mapOrTileset = options.mapOrTileset || 'map';
	var cachedTileCache = null;

	if (options.character) {
	    options.mapID = options.character.location.mapID;
	    if (!options.bypassCache) {
		var cachedUni = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'universe_'+options.character.location.universeID) || {};
		if (cachedUni.maps && cachedUni.maps[options.character.location.mapName]) {
		    cachedTileCache = cachedUni.maps[options.character.location.mapName].cache;
		}
	    }
	}
	var paths = [];
	var pathSql = '(';
	options.paths.each(function(path,index) {
	    if (cachedTileCache && Object.getFromPath(cachedTileCache,JSON.decode(path,true))) {
	    //ignore already cached paths
	    } else {
		pathSql += "?,";
		paths.push(path);
	    }
	});

	if (paths.length > 0) {
	    if (paths.length == 1) {
		//for some reason using 'in' does not work with a single entry. so double up
		pathSql += '?,';
		paths.push(paths[0]);
	    }
	    pathSql = pathSql.substr(0,pathSql.length-1);
	    pathSql += ')';
	//RPG.Log('database hit','TileCache: Loading ' + paths.length + ' tile cache objects.');
	} else {
	    //RPG.Log('no tiles',''+options.paths);
	    callback({});
	    return;
	}
	var sql = '';
	var args = [];
	if (options.mapOrTileset == 'map') {
	    sql = 'SELECT mapCacheID, mc.mapID, path, mc.options '+
	    'FROM mapscache mc, maps m, universes un ' +
	    'WHERE mc.mapID = m.mapID '+
	    'AND m.map'+(options.mapID?'ID':'Name')+' = ? ' +
	    'AND m.universeID = un.universeID ' +
	    'AND un.userID = ? ' +
	    'AND path in '+pathSql+' ' +
	    'ORDER BY folderName ASC';
	    args = [
	    options['map'+(options.mapID?'ID':'Name')],
	    options.user.options.userID,
	    ].append(paths)
	} else {
	    sql = 'SELECT tilesetCacheID, t.tilesetID, path, tc.options '+
	    'FROM tilesetscache tc, tilesets t ' +
	    'WHERE tc.tilesetID = t.tilesetID '+
	    'AND t.tilesetID = ? ' +
	    'AND t.userID = ? ' +
	    'AND path in '+pathSql+' ' +
	    'ORDER BY folderName ASC';
	    args = [
	    options.tilesetID,
	    options.user.options.userID,
	    ].append(paths)
	}

	require('../Database/mysql.njs').mysql.query(sql,args,
	    function(err,mcResults) {
		Object.erase(options,'paths');
		Object.erase(options,'tilePoints');
		if (err) {
		    RPG.Log('error',err);
		    callback({
			error : err
		    });
		} else if (mcResults && mcResults[0]) {
		    callback(RPG.Tile.expandResultsCache(mcResults,options.mapOrTileset));
		} else {
		    callback({});
		}
	    });
    },


    /**
     * Insert the universes maps or tilesets tiles into the database,
     * required options :
     * user
     * universe
     *
     * optional options:
     * mapOrTileset (default 'map' if not provided)
     *
     * internally used for recursion: (removed from options object upon completion)
     * rowNum
     * col
     * tilesChain
     * mapTilesDeleted
     * existingTilesDeleted
     * errors array
     * map
     *
     * callback(options.universe || errors)
     */

    storeTiles : function(options,callback) {
	options.mapOrTileset = options.mapOrTileset || 'map'
	options.errors = options.errors || [];
	var sql = '';
	var args = '';
	var db = options.map && options.map.options.database;
	if (db && db[options.mapOrTileset+'ID']  && !options.existingTilesDeleted) {

	    var del = '';
	    /**
	     * Once only we will go through the tileDelete from the options.map.database and remove the requested tiles.
	     * Once that is complete, this function will be called again to perform the next stuff
	     */
	    if (db && db.tileDelete && !options.mapTilesDeleted) {
		//RPG.Log('database delete','Tile Delete');
		del = '(';

		db.tileDelete.each(function(point){
		    if (!point || typeOf(point) != 'string') return;
		    del += RPG.getPointSQL(point.split(',')) + ',';
		});
		if (del.length > 1) {
		    del = del.substr(0,del.length-1) + ')';
		    Object.erase(db,'tileDelete');//erasing this will make sure this code is not executed again for this map

		    //create the sql for either a map delete or a tileset delete
		    if (options.mapOrTileset == 'map') {
			sql = 'DELETE FROM maptiles ' +
			'WHERE mapID = ? ' +
			'AND point in '+del+' '+
			'AND mapID in (SELECT mapID FROM maps m, universes un WHERE m.universeID = un.universeID AND un.universeID = ? AND un.userID = ?)';
			args = [
			db[options.mapOrTileset+'ID'],
			options.universe.options.database.universeID,
			options.user.options.userID
			];
		    } else {
			sql = 'DELETE FROM tilesettiles ' +
			'WHERE tilesetID = ? ' +
			'AND point in '+del+' '+
			'AND tilesetID in (SELECT tilesetID FROM tilesets WHERE userID = ?)';
			args = [
			db[options.mapOrTileset+'ID'],
			options.user.options.userID
			];
		    }
		    require('../Database/mysql.njs').mysql.query(sql,args,
			function(err,info) {
			    if (err) {
				options.errors.push(err);
			    }
			    RPG.Tile.storeTiles(options,callback);
			    options.mapTilesDeleted = true;
			});
		} else {
		    RPG.Tile.storeTiles(options,callback);//exit the function and wait for db operation to complete.
		}
		return;
	    }

	    /**
	     * Existing Map, delete incoming tiles from database to be replaced by the new ones being sent in
	     * once the delete is complete, this function gets called again to do the insert
	     */
	    del = '(';
	    Object.each(options.col, function(tiles,colNum) {
		del += RPG.getPointSQL([options.rowNum,colNum]) + ','
	    });
	    if (del.length > 1) {
		del = del.substr(0,del.length-1) + ')';

		//create the sql for either a map delete or a tileset delete
		if (options.mapOrTileset == 'map') {
		    sql = 'DELETE FROM maptiles ' +
		    'WHERE mapID = ? ' +
		    'AND point in '+del+' '+
		    'AND mapID in (SELECT mapID FROM maps m, universes un WHERE m.universeID = un.universeID AND un.universeID = ? AND un.userID = ?)';
		    args = [
		    db[options.mapOrTileset+'ID'],
		    options.universe.options.database.universeID,
		    options.user.options.userID
		    ];
		} else {
		    sql = 'DELETE FROM tilesettiles ' +
		    'WHERE tilesetID = ? ' +
		    'AND point in '+del+' '+
		    'AND tilesetID in (SELECT tilesetID FROM tilesets WHERE userID = ?)';
		    args = [
		    db[options.mapOrTileset+'ID'],
		    options.user.options.userID
		    ];
		}
		require('../Database/mysql.njs').mysql.query(sql,args,
		    function(err,info) {
			if (err) {
			    options.errors.push(err);
			}
			options.existingTilesDeleted = true;//setting this ensures this code will not get executed again for this map
			RPG.Tile.storeTiles(options,callback);
		    });
	    } else {
		options.existingTilesDeleted = true;//setting this ensures this code will not get executed again for this map
		RPG.Tile.storeTiles(options,callback);
	    }
	    return;//exit the function and wait for db operation to complete. which then calls this function again to do inserts
	}

	/**
	 * If we have gotten to this point then both delete functions above has completed for the current map.
	 */

	if (!options.tilesChain) {
	    //RPG.Log('chain start','Tiles start');
	    options.tilesChain = new Chain();
	    Object.each(options.universe.maps,function(map,mapName){
		options.mapTilesDeleted = false;
		Object.each(map.tiles,function(col,rowNum){
		    options.tilesChain.chain(function(){
			options.existingTilesDeleted = false;
			options.map = map;
			options.col = col;
			options.rowNum = rowNum;
			RPG.Tile.storeTiles(options,callback)
		    });
		});
	    });
	    options.tilesChain.chain(function(){
		//RPG.Log('chain complete','Tiles complete');
		Object.erase(options,'map');
		Object.erase(options,'col');
		Object.erase(options,'rowNum');
		Object.erase(options,'mapTilesDeleted');
		Object.erase(options,'existingTilesDeleted');
		Object.erase(options,'tilesChain');
		var err = options.errors;
		Object.erase(options,'errors');
		if (err.length > 0) {
		    callback({
			error : err
		    });
		} else {
		    callback(options.universe);
		}
	    });
	    options.tilesChain.callChain();
	    return;
	}


	sql = 'INSERT INTO '+options.mapOrTileset+'tiles ('+options.mapOrTileset+'ID,point,tiles) VALUES ';
	args = [];
	Object.each(options.col, function(tiles,colNum) {
	    if (tiles && tiles != 'null') {
		sql += '(?,GeomFromText(\'POINT('+Number.from(options.rowNum) + ' ' + Number.from(colNum)+')\'),?),'
		args.push(db[options.mapOrTileset+'ID'],JSON.encode(tiles));
	    }
	});
	sql = sql.substr(0,sql.length-1);
	if (args && args.length < 1) options.tilesChain.callChain();

	require('../Database/mysql.njs').mysql.query(sql,args,
	    function(err,info) {
		if (err) {
		    RPG.Log('error',err);
		    options.errors.push(err);
		} else {
		    if (info.insertId) {
		    //RPG.Log('database insert','"'+ (options.map.options.property.mapName || 'tileset') + '" tile row '+options.rowNum+' inserted: '+Object.keys(options.col).length);
		    } else {
			//RPG.Log('error','no insert id..');
			options.errors.push('Failed to get newly inserted '+options.mapOrTileset+' Tiles :( ');
		    }
		}
		options.tilesChain && options.tilesChain.callChain();
	    }
	    );
    },

    expandResultsCache : function(results,tableId) {
	var cache = {};
	results.each(function(result){
	    var dbOpts = {
		database : {}
	    };
	    dbOpts.database[tableId+'CacheID'] = result[tableId+'CacheID'];
	    Object.pathToObject(cache,JSON.decode(result['path'],true)).child.options = Object.merge(JSON.decode(result['options'],true),dbOpts);
	});
	return cache;
    },

    storeAllCaches : function(options,callback) {
	var allChain = new Chain();
	Object.each(options.universe.maps,function(map,mapName){
	    allChain.chain(function(){
		options.map = map;
		RPG.Tile.storeCache(options,function(){
		    allChain.callChain();

		});
	    });
	});
	allChain.chain(function() {
	    callback(options.universe);
	});
	allChain.callChain();
    },

    storeCache : function(options,callback) {
	if (!options.tableId) options.tableId = options.mapOrTileset || 'map';

	var remove = [];
	var insert = [];
	var update = [];

	var flat = RPG.flattenCache(options.map.cache);

	switch (options.tableId) {
	    case  'inventory' :
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
			    remove.push({
				sql : 'DELETE FROM inventorycache ' +
				'WHERE characterID = ? ' +
				'AND inventoryCacheID = ? ' +
				'AND characterID in (SELECT characterID FROM characters WHERE userID = ?)',
				arr : Array.clone([options.character.database.characterID,db.inventoryCacheID,options.user.options.userID]),
				path : JSON.decode(path,true)
			    });
			    Object.erase(source,path);

			} else if (db.renamed) {
			//rename does nothing in invenory
			}

			update.push({
			    sql : 'UPDATE inventorycache ' +
			    'SET folderName = ?,' +
			    'path = ?,' +
			    'tileName = ?,' +
			    'options = ? ' +
			    'WHERE characterID = ? ' +
			    'AND inventoryCacheID = ? ' +
			    'AND characterID in (SELECT characterID FROM characters WHERE userID = ?)',
			    arr : Array.clone([
				tileOpts.property.folderName,
				path,
				tileOpts.property.tileName,
				JSON.encode(tileOpts),
				options.character.database.characterID,
				db.inventoryCacheID,
				options.user.options.userID
				]),
			    path : JSON.decode(path,true)
			});
			Object.erase(source,path);
		    } else {
			insert.push({
			    sql : 'INSERT INTO inventorycache ' +
			    'SET characterID = ?,' +
			    'path = ?,' +
			    'folderName = ?,' +
			    'tileName = ?,' +
			    'options = ?',
			    arr : Array.clone([
				options.character.database.characterID,
				path,
				tileOpts.property.folderName,
				tileOpts.property.tileName,
				JSON.encode(tileOpts)
				]),
			    path : JSON.decode(path,true)
			});
			Object.erase(source,path);
		    }
		});
		break;

	    case 'map' :
		Object.each(flat,function(tileOpts,path,source){
		    var db = tileOpts.database;
		    Object.erase(tileOpts,'database');
		    if (db && db.mapCacheID) {

			if (!Number.from(db.mapCacheID)) {
			    options.errors.push('The Map Cache ID for "'+path+'" must be numeric.');
			    db = null;
			    return;
			}

			if (db.deleted) {
			    remove.push({
				sql : 'DELETE FROM mapscache ' +
				'WHERE mapID = ? ' +
				'AND mapCacheID = ? ',
				arr : Array.clone([options.map.options.database.mapID,db.mapCacheID]),
				path : JSON.decode(path,true)
			    });
			    Object.erase(source,path);

			} else if (db.renamed) {
			    var oldPath = Array.clone(options.path)
			    oldPath[oldPath.length-1] = db.renamed;

			    update.push({
				sql : 'UPDATE mapTiles ' +
				"SET tiles = PREG_REPLACE('/\\?/',?,tiles) " +
				'WHERE mapID = ? ',
				arr : Array.clone([
				    JSON.encode(oldPath),
				    path,
				    options.map.options.database.mapID
				    ]),
				path : JSON.decode(path,true)
			    })
			}

			update.push({
			    sql : 'UPDATE mapscache ' +
			    'SET folderName = ?,' +
			    'path = ?,' +
			    'tileName = ?,' +
			    'options = ? ' +
			    'WHERE mapID = ? ' +
			    'AND mapCacheID = ? ',
			    arr : Array.clone([
				tileOpts.property.folderName,
				path,//must be index 1
				tileOpts.property.tileName,
				JSON.encode(tileOpts),
				options.map.options.database.mapID,
				db.mapCacheID
				]),
			    path : JSON.decode(path,true),
			    db : db
			});
			Object.erase(source,path);
		    } else {
			insert.push({
			    sql : 'INSERT INTO mapscache ' +
			    'SET mapID = ?,' +
			    'path = ?,' +
			    'folderName = ?,' +
			    'tileName = ?,' +
			    'options = ?',
			    arr : Array.clone([
				options.map.options.database.mapID,
				path,//must be index 1
				tileOpts.property.folderName,
				tileOpts.property.tileName,
				JSON.encode(tileOpts)
				]),
			    path : JSON.decode(path,true)
			});
			Object.erase(source,path);
		    }
		});
		break;

	    case 'tileset' :
		Object.each(flat,function(tileOpts,path,source){
		    var db = tileOpts.database;
		    Object.erase(tileOpts,'database');
		    if (db && db.tilesetCacheID) {

			if (!Number.from(db.tilesetCacheID)) {
			    options.errors.push('The Map Cache ID for "'+ path.join('.')+'" must be numeric.');
			    db = null;
			    return;
			}

			if (db.deleted) {
			    remove.push({
				sql : 'DELETE FROM tilesetscache ' +
				'WHERE tilesetID = ? ' +
				'AND tilesetCacheID = ? ',
				arr : Array.clone([options.tileset.database.tilesetID,db.tilesetCacheID]),
				path : JSON.decode(path,true)
			    });
			    Object.erase(source,path);

			} else if (db.renamed) {
			    var oldPath = Array.clone(JSON.decode(path,true))
			    oldPath[oldPath.length-1] = db.renamed;

			    update.push({
				sql : 'UPDATE tilesetTiles ' +
				"SET tiles = PREG_REPLACE('/\\?/',?,tiles) " +
				'WHERE tilesetID = ? ',
				arr : Array.clone([
				    JSON.encode(oldPath),
				    path,
				    options.tileset.database.tilesetID
				    ]),
				path : JSON.decode(path,true)
			    });
			}

			update.push({
			    sql : 'UPDATE tilesetscache ' +
			    'SET folderName = ?,' +
			    'path = ?,' +
			    'tileName = ?,' +
			    'options = ? ' +
			    'WHERE tilesetID = ? ' +
			    'AND tilesetCacheID = ? ',
			    arr : Array.clone([
				tileOpts.property.folderName,
				path,
				tileOpts.property.tileName,
				JSON.encode(tileOpts),
				options.tileset.database.tilesetID,
				db.tilesetCacheID
				]),
			    path : JSON.decode(path,true),
			    db : db
			});
			Object.erase(source,path);
		    } else {
			insert.push({
			    sql : 'INSERT INTO tilesetscache ' +
			    'SET tilesetID = ?,' +
			    'path = ?,' +
			    'folderName = ?,' +
			    'tileName = ?,' +
			    'options = ?',
			    arr : Array.clone([
				options.tileset.database.tilesetID,
				path,
				tileOpts.property.folderName,
				tileOpts.property.tileName,
				JSON.encode(tileOpts)
				]),
			    path : JSON.decode(path,true)
			});
			Object.erase(source,path);
		    }
		});
		break;

	    default :
		callback({
		    error : 'storeCache requires a tableId paramenter'
		});
		return;
		break;
	}

	var cacheChain = new Chain();

	RPG.Log('info','TileCache: Remove: ' + remove.length + ' - Update: ' + update.length + ' - Insert: ' + insert.length);

	//go through all the actions and perform their sql statments in sequence
	[remove,update,insert].each(function(action,index){
	    if (!action || action.length == 0) return;

	    //for each sql statment inside the action:
	    action.each(function(sqlStuff) {

		//push an sql statment onto the chain
		cacheChain.chain(function(){
		    require('../Database/mysql.njs').mysql.query(
			sqlStuff.sql,
			sqlStuff.arr,
			function(err,results) {
			    var tile = null;
			    if (err) {
				options.errors.push(err);
			    } else {
				switch (index) {
				    case 0 : //remove
					//RPG.Log('database delete','"'+(options.tableId)+'" cache "'+ sqlStuff.path.join('.') +'" id:'+(results && results.insertId)+'');
					if (results.affectedRows) {
					    var pathName = sqlStuff.path.pop();
					    Object.erase(Object.getFromPath(options.map.cache,sqlStuff.path),pathName);
					} else {
					    options.errors.push('Could not delete Cache item "'+ sqlStuff.path.join('.')+'" :(');
					}
					break;

				    case 1 : //update
					//RPG.Log('database update','"'+(options.tableId)+'" cache "'+ sqlStuff.path.join('.') +'" id:'+(JSON.encode(sqlStuff.db))+'');
					if (results.affectedRows) {
					    tile = Object.getFromPath(options.map.cache,sqlStuff.path);
					    if (!tile) {
						RPG.Log('database update','"'+(options.tableId)+'" cache "'+ sqlStuff.path.join('.')  +'" Cached Tile Not Found...');
					    } else {
						tile.options.database = sqlStuff.db;
					    }
					} else {
					    options.errors.push('Could not update Cache item "'+sqlStuff.path.join('.')+'" :(');
					}
					break;

				    case 2 ://insert
					//RPG.Log('database insert','"'+(options.tableId)+'" cache "'+ sqlStuff.path.join('.')  +'" id:'+(results && results.insertId)+'');
					if (results.insertId) {
					    tile = Object.getFromPath(options.map.cache,sqlStuff.path);
					    if (!tile) {
						RPG.Log('database insert','"'+(options.tableId)+'" cache "'+ sqlStuff.path.join('.')  +'" Cached Tile Not Found...');
					    } else {
						tile.options.database = {};
						tile.options.database[options.tableId+'CacheID'] = results.insertId;
					    }
					} else {
					    options.errors.push('Failed to get newly inserted Cache ID :( '+JSON.encode(options.tile));
					}
					break;
				}

			    }
			    tile = null;
			    cacheChain.callChain();
			});
		});
	    });
	});

	cacheChain.chain(function() {
	    //finally callback when everything is complete.
	    callback(options.universe);
	});
	cacheChain.callChain();
    }
}))();