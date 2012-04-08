var RPG = module.exports = {};
Object.merge(RPG,require('../../common/Game/Tiles/Utilities.js'));

var logger = RPG.Log.getLogger('RPG.Map');

RPG.Map = new (RPG.MapClass = new Class({

    initialize : function() {
	logger.info('Initialized');
    },

    /**
     * required options:
     * user
     * universe
     * mapID || mapName
     *
     * optional:
     * tilePoints
     *
     * Returns :
     * callback(universe || error) 'universe' object mergable with a universe  or error object
     */
    loadMap : function(options,callback) {
	if (!RPG.Log.requiredOptions(options,['user'],logger,callback)){
	    return;
	}

	if (options.character) {
	    options.universeID = options.character.location.universeID;

	    if (!options.mapName) {
		options.mapID = options.character.location.mapID;
		options.mapName = options.character.location.mapName;
	    }
	    if (!options.bypassCache) {
		var universe = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'universe_'+options.universeID);
		options.user.logger.trace('Map Load universeID: '+options.universeID+' map: "'+options.mapName+'" (cached)');
		if (universe && universe.maps && universe.maps[options.mapName]) {
		    options.universe = universe;
		    RPG.Map.loadTiles(options,function(tileUni){
			if (tileUni.error) {
			    callback(tileUni);
			    return;
			}
			Object.merge(universe,Object.clone(tileUni));
			callback(tileUni);
		    });
		    return;
		}
	    }
	}
	if (!options.mapID && !options.mapName) {
	    callback({});
	    return;
	}

	options.universeID = options.universeID || Object.getFromPath(options,'universe.options.database.universeID');

	if (!RPG.Log.requiredOptions(options,['universeID'],logger,callback)){
	    return;
	}

	var sql = '';
	var args = [];

	sql = 'SELECT mapID, mapName, options, universeID, '+
	' (SELECT min(X(point)) FROM maptiles mt WHERE mt.mapID = m.mapID) as minRow, ' +
	' (SELECT min(Y(point)) FROM maptiles mt WHERE mt.mapID = m.mapID) as minCol, ' +
	' (SELECT max(X(point)) FROM maptiles mt WHERE mt.mapID = m.mapID) as maxRow, ' +
	' (SELECT max(Y(point)) FROM maptiles mt WHERE mt.mapID = m.mapID) as maxCol ' +
	'FROM maps m ' +
	'WHERE m.universeID = ? '+
	'AND m.map'+(options.mapID?'ID':'Name')+' = ? ';

	args = [
	options.universeID,
	options.mapID || options.mapName
	];

	RPG.Mysql.query(sql,args,
	    function(err,mResults) {
		if (err) {
		    options.user.logger.error('Map Load universeID: '+options.universeID+' map: ' + (options.mapID || options.mapName) +' error: '+ JSON.encode(err));
		    callback({
			error : err
		    });
		} else if (mResults && mResults[0]) {
		    var mResult = mResults[0];
		    var universe = {
			options : options.universe && options.universe.options && Object.clone(options.universe.options),
			maps : {}
		    };

		    universe.maps[mResult['mapName']] = {
			options : Object.merge(
			    JSON.decode(mResult['options'],true),{
				database :{
				    minRow : mResult['minRow'],
				    minCol : mResult['minCol'],
				    maxRow : mResult['maxRow'],
				    maxCol : mResult['maxCol'],
				    mapID : mResult['mapID']
				}
			    })
		    };
		    options.mapID = mResult['mapID'];
		    options.universeID = mResult['universeID'];

		    if (!options.bypassCache) {
			require('../Cache.njs').Cache.merge(options.user.options.userID,'universe_'+mResult['universeID'],Object.clone(universe));
			options.user.logger.trace('Map Loaded (cached) universeID: '+options.universeID+' map: ' + (options.mapID || options.mapName));
		    } else {
			options.user.logger.trace('Map Loaded (non-cached) universeID: '+options.universeID+' map: ' + (options.mapID || options.mapName));
		    }


		    RPG.Map.loadTiles(options,function(tileUni){
			if (tileUni.error) {
			    callback(tileUni);
			    return;
			}
			Object.merge(universe,tileUni);
			callback(universe);
		    });
		} else {
		    options.user.logger.warn('Map Load universeID: '+options.universeID+' map: ' + (options.mapID || options.mapName) +' error: Nothing Found.');
		    callback({});
		}
	    });
    },
    /**
     * Checks for Duplicate Map Name
     * required options:
     * universeID
     * mapName
     *
     * optional options:
     * mapID  //ignore for updates
     *
     * return
     * callback(dupeName || null if ok)
     */
    checkDupeMapName : function(options,callback) {

	RPG.Mysql.query(
	    'SELECT mapName ' +
	    'FROM maps ' +
	    'WHERE mapName = ? ' +
	    'AND mapID <> ? ' +
	    'AND universeID = ? ',
	    [
	    options.mapName,
	    Number.from(options.mapID), // exclude current mapid in dupe mapName search if update is being performed.
	    options.universeID
	    ],
	    function(err,results) {
		if (err) {
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0] && results[0]['mapName']) {
			callback({
			    error : 'You have a Map mapNamed <b>"'+results[0]['mapName']+'"</b> already.<br>Please choose another mapName.'
			});
		    } else {
			callback(null);
		    }
		}
	    }
	    );
    },
    /**
     * Store Map data
     *
     * options
     *     user
     *     universe with maps
     *
     * returns
     * callback(universe || error)
     */
    storeMap : function(options,callback) {
	if (!RPG.Log.requiredOptions(options,['user','universe'],logger,callback)){
	    return;
	}
	options.errors = options.errors || [];

	var remove = null;
	var update = null;
	var insert = null;

	//go through all the maps in the universe
	Object.each(options.universe.maps,function(map,mapName,source){
	    //get this map database options
	    var db = map.options && map.options.database;
	    //Object.erase(map.options,'database');
	    if (db && db.mapID) {
		Object.erase(db,'new');
		//remove tiles specified in db.tileDelete (array of points)
		if (db && db.deleted) {
		    if (!remove) remove = RPG.Mysql.createQueue();
		    //perform any deletes
		    remove.queue('DELETE FROM maps ' +
			'WHERE universeID = ? ' +
			'AND mapID = ? ',
			[
			options.universe.options.database.universeID,
			db.mapID
			],
			function(err,info){
			    if (err) {
				options.user.logger.error('Map Delete: ' + (mapName) +' error: '+ JSON.encode(err));
				options.errors.push(err);
			    } else {
				if (info.affectedRows) {
				    options.user.logger.trace('Map Deleted: ' + (mapName));
				    Object.erase(options.universe.maps,mapName);
				} else {
				    options.user.logger.error('Map Delete error: ' + (mapName) + ' error: 0 Affected Rows');
				    options.errors.push('Could not delete Map ' + map.options.property.mapName);
				}
			    }
			});
		} else if (db.mapID) {
		    //perform any deletes
		    if (!update) update = RPG.Mysql.createQueue();
		    update.queue('UPDATE maps ' +
			'SET mapName = ?, ' +
			'options = ? ' +
			'WHERE universeID = ? ' +
			'AND mapID = ? ' ,
			[
			map.options.property.mapName,
			JSON.encode(map.options),
			options.universe.options.database.universeID,
			db.mapID
			],
			function(err,info){
			    if (err) {
				options.user.logger.error('Map Update: ' + (mapName) +' error: '+ JSON.encode(err));
				options.errors.push(err);
			    } else {
				if (info.affectedRows) {
				    options.user.logger.trace('Map Updated: ' + (mapName));
				    map.options.database = db;

				} else {
				    options.user.logger.error('Map Update error: ' + (mapName) + ' error: 0 Affected Rows');
				    options.errors.push('Could not update map item ' + mapName);
				}
			    }
			});
		}
	    } else {
		if (!insert) insert = RPG.Mysql.createQueue();
		insert.queue('INSERT INTO maps ' +
		    'SET universeID = ?, ' +
		    'mapName = ?, ' +
		    'options = ?',
		    [
		    options.universe.options.database.universeID,
		    map.options.property.mapName,
		    JSON.encode(map.options),
		    ],
		    function(err,info){
			if (err) {
			    options.user.logger.error('Map Insert: ' + (mapName) +' error: '+ JSON.encode(err));
			    options.errors.push(err);
			} else {

			    if (info && info.insertId) {

				map.options.database = Object.merge({
				    mapID : info.insertId,
				    'new' : true
				},RPG.getMapBounds(map.tiles));

				options.user.logger.trace('Map Inserted: ' + (mapName));
			    } else {
				options.user.logger.error('Map Insert error: ' + (mapName) + ' error: 0 Affected Rows');
				options.errors.push('Could not insert map item ' + mapName);
			    }
			}
		    });


	    }
	});

	//now that everything is all queued up:
	options.user.logger.trace('Map Store Chain Started: ' + Object.keys(options.universe.maps));
	RPG.Mysql.executeQueues([remove,update,insert],true,function(){
	    options.user.logger.trace('Map Store Chain Finiehd: ' + Object.keys(options.universe.maps));
	    if (options.errors && options.errors.length > 0) {
		callback({
		    error : options.errors
		})
		return;
	    }
	    RPG.Map.storeCache(options,function(){
		if (options.errors && options.errors.length > 0) {
		    callback({
			error : options.errors
		    })
		    return;
		}
		RPG.Map.storeTiles(options,function(){
		    if (options.errors && options.errors.length > 0) {
			callback({
			    error : options.errors
			})
			return;
		    }
		    callback(options.universe);
		});
	    });
	});
    },
    /**
     * List available maps
     * required options:
     *  user
     *  universe
     *
     *
     * returns:
     * callback(maps || error)
     */
    listMaps : function(options,callback) {
	if (!RPG.Log.requiredOptions(options,['user','universe'],logger,callback)){
	    return;
	}

	RPG.Mysql.query(
	    'SELECT mapID, mapName, m.options, m.universeID, '+
	    '   (SELECT count(1) FROM maptiles WHERE mapID = m.mapID) as totalArea, ' +
	    '   (SELECT count(1) FROM mapscache WHERE mapID = m.mapID) as totalObjects ' +
	    'FROM maps m, universes u ' +
	    'WHERE m.universeID = u.universeID  '+
	    'AND u.userID = ? ' +
	    'AND m.universeID = ? ' +
	    'ORDER BY mapName ASC',
	    [
	    options.user.options.userID,
	    options.universe.options.database.universeID
	    ],
	    function(err,results) {
		if (err) {
		    options.user.logger.error('Map List: universeID:' + (options.universe.options.database.universeID) +' error: '+ JSON.encode(err));
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0]) {
			var maps = {};

			results.each(function(result){
			    maps[result['mapName']] = {
				options : Object.merge({
				    database : {
					mapID : result['mapID'],
					universeID : result['universeID'],
					totalArea : result['totalArea'],
					totalObjects : result['totalObjects']
				    }
				},
				JSON.decode(result['options'],true)
				    )
			    };
			});
			options.user.logger.error('Map List '+results.length+' from universeID:' + (options.universe.options.database.universeID));
			callback(maps);

		    } else {
			options.user.logger.error('Map List: universeID:' + (options.universe.options.database.universeID) +' error: No Maps Found.');
			callback({
			    error : 'No Maps found.'
			});
		    }
		}
	    }
	    );
    },
    /**
     * required options:
     *
     *  user
     *  universe
     *  tilePoints = array of points [point,point,point] (point=[x,y])
     *
     * optional:
     *   character
     *
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
     *
     * note. if you want to save these loaded tiles, you will need to merge it with a universe that has options
     */
    loadTiles : function(options,callback) {
	if (!RPG.Log.requiredOptions(options,['user'],logger,callback)){
	    return;
	}

	if (!options.tilePoints) {
	    callback({});
	    return;
	}
	var cachedTiles = null;
	if (options.character) {
	    options.mapID = options.character.location.mapID;
	    options.universeID = options.character.location.universeID;
	    if (!options.bypassCache) {
		var cachedUni = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'universe_'+options.universeID);
		options.user.logger.trace('Map Load Tiles (cached) '+options.character.location.mapName);
		if (cachedUni && cachedUni.maps && cachedUni.maps[options.character.location.mapName] && cachedUni.maps[options.character.location.mapName].tiles) {
		    cachedTiles = cachedUni.maps[options.character.location.mapName].tiles;
		}
	    }
	} else {
	    options.universeID = options.universeID || Object.getFromPath(options,'universe.options.database.universeID');
	}

	if (!RPG.Log.requiredOptions(options,['mapID','universeID'],logger,callback)){
	    return;
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
		options.user.logger.trace('Map Load Tiles no points to load. map:'+options.mapID);
		callback({});
		return;
	    }
	}
	var sql = '';
	var args = [];

	sql = 'SELECT X(point) as x, Y(point) as y, tiles, m.mapName, mt.mapID, m.universeID '+
	'FROM maptiles mt, maps m ' +
	'WHERE m.mapID = ? '+
	'AND m.universeID = ? '+
	'AND mt.mapID = m.mapID '+
	(options.tilePoints=='all'?'':'AND point in (' + points.join(',')+') ') +
	'ORDER BY point ASC';
	args = [
	options.mapID,
	options.universeID
	];

	RPG.Mysql.query(sql,args,
	    function(err,mResults) {
		Object.erase(options,'tilePoints');
		if (err) {
		    options.user.logger.error('Map Load Tiles: universeID: ' + (options.universeID) +' mapID: ' + (options.mapID) +' error: '+ JSON.encode(err));
		    callback({
			error: err
		    });
		    return;
		} else if (mResults && mResults[0]) {

		    var tiles = {};//map.tiles object to hold the tile paths
		    var tCache = [];//list of paths to load from the cache
		    var mapName = null;
		    var mapID = 0;
		    var universeID = 0;

		    mResults.each(function(mResult){
			mapName = mResult['mapName'];
			mapID = mResult['mapID'];
			universeID = mResult['universeID'];
			var paths = JSON.decode(mResult['tiles'],true);

			RPG.pushTiles(tiles,[mResult['x'],mResult['y']],paths);

			paths.each(function(tile){
			    tCache.push(JSON.encode(tile));//push this tilePath for cache lookup
			});
		    });

		    options.paths = tCache.unique();

		    var universe = {
			maps : {}
		    };
		    universe.maps[mapName] = {
			tiles : tiles
		    };

		    if (!options.bypassCache) {
			require('../Cache.njs').Cache.merge(options.user.options.userID,'universe_'+universeID,Object.clone(universe));
			options.user.logger.trace('Map Loaded '+mResults.length+' Tiles (cached): universeID: ' + (options.universeID) +' mapID: ' + (options.mapID));
		    } else {
			options.user.logger.trace('Map Loaded '+mResults.length+' Tiles (non-cached): universeID: ' + (options.universeID) +' mapID: ' + (options.mapID));
		    }

		    RPG.Map.loadCache(options,function(cache) {
			if (cache.error) {
			    callback(cache);
			    return;
			}

			universe.maps[mapName].cache = cache;
			callback(universe);

			tiles = null;
			cache = null;
			universe = null;
		    });
		} else {
		    options.user.logger.trace('Map Loaded '+mResults.length+' Tiles (non-cached): universeID: ' + (options.universeID) +' mapID: ' + (options.mapID) + ' error: No Tiles Found');
		    callback({});
		}
	    }
	    );
    },
    /**
     * Insert the universes maps tiles into the database,
     * required options :
     * user
     * universe
     *
     * callback(options.universe || errors)
     */
    storeTiles : function(options,callback) {
	if (!RPG.Log.requiredOptions(options,['user','universe'],logger,callback)){
	    return;
	}

	options.errors = options.errors || [];

	var remove = null;
	var insert = null;

	//go through all the maps in the universe
	Object.each(options.universe.maps,function(map,mapName,source){

	    //get this map database options
	    var db = map.options && map.options.database;
	    if (db && db.mapID && !db['new']) {
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
			remove.queue('DELETE FROM maptiles ' +
			    'WHERE mapID = ? ' +
			    'AND point in ('+del.join(',')+') '+
			    'AND mapID in (SELECT mapID FROM maps WHERE universeID = ?)',
			    [
			    db.mapID,
			    options.universe.options.database.universeID
			    ],
			    function(err,info) {
				if (err) {
				    options.user.logger.error('Map Store Tiles - Delete Specific - name: '+mapName+ ' error: '+ JSON.encode(err));
				    options.errors.push(err);
				} else {
				    if (info.affectedRows) {
					options.user.logger.trace('Map Store Tiles - Deleted '+info.affectedRows+' Specific from '+mapName);
				    } else {
					options.user.logger.warn('Map Store Tiles - Deleted 0 Specific from '+mapName);
				    }
				}
			    });
		    }
		}
	    }
	    //For each row of tiles remove existing ones from the database
	    Object.each(map.tiles,function(col,rowNum,source) {

		if (db && !db['new']) {
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
			remove.queue('DELETE FROM maptiles ' +
			    'WHERE mapID = ? ' +
			    'AND point in ('+del.join(',')+') '+
			    'AND mapID in (SELECT mapID FROM maps WHERE universeID = ?)',
			    [
			    db.mapID,
			    options.universe.options.database.universeID
			    ],
			    function(err,info) {
				if (err) {
				    options.user.logger.error('Map Store Tiles - Delete Incoming - name: '+mapName+ ' error: '+ JSON.encode(err));
				    options.errors.push(err);
				} else {
				    if (info.affectedRows) {
					options.user.logger.trace('Map Store Tiles - Deleted '+info.affectedRows+' Incoming from '+mapName);
				    } else {
					options.user.logger.warn('Map Store Tiles - Deleted 0 Incoming from '+mapName);
				    }
				}
			    });
		    }
		}
		if (!insert) insert = RPG.Mysql.createQueue();
		//insert incoming tiles:
		var sql = 'INSERT INTO maptiles (mapID,point,tiles) VALUES ';
		var arr = [];
		Object.erase(db,'new');
		Object.each(col, function(tiles,colNum) {
		    if (tiles && tiles != 'null') {
			colNum = Number.from(colNum);
			sql += '(?,GeomFromText(\'POINT('+rowNum+' '+colNum+')\'),?),'
			arr.push(db.mapID,JSON.encode(tiles));
		    }
		});
		sql = sql.substr(0,sql.length-1);
		if (arr && arr.length > 1) {
		    insert.queue(sql,arr,
			function(err,info) {
			    if (err) {
				options.user.logger.error('Map Store Tiles - Insert Incoming name: '+mapName+ ' error: '+ JSON.encode(err));
				options.errors.push(err);
			    } else {
				if (info.insertId) {
				    options.user.logger.trace('Map Store Tiles - Inserted '+arr.length+' Incoming from '+mapName);
				} else {
				    options.user.logger.warn('Map Store Tiles - Insert 0 Incoming from '+mapName);
				}
			    }
			});
		}
	    });

	});
	//now that everything is all queued up:
	options.user.logger.trace('Map Store Tiles - Starting Store Queue: ' + Object.keys(options.universe.maps));
	RPG.Mysql.executeQueues([remove,insert],true,function(){
	    options.user.logger.trace('Map Store Tiles - Finished Store Queue: ' + Object.keys(options.universe.maps));
	    callback();
	});
    },
    /**
     * required options:
     *	    user
     *	    universe || universeID
     *	    mapID
     *	    paths : json encoded paths
     *
     * optional
     *	    character
     *
     * optional:
     *	    bypassCache
     */
    loadCache : function(options,callback) {
	if (!RPG.Log.requiredOptions(options,['user'],logger,callback)){
	    return;
	}

	if (!options.paths) {
	    callback({});
	    return;
	}
	var cachedTileCache = null;

	if (options.character) {
	    options.mapID = options.character.location.mapID;
	    options.universeID = options.character.location.universeID;
	    if (!options.bypassCache) {
		var cachedUni = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'universe_'+options.universeID) || {};
		options.user.logger.trace('Map Load Cache (cached) '+options.character.location.mapName);
		if (cachedUni.maps && cachedUni.maps[options.character.location.mapName]) {
		    cachedTileCache = cachedUni.maps[options.character.location.mapName].cache;
		}
	    }
	} else {
	    options.universeID = options.universeID || Object.getFromPath(options,'universe.options.database.universeID');
	}

	if (!RPG.Log.requiredOptions(options,['mapID','universeID'],logger,callback)){
	    return;
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
	    options.user.logger.warn('Map Load Cache 0 paths for mapID:'+options.mapID);
	    callback({});
	    return;
	}
	var sql = 'SELECT mapCacheID, mc.mapID, path, mc.options, m.mapName '+
	'FROM mapscache mc, maps m ' +
	'WHERE mc.mapID = m.mapID '+
	'AND m.mapID = ? ' +
	'AND m.universeID = ? ' +
	'AND path in ('+pathSql.join(',')+') ' +
	'ORDER BY folderName ASC';

	var arr = [
	options.mapID,
	options.universeID
	].append(paths)

	RPG.Mysql.query(sql,arr,
	    function(err,results) {
		if (err) {
		    options.user.logger.error('Map Load Tiles - Insert Incoming name: '+options.mapID+ ' error: '+ JSON.encode(err));
		    callback({
			error : err
		    });
		} else if (results && results[0]) {

		    var cache = RPG.expandResultsCache(results,'mapCacheID');

		    if (!options.bypassCache) {
			var cachedUni = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'universe_'+options.universeID);
			if (!cachedUni.maps) cachedUni.maps = {};
			if (!cachedUni.maps[results[0]['mapName']]) cachedUni.maps[results[0]['mapName']] = {};
			Object.merge(cachedUni.maps[results[0]['mapName']],{
			    cache : cache
			});
			options.user.logger.trace('Map Loaded '+results.length +' Tiles (cached) from '+options.mapID);
		    } else {
			options.user.logger.trace('Map Loaded '+results.length +' Tiles (non-cached) from '+options.mapID);
		    }
		    callback(cache);

		} else {
		    options.user.logger.warn('Map Load Cache - mapID: '+options.mapID+' error: None Found');
		    callback({});
		}
	    });

    },
    /**
     * required options:
     *	    user
     *	    universe
     */
    storeCache : function(options,callback) {
	if (!RPG.Log.requiredOptions(options,['user','universe'],logger,callback)){
	    return;
	}

	options.errors = options.errors || [];

	var remove = null;
	var insert = null;
	var update = null;

	//loop through all the maps found in the specified universe:
	Object.each(options.universe.maps,function(map,mapName,source){
	    //flatten the maps cache in prepreation for insert/update/delete
	    var flat = RPG.flattenCache(map.cache);

	    //go through each cache item and perform the necessary actions
	    Object.each(flat,function(tileOpts,path,source){

		//check for a database object in the tiles options
		var db = tileOpts.database;

		//check if the database object has a mapCacheID to do an update or delete
		if (db && db.mapCacheID) {

		    //ensure the mapCacheID is a number
		    if (!Number.from(db.mapCacheID)) {
			options.errors.push(mapName + ' The Map Cache ID for "'+ path+'" must be numeric.');
			db = null;
			return;
		    }

		    /**
		     * Marked for Deletion
		     */
		    if (db.deleted) {
			if (!remove) remove = RPG.Mysql.createQueue();
			remove.queue('DELETE FROM mapscache ' +
			    'WHERE mapID = ? ' +
			    'AND mapCacheID = ? ',
			    Array.clone([map.options.database.mapID,db.mapCacheID]),
			    function(err,results) {
				if (err) {
				    options.user.logger.error('Map Store Cache - Delete error. path:'+path+' from: '+mapName+ ' error: '+ JSON.encode(err));
				    options.errors.push(err);
				} else {
				    if (results.affectedRows) {
					options.user.logger.trace('Map Store Cache - Deleted path:'+path+' from: '+mapName);
					var pathName = (path = JSON.decode(path)).pop();
					Object.erase(Object.getFromPath(map.cache,path),pathName);
				    } else {
					options.user.logger.error('Map Store Cache - Delete error. path:'+path+' from: '+mapName+ ' error: 0 Affected Rows');
					options.errors.push('Could not delete Cache item "'+ path+'" :(');
				    }

				}
			    });
			Object.erase(source,path);
			return;

		    /**
		     * Marked for Rename
		     */
		    } else if (db.renamed) {
			var oldPath = Array.clone(JSON.decode(path,true))
			oldPath[oldPath.length-1] = db.renamed;
			if (!update) update = RPG.Mysql.createQueue();
			update.queue('UPDATE mapTiles ' +
			    "SET tiles = PREG_REPLACE('/\\?/',?,tiles) " +
			    'WHERE mapID = ? ',
			    [
			    JSON.encode(oldPath),
			    path,
			    map.options.database.mapID
			    ],
			    function(err,results) {
				if (err) {
				    options.user.logger.error('Map Store Cache - Update Tiles error. path:'+path+' from: '+mapName+ ' error: '+ JSON.encode(err));
				    options.errors.push(err);
				} else {
				    if (results.affectedRows) {
					options.user.logger.trace('Map Store Cache - Updated Tiles path:'+path+' from: '+mapName);
				    } else {
					options.user.logger.error('Map Store Cache - Update Tiles error. path:'+path+' from: '+mapName+ ' error: 0 Affected Rows');
					options.errors.push('Could not update Cache item "'+ path+'" :(');
				    }
				}
			    });
		    }

		    if (!update) update = RPG.Mysql.createQueue();
		    update.queue('UPDATE mapscache ' +
			'SET folderName = ?,' +
			'path = ?,' +
			'tileName = ?,' +
			'options = ? ' +
			'WHERE mapID = ? ' +
			'AND mapCacheID = ? ',
			[
			tileOpts.property.folderName,
			path,
			tileOpts.property.tileName,
			JSON.encode(tileOpts),
			map.options.database.mapID,
			db.mapCacheID
			],
			function(err,results) {
			    if (err) {
				options.user.logger.error('Map Store Cache - Update error. path:'+path+' from: '+mapName+ ' error: '+ JSON.encode(err));
				options.errors.push(err);
			    } else {
				if (results.affectedRows) {
				    options.user.logger.trace('Map Store Cache - Updated path:'+path+' from: '+mapName);
				    tileOpts.database = db;
				} else {
				    options.user.logger.error('Map Store Cache - Update error. path:'+path+' from: '+mapName+ ' error: 0 Affected Rows');
				    options.errors.push('Could not update Cache item "'+path+'" :(');
				}
			    }
			});
		    Object.erase(source,path);

		} else {

		    /**
		     * Insert New
		     */
		    if (!insert) insert = RPG.Mysql.createQueue();
		    insert.queue('INSERT INTO mapscache ' +
			'SET mapID = ?,' +
			'path = ?,' +
			'folderName = ?,' +
			'tileName = ?,' +
			'options = ?',
			Array.clone([
			    map.options.database.mapID,
			    path,
			    tileOpts.property.folderName,
			    tileOpts.property.tileName,
			    JSON.encode(tileOpts)
			    ]),
			function(err,results) {
			    if (err) {
				options.user.logger.error('Map Store Cache - Insert error. path:'+path+' from: '+mapName+ ' error: '+ JSON.encode(err));
				options.errors.push(err);
			    } else {
				if (results.insertId) {
				    tileOpts.database = {
					mapCacheID : results.insertId
				    };
				    options.user.logger.trace('Map Store Cache - Inserted path:'+path+' id: '+results.insertId+' from: '+mapName);
				} else {
				    options.user.logger.error('Map Store Cache - Insert error. path:'+path+' from: '+mapName+ ' error: 0 Inserted Rows');
				    options.errors.push('Failed to get newly inserted Cache ID :( '+JSON.encode(options.tile));
				}
			    }
			});
		    Object.erase(source,path);
		}
	    });
	});
	//now that everything is all queued up:
	options.user.logger.trace('Map Store Cache - Starting Store Queue: ' + Object.keys(options.universe.maps));
	RPG.Mysql.executeQueues([remove,update,insert],true,function(){
	    options.user.logger.trace('Map Store Cache - Finished Store Queue: ' + Object.keys(options.universe.maps));
	    callback();
	});
    }
}))();