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
     * character || universeID
     * character || mapID || mapName
     * tilePoints = array of points [point,point,point] (point=[x,y])
     *
     * optional options :
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

	var universe = {};
	var cachedUni = {};
	var cachedTiles = null;

	if (options.character) {
	    options.mapID = options.character.location.mapID;
	    options.universeID = options.character.location.universeID;
	    cachedUni = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'universe_'+options.character.location.universeID);
	    if (cachedUni && cachedUni.maps && cachedUni.maps[options.character.location.mapName]) {
		cachedTiles = cachedUni.maps[options.character.location.mapName].tiles;
	    }
	}

	var sql = '(';
	var cnt = 0;
	options.tilePoints.each(function(point){
	    if (cachedTiles && cachedTiles[point[0]] && cachedTiles[point[0]][point[1]]) {


	    //ignore cached tiles since they should already exist in on the client
	    } else {
		sql += RPG.getPointSQL(point);
		sql += ',';
		cnt++;
	    }
	});

	if (sql.length > 1) {
	    sql = sql.substr(0,sql.length-1);
	    sql += ')';
	} else {
	    //RPG.Log('cache','Tiles: none to load.');
	    callback({});
	    return;
	}
	var sql2 = '';
	require('../Database/mysql.njs').mysql.query(
	    sql2 = 'SELECT X(point) as x, Y(point) as y, tiles, m.mapName '+
	    'FROM maptiles mt, maps m, universes un ' +
	    'WHERE mt.mapID = m.mapID '+
	    'AND m.map'+(options.mapID?'ID':'Name')+' = ? ' +
	    'AND un.userID = ? '+
	    'AND m.universeID = ? '+
	    'AND point in '+ sql + ' ' +
	    'ORDER BY point ASC'
	    ,sql = [
	    options['map'+(options.mapID?'ID':'Name')],
	    options.user.options.userID,
	    options.universeID
	    ],

	    function(err,mtResults) {
		Object.erase(options,'tilePoints');
		if (err) {
		    callback({
			error: err
		    });

		} else if (mtResults && mtResults[0]) {
		    universe.maps = {};

		    var tiles = {};
		    var tCache = [];
		    var mapName = null;
		    mtResults.each(function(mtResult){
			mapName = mtResult['mapName'];

			if (!tiles[mtResult['x']]) {
			    tiles[mtResult['x']] = {};
			}
			tiles[mtResult['x']][mtResult['y']] = JSON.decode(mtResult['tiles'],true);
			tiles[mtResult['x']][mtResult['y']].each(function(tile){
			    tCache.push(JSON.encode(tile));
			});
		    });
		    RPG.Log('database hit','Tiles: Loaded ' + cnt + ' tiles from "'+mapName+"");
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
		    //RPG.Log('database hit','No Tiles Found. ' + sql + ' '+sql2);
		    callback({});
		}
	    }
	    );
    },

    /**
     * Required options:
     * user
     * character || universeID
     * character || mapID || mapName
     * paths = array of json encoded paths ['["p1","p2"]','["p3","p4"]']
     *
     * Returns:
     * callback = map cache object (mergable with a universe Map object
     * eg: {terrain : { solid : { ... } } }
     *
     */
    loadTilesCache : function(options,callback) {

	var cachedTileCache = null;

	if (options.character) {
	    options.mapID = options.character.location.mapID;
	    options.universeID = options.character.location.universeID;
	    var cachedUni = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'universe_'+options.character.location.universeID) || {};
	    if (cachedUni.maps && cachedUni.maps[options.character.location.mapName]) {
		cachedTileCache = cachedUni.maps[options.character.location.mapName].cache;
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

	if (pathSql.length > 1) {
	    pathSql = pathSql.substr(0,pathSql.length-1);
	    pathSql += ')';
	    RPG.Log('database hit','TileCache: Loading ' + pathSql.length + ' tile cache objects.');
	} else {
	    //RPG.Log('no tiles','TileCache: None or all in cache');
	    callback({});
	    return;
	}


	require('../Database/mysql.njs').mysql.query(
	    pathSql = 'SELECT mapCacheID, mc.mapID, path, mc.options '+
	    'FROM mapscache mc, maps m, universes un ' +
	    'WHERE mc.mapID = m.mapID '+
	    'AND m.map'+(options.mapID?'ID':'Name')+' = ? ' +
	    'AND m.universeID = un.universeID ' +
	    'AND un.universeID = ? ' +
	    'AND un.userID = ? ' +
	    'AND path in '+pathSql+' ' +
	    'ORDER BY folderName ASC'
	    ,[
	    options['map'+(options.mapID?'ID':'Name')],
	    options.universeID,
	    options.user.options.userID,
	    ].append(paths),
	    function(err,mcResults) {
		Object.erase(options,'paths');
		Object.erase(options,'tilePoints');
		if (err) {
		    callback({
			error : err
		    });
		} else if (mcResults && mcResults[0]) {
		    //go through each map cache result:
		    var cache = {};
		    mcResults.each(function(mcResult){
			Object.pathToObject(cache,JSON.decode(mcResult['path'],true)).child.options = Object.merge({
			    database : {
				mapCacheID : mcResult['mapCacheID']
			    }
			},
			JSON.decode(mcResult['options'])
			    );
		    });
		    callback(cache);
		    cache = null;
		} else {
		    callback({});
		}
	    }
	    );
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
		    del = del.substr(0,del.length-3) + ')';
		    require('../Database/mysql.njs').mysql.query(
			'DELETE FROM '+options.mapOrTileset+'tiles '+
			'WHERE '+options.mapOrTileset+'ID = ? '+
			'AND point in '+del+' '+
			'AND '+options.mapOrTileset+'ID in (SELECT '+options.mapOrTileset+'ID FROM maps m, universes un WHERE m.universeID = un.universeID AND un.universeID = ? AND un.userID = ?)',
			[
			db[options.mapOrTileset+'ID'],
			options.universe.options.database.universeID,
			options.user.options.userID
			],
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
		Object.erase(db,'tileDelete');//erasing this will make sure this code is not executed again.
		return;
	    }

	    /**
	     * Existing Map, delete incoming tiles from database to be replaced by the new ones being sent in
	     * once the delete is complete, this function gets called again to do the insert
	     */
	    del = 'DELETE FROM '+options.mapOrTileset+'tiles '+
	    'WHERE mapID = ? '+
	    'AND point in (';
	    Object.each(options.col, function(tiles,colNum) {
		del += RPG.getPointSQL([options.rowNum,colNum]) + ','
	    });
	    del = del.substr(0,del.length-1) + ') ';
	    del += 'AND '+options.mapOrTileset+'ID in (SELECT '+options.mapOrTileset+'ID FROM maps m, universes un WHERE m.universeID = un.universeID AND un.universeID = ? AND un.userID = ?)';

	    if (Object.keys(options.col).length > 0) {
		require('../Database/mysql.njs').mysql.query(
		    del,
		    [
		    db[options.mapOrTileset+'ID'],
		    options.universe.options.database.universeID,
		    options.user.options.userID
		    ],
		    function(err,info) {
			if (err) {
			    options.errors.push(err);
			}
			options.existingTilesDeleted = true;
			RPG.Tile.storeTiles(options,callback);
		    });
	    } else {
		RPG.Tile.storeTiles(options,callback);
	    }
	    return;//exit the function and wait for db operation to complete.
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


	var sql = 'INSERT INTO '+options.mapOrTileset+'tiles ('+options.mapOrTileset+'ID,point,tiles) VALUES ';
	var arr = [];
	Object.each(options.col, function(tiles,colNum) {
	    if (tiles && tiles != 'null') {
		sql += '(?,GeomFromText(\'POINT('+Number.from(options.rowNum) + ' ' + Number.from(colNum)+')\'),?),'
		arr.push(db[options.mapOrTileset+'ID'],JSON.encode(tiles));
	    }
	});
	sql = sql.substr(0,sql.length-1);
	if (arr && arr.length < 1) options.tilesChain.callChain();

	require('../Database/mysql.njs').mysql.query(sql,arr,
	    function(err,info) {
		RPG.Log('database insert','"'+options.map.options.property.mapName + '" tile row '+options.rowNum+' inserted: '+Object.keys(options.col).length);
		if (err) {
		    options.errors.push(err);
		} else {
		    if (info.insertId) {

		    } else {
			options.errors.push('Failed to get newly inserted '+options.mapOrTileset+' Tiles :( ');
		    }
		}
		options.tilesChain && options.tilesChain.callChain();
	    }
	    );
    },


    /**
     * required options:
     * user,
     * character,
     * universe
     *
     * returns : object from RPG.Tile.loadTiles excluding cached tiles
     */
    getViewableTiles : function(options,callback) {

	RPG.Character.calcSightRadius(options.character,function(radius){
	    if (!radius || radius < 2) {
		callback({
		    error : 'Invalid Sight Radius: ' + radius
		});
		return;
	    }

	    var circle = RPG.getCircleArea(options.character.location.point,radius);

	    Object.merge(options,{
		tilePoints : circle.area
	    });
	    circle = null;
	    RPG.Tile.load(options,function(universe){
		callback(universe);
	    });
	});
    }
}))();