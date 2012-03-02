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
     * userID
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
    loadTiles : function(options,callback) {

	var universe = {};
	var cachedUni = {};
	var cachedTiles = null;

	if (options.character) {
	    options.mapID = options.character.location.mapID;
	    options.universeID = options.character.location.universeID;
	    cachedUni = require('../Cache.njs').Cache.retrieve(options.userID,'universe_'+options.character.location.universeID);
	    if (cachedUni && cachedUni.maps && cachedUni.maps[options.character.location.mapName]) {
		cachedTiles = cachedUni.maps[options.character.location.mapName].tiles;
	    }
	}

	var sql = '(';
	options.tilePoints.each(function(point){
	    if (cachedTiles && cachedTiles[point[0]] && cachedTiles[point[0]][point[1]]) {


	    //ignore cached tiles since they should already exist in on the client
	    } else {
		sql += RPG.getPointSQL(point);
		sql += ',';
	    }
	});

	if (sql.length > 1) {
	    sql = sql.substr(0,sql.length-1);
	    sql += ')';
	} else {
	    callback({});
	    return;
	}

	require('../Database/mysql.njs').mysql.query(
	    'SELECT X(point) as x, Y(point) as y, tiles, m.mapName '+
	    'FROM maptiles mt, maps m, universes un ' +
	    'WHERE mt.mapID = m.mapID '+
	    'AND m.map'+(options.mapID?'ID':'Name')+' = ? ' +
	    'AND un.userID = ? '+
	    'AND m.universeID = ? '+
	    'AND point in '+ sql + ' ' +
	    'ORDER BY point ASC'
	    ,[
	    options['map'+(options.mapID?'ID':'Name')],
	    options.userID,
	    options.universeID
	    ],

	    function(err,mtResults) {
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

		    options.paths = tCache.unique();
		    this.loadTilesCache(options,function(cache) {
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
		    callback({});
		}
	    }.bind(this)
	    );
    },

    /**
     * Required options:
     * userID
     * character || universeID
     * character || mapID || mapName
     * paths = array of json encoded paths ['["p1","p2"]','["p3","p4"]']
     *
     * Returns:
     * callback = map cache object (mergable with a universe map object
     * eg: {terrain : { solid : { ... } } }
     *
     */
    loadTilesCache : function(options,callback) {

	var cachedTileCache = null;

	if (options.character) {
	    options.mapID = options.character.location.mapID;
	    options.universeID = options.character.location.universeID;
	    var cachedUni = require('../Cache.njs').Cache.retrieve(options.userID,'universe_'+options.character.location.universeID) || {};
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
	} else {
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
	    options.userID,
	    ].append(paths),
	    function(err,mcResults) {
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
	    }.bind(this)
	    );
    },


    /**
     * required options:
     * userID,
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

	    this.loadTiles(options,callback);

	}.bind(this));
    }
}))();