var RPG = module.exports = {};
Object.merge(RPG,
    require('./Tile.njs')
    );


RPG.Map = new (RPG.MapClass = new Class({
    Implements : [Events,Options],



    options : {},
    initialize : function(options) {
	this.setOptions(options)
    },

    /**
     * required options:
     * user
     * mapID or mapName
     * universe || universeID
     *
     * optional:
     * tilePoints
     * mapOrTileset
     *
     * Returns :
     * callback(map) 'map' object mergable with a universe eg: {maps:{mapName:{...}}
     */
    load : function(options,callback) {
	options.mapOrTileset = options.mapOrTileset || 'map';
	var sql = '';
	var args = [];
	if (options.mapOrTileset == 'map'){
	    sql = 'SELECT mapID, mapName, m.options, '+
	    ' (SELECT min(X(point)) FROM maptiles mt WHERE mt.mapID = m.mapID) as minRow, ' +
	    ' (SELECT min(Y(point)) FROM maptiles mt WHERE mt.mapID = m.mapID) as minCol, ' +
	    ' (SELECT max(X(point)) FROM maptiles mt WHERE mt.mapID = m.mapID) as maxRow, ' +
	    ' (SELECT max(Y(point)) FROM maptiles mt WHERE mt.mapID = m.mapID) as maxCol ' +
	    'FROM maps m, universes un ' +
	    'WHERE m.universeID = ? '+
	    'AND m.map'+(options.mapID?'ID':'Name')+' = ? ' +
	    'AND un.userID = ?'
	    args = [
	    options.universeID || options.universe.options.database.universeID,
	    options['map'+(options.mapID?'ID':'Name')],
	    options.user.options.userID
	    ];
	} else {
	    sql = 'SELECT tilesetID, name, category, options, '+
	    ' (SELECT min(X(point)) FROM tilesettiles tt WHERE tt.tilesetID = t.tilesetID) as minRow, ' +
	    ' (SELECT min(Y(point)) FROM tilesettiles tt WHERE tt.tilesetID = t.tilesetID) as minCol, ' +
	    ' (SELECT max(X(point)) FROM tilesettiles tt WHERE tt.tilesetID = t.tilesetID) as maxRow, ' +
	    ' (SELECT max(Y(point)) FROM tilesettiles tt WHERE tt.tilesetID = t.tilesetID) as maxCol ' +
	    'FROM tilesets t ' +
	    'WHERE t.userID = ? '+
	    'AND t.tilesetID = ? '
	    args = [
	    options.user.options.userID,
	    options.tilesetID
	    ];
	}
	require('../Database/mysql.njs').mysql.query(sql,args,
	    function(err,mapResults) {
		if (err) {
		    callback({
			error : err
		    });
		} else if (mapResults && mapResults[0]) {
		    var mapResult = mapResults[0];
		    var universe = {
			maps : {}
		    };
		    var map;
		    RPG.Log('database hit','Loaded '+options.mapOrTileset+': '+ (options.mapID || options.mapName || mapResult['name']));
		    universe.maps[mapResult['mapName'] || mapResult['name']] = map = {
			tiles : {},
			cache : {},
			options : JSON.decode(mapResult['options'],true)
		    };
		    map.options.database = {
			minRow : mapResult['minRow'],
			minCol : mapResult['minCol'],
			maxRow : mapResult['maxRow'],
			maxCol : mapResult['maxCol']
		    };
		    map.options.database[options.mapOrTileset+'ID'] = mapResult[options.mapOrTileset+'ID'];
		    if (options.tilePoints) {
			RPG.Tile.load(options,function(tileUni){
			    if (tileUni.error) {
				callback(tileUni);
				return;
			    }
			    callback(Object.merge(universe,tileUni));
			});
		    } else {
			callback(universe);
		    }

		} else {
		    callback({});
		}
	    });
    },

    /**
     * Insert the universes maps or tileset into the database,
     * required options :
     * user
     * universe
     *
     * optional options:
     * mapOrTileset (default 'map' if not provided)
     * category (when mapOrTileset is 'tileset' a category is needed)
     *
     * callback(options.universe || errors)
     */
    store : function(options,callback) {
	options.mapOrTileset = options.mapOrTileset || 'map'
	var mapChain = new Chain();
	options.errors = options.errors || [];

	//loop through all the maps in the universe:
	Object.each(options.universe.maps,function(map,mapName){

	    mapChain.chain(function() {
		//RPG.Log('map',JSON.encode(map));
		var db =  map.options && map.options.database;
		Object.erase(options,'database');//remove the database stuff from the incoming options

		if (db && db[options.mapOrTileset+'ID']) {
		    /**
		     * Update
		     */
		    if (!Number.from(db[options.mapOrTileset+'ID'])) {
			options.errors.push('The '+options.mapOrTileset+' ID for "'+ mapName +'" must be numeric.');
			mapChain.callChain();
			return;
		    }
		    if (db.deleted) {
			/**
			 * Remove if requested.
			 * this will cause the mapCache and mapTiles to be removed also
			 */
			require('../Database/mysql.njs').mysql.query(
			    'DELETE FROM '+options.mapOrTileset+'s ' +
			    'WHERE '+(options.mapOrTileset=='map'?'universeID':'userID')+' = ? ' +
			    'AND '+options.mapOrTileset+'ID = ? ',
			    [options.universe.options.database.universeID,
			    db[options.mapOrTileset+'ID'],
			    ],
			    function(err,info) {
				RPG.Log('database delete',options.mapOrTileset+' "'+ mapName +'" #'+db[options.mapOrTileset+'ID']+' deleted ');
				if (err) {
				    options.errors.push(err);
				} else {
				    if (info.affectedRows) {
					Object.erase(options.universe.maps,mapName);
					db = null;
				    } else {
					options.errors.push('Could not delete '+options.mapOrTileset+' "'+ mapName +'" #'+db[options.mapOrTileset+'ID']+' :(');
				    }
				}
				mapChain.callChain();
			    }
			    );
		    } else {
			require('../Database/mysql.njs').mysql.query(
			    'UPDATE '+options.mapOrTileset+'s ' +
			    'SET '+(options.mapOrTileset=='map'?'mapName':'name = ?, category')+' = ?,' +
			    'options = ? ' +
			    'WHERE '+(options.mapOrTileset=='map'?'universeID':'userID')+' = ? ' +
			    'AND '+options.mapOrTileset+'ID = ? ' ,
			    [
			    mapName,
			    (options.mapOrTileset=='map'?null:options.category),
			    JSON.encode(map.options),
			    (options.mapOrTileset=='map'?options.universe.options.database.universeID:options.user.options.userID),
			    db[options.mapOrTileset+'ID'],
			    ].clean(),
			    function(err,info) {
				RPG.Log('database update',options.mapOrTileset+' "'+ mapName +'" #'+db[options.mapOrTileset+'ID']+' updated.');
				if (err) {
				    options.errors.push(err);
				} else {
				    if (info.affectedRows) {
					map.options.database = db;
				    } else {
					options.errors.push('Failed to get updated '+options.mapOrTileset+' ID for "'+ mapName +'":( ');
				    }
				}
				mapChain.callChain();
			    }
			    );
		    }

		} else if (map.options) {
		    /**
		     * Insert
		     */
		    require('../Database/mysql.njs').mysql.query(
			'INSERT INTO '+options.mapOrTileset+'s ' +
			'SET '+(options.mapOrTileset=='map'?'universeID':'userID')+' = ?, ' +
			(options.mapOrTileset=='map'?'mapName':'name = ?, category')+' = ?,' +
			'options = ?',
			[
			(options.mapOrTileset=='map'?options.universe.options.database.universeID:options.user.options.userID),
			mapName,
			(options.mapOrTileset=='map'?null:options.category),
			JSON.encode(map.options)
			].clean(),
			function(err,info) {
			    RPG.Log('database insert',options.mapOrTileset+' "'+ mapName +'" #'+info.insertId+' inserted ');
			    if (err) {
				options.errors.push(err);
			    } else {
				if (info.insertId) {
				    map.options.database = {};
				    map.options.database[options.mapOrTileset+'ID'] = info.insertId;
				} else {
				    options.errors.push('Failed to get newly inserted '+options.mapOrTileset+' ID for "'+ mapName +'" :( ');
				}
			    }
			    mapChain.callChain();
			}
			);
		} else {
		    options.mapName = mapName;
		    RPG.Map.load(options,function(universe){
			Object.erase(options,mapName);
			if (universe.error) {
			    options.errors.push('Error Loading Existing Map Options for unspecified map data');
			} else {
			    Object.merge(options.universe,universe);
			}
			mapChain.callChain();
		    });
		}
	    });//end push
	});//end object.each

	//this will get called at the end of the mapChain.callChain();
	mapChain.chain(function(){
	    var err = options.errors;
	    if (err.length > 0) {
		callback({
		    error : err
		});
	    } else {
		RPG.Map.storeCache(options, function(universe) {
		    RPG.Tile.storeTiles(options, function(universe) {
			callback(universe);
		    });
		});
	    }
	});
	mapChain.callChain(); //start storeing all the maps.
    },

    /**
     * Insert the universes maps or tileset cache into the database,
     * required options :
     * user
     * universe
     *
     *
     * optional options:
     * mapOrTileset (default 'map' if not provided)
     *
     * internally used for recursion: (removed from options object upon completion)
     * tile
     * pathName
     * path (array keeping track of path depth)
     * cacheChain
     * errors array
     * map
     * mapsChain //go through all maps
     *
     * callback(options.universe || errors)
     */
    storeCache : function(options,callback) {
	options.pathName = options.pathName || '';
	options.path = options.path || [];
	options.mapOrTileset = options.mapOrTileset || 'map'
	if (!options.cacheChain) {
	    options.cacheChain = new Chain();
	}
	options.errors = options.errors || [];

	if (!options.mapsChain) {
	    //RPG.Log('chain started','All Map Caches: ' + Object.keys(options.universe.maps).length);
	    options.mapsChain = new Chain();
	    Object.each(options.universe.maps,function(map,mapName){
		//RPG.Log('Map chain started',mapName);
		options.mapsChain.chain(function() {
		    options.map = map;
		    options.pathName = '';
		    options.path = [];
		    options.tile = null;
		    RPG.Map.storeCache(options,function(){
			//RPG.Log('chain complete',mapName);
			options.cacheChain = null;
			options.cacheChainStarted = false;
			options.mapsChain.callChain();
		    });
		});
	    });
	    options.mapsChain.chain(function(){
		var err = options.errors;
		Object.erase(options,'tile');
		Object.erase(options,'pathName');
		Object.erase(options,'cacheChain');
		Object.erase(options,'errors');
		Object.erase(options,'map');
		Object.erase(options,'mapsChain');
		Object.erase(options,'cacheChainStarted');
		if (err.legnth > 0) {
		    callback({
			error : err
		    });
		} else {
		    callback(options.universe);
		}
	    });
	    options.mapsChain.callChain();
	}

	if (!options.tile) {
	    options.tile = options.map.cache;
	} else {
	    options.path.push(options.pathName);
	}

	var path = Array.clone(options.path);
	var ID = options.map.options.database[options.mapOrTileset+'ID'];
	var tile = options.tile;

	if (options.tile && options.tile.options) {

	    var db =  options.tile.options.database;
	    Object.erase(options.tile.options,'database');//remove the database stuff from the incoming options

	    if (db && db[options.mapOrTileset+'CacheID']) {


		/**
		 * Update
		 */
		if (!Number.from(db[options.mapOrTileset+'CacheID'])) {
		    options.errors.push('The Cache ID for "'+ path.join('.')+'" must be numeric.');
		    db = null;
		    return;
		}
		if (db.deleted) {
		    /**
		     * Remove if requested.
		     */

		    options.cacheChain.chain(function(){
			require('../Database/mysql.njs').mysql.query(
			    'DELETE FROM '+options.mapOrTileset+'scache ' +
			    'WHERE '+options.mapOrTileset+'ID = ? ' +
			    'AND '+options.mapOrTileset+'CacheID = ? ',
			    [
			    ID,
			    db[options.mapOrTileset+'CacheID']
			    ],
			    function(err,info) {
				RPG.Log('database delete','"'+options.map.options.property.mapName+'" cache "'+ path +'" id:'+db[options.mapOrTileset+'CacheID']+' deleted.');
				if (err) {
				    options.errors.push(err);
				} else {
				    if (info.affectedRows) {
					var pathName = path.pop();
					Object.erase(Object.getFromPath(options.map.cache,path,pathName));
				    } else {
					options.errors.push('Could not delete mapCache item "'+ options.path.join('.')+'" :(');
				    }
				}
				options.cacheChain.callChain();
			    }
			    );
		    });
		} else {
		    if (db.renamed || db.moved) {
			/**
			 * When a mapCache object is renamed we need to find all the tiles that use the old name, and replace them
			 * or when the object is moved to a different folder
			 */
			var oldPath = Array.clone(options.path)
			if (db.renamed) {
			    oldPath[oldPath.length-1] = db.renamed;
			}
			if (db.moved) {
			    oldPath[0] = db.moved;
			}

			options.cacheChain.chain(function(){
			    require('../Database/mysql.njs').mysql.query(
				'UPDATE '+options.mapOrTileset+'Tiles ' +
				"SET tiles = PREG_REPLACE('/\\?/',?,tiles) " +
				'WHERE '+options.mapOrTileset+'ID = ? ',
				[
				JSON.encode(oldPath),
				JSON.encode(path),
				ID
				],
				function(err,info) {
				    RPG.Log('database update','"'+options.map.options.property.mapName+'" tile Move/Rename id:'+db[options.mapOrTileset+'CacheID']+' old path: ' + JSON.encode(oldPath) + '  new path: ' + JSON.encode(path));
				    if (err) {
					options.errors.push(err);
				    } else {
					if (info.affectedRows) {
					    tile.options.database = db;
					//@todo rename in-memory objects
					} else {
					    options.errors.push('Error renaming/moving Cache item "'+ options.path.join('.')+'" :(');
					}
				    }
				    options.cacheChain.callChain();
				}
				);
			});
		    }
		    options.cacheChain.chain(function(){
			require('../Database/mysql.njs').mysql.query(
			    'UPDATE '+options.mapOrTileset+'scache ' +
			    'SET folderName = ?,' +
			    'path = ?,' +
			    'tileName = ?,' +
			    'options = ? ' +
			    'WHERE '+options.mapOrTileset+'ID = ? ' +
			    'AND '+options.mapOrTileset+'CacheID = ? ',
			    [
			    tile.options.property.folderName,
			    JSON.encode(path),
			    tile.options.property.tileName,
			    JSON.encode(tile.options),
			    ID,
			    db[options.mapOrTileset+'CacheID']
			    ],
			    function(err,info) {
				RPG.Log('database update','"'+options.map.options.property.mapName+'" cache "'+ path +'" #'+db[options.mapOrTileset+'CacheID']+' updated.');
				if (err) {
				    RPG.Log('error',err)
				    options.errors.push(err);
				} else {
				    if (info.affectedRows) {
					tile.options.database = db;
				    } else {
					options.errors.push('Could not update Cache item "'+ path.join('.')+'" :(');
				    }
				}
				options.cacheChain.callChain();
			    }
			    );
		    });
		}

	    } else {
		/**
		 * Insert
		 */
		!options.cacheChainStarted && options.cacheChain.chain(function(){

		    require('../Database/mysql.njs').mysql.query(
			'INSERT INTO '+options.mapOrTileset+'scache ' +
			'SET '+options.mapOrTileset+'ID = ?,' +
			'folderName = ?,' +
			'path = ?,' +
			'tileName = ?,' +
			'options = ?',
			[
			ID,
			tile.options.property.folderName,
			JSON.encode(path),
			tile.options.property.tileName,
			JSON.encode(tile.options)
			],
			function(err,info) {
			    RPG.Log('database insert','"'+(options.map.options.property.mapName || 'tileset')+'" cache "'+ path +'" id:'+(info && info.insertId)+'');
			    if (err) {
				options.errors.push(err);
			    } else {
				if (info.insertId) {
				    tile.options.database = {};
				    tile.options.database[options.mapOrTileset+'CacheID'] = info.insertId;
				} else {
				    options.errors.push('Failed to get newly inserted Cache ID :( '+JSON.encode(options.tile));
				}
			    }
			    options.cacheChain.callChain();
			}
			);
		});
	    }

	} else {
	    Object.each(options.tile,function(tile,name){
		options.tile = tile;
		options.pathName = name;
		RPG.Map.storeCache(options,callback);
	    });
	}
	options.path.pop();

	//at this point all queries should be queued up in the options.cacheChain for the current map cache
	//execute them and move onto he next
	if (!options.cacheChainStarted && options.path.length == 0) {
	    options.cacheChain && options.cacheChain.chain(function(){
		//RPG.Log('chain complete','Cache for '+options.map.options.property.mapName + ' ');
		callback();
	    });
	    //RPG.Log('chain start',''+options.map.options.property.mapName + ' cache start');
	    options.cacheChain.callChain();
	    options.cacheChainStarted = true;
	}
    },



    /**
     * Checks for Duplicate Tileset Name
     * required options:
     * name
     * category
     *
     * optional options:
     * tilesetID  //ignore for updates
     *
     * return
     * callback(dupeName || null if ok)
     */
    checkDupeTilesetName : function(options,callback) {

	require('../Database/mysql.njs').mysql.query(
	    'SELECT name ' +
	    'FROM tilesets ' +
	    'WHERE name = ? ' +
	    'AND category = ? ' +
	    'AND tilesetID <> ? ',
	    [
	    options.name,
	    options.category,
	    Number.from(options.tilesetID) // exclude current tilesetid in dupe name search if update is being performed.
	    ],
	    function(err,results) {
		if (err) {
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0] && results[0]['name']) {
			callback({
			    error : 'You have a Tileset named <b>"'+results[0]['name']+'"</b> already.<br>Please choose another name.'
			});
		    } else {
			callback(null);
		    }
		}
	    }
	    );
    },

    /**
     * Store Tileset data
     * user
     * tilesetMap
     *
     * returns
     * callback(fake universe || error)
     */
    storeTileset : function(options,callback) {

	this.checkDupeTilesetName({
	    name : options.tilesetMap.options.property.name,
	    category : options.tilesetMap.options.property.category,
	    tileseID : (options.tilesetMap.options.database && options.tilesetMap.options.database.tilesetID?options.tilesetMap.options.database.tilesetID:0)
	},function(dupeName) {
	    if (dupeName) {
		callback({
		    error : dupeName
		});
		return;
	    }

	    //fake universe since tilesets do no belong to a universe
	    options.universe = {
		maps : {}
	    };
	    options.universe.maps[options.tilesetMap.options.property.name] = options.tilesetMap;
	    options.category = options.tilesetMap.options.property.category;

	    this.store(options,callback);

	}.bind(this));
    },

    /**
     * List available tilesets
     * required options:
     * none for now
     *
     *
     * returns:
     * callback(tilesets || error)
     */
    listTilesets : function(options,callback) {
	require('../Database/mysql.njs').mysql.query(
	    'SELECT tilesetID, category, ts.name, options, u.name as userName, '+
	    '   (SELECT count(1) FROM tilesettiles WHERE tilesetID = ts.tilesetID) as totalArea, ' +
	    '   (SELECT count(1) FROM tilesetscache WHERE tilesetID = ts.tilesetID) as totalObjects ' +
	    'FROM tilesets ts, user u ' +
	    'WHERE ts.userID = u.userID  '+
	    'ORDER BY category ASC, ts.name ASC'
	    ,
	    [

	    ],
	    function(err,results) {
		if (err) {
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0]) {
			var tilesets = {};

			results.each(function(result){
			    if (!tilesets[result['category']]) {
				tilesets[result['category']] = {};
			    }
			    tilesets[result['category']][result['name']] = {
				options : Object.merge({
				    database : {
					tilesetID : result['tilesetID'],
					userName : result['userName'],
					totalArea : result['totalArea'],
					totalObjects : result['totalObjects']
				    }
				},
				JSON.decode(result['options'],true)
				    )
			    };
			});

			callback(tilesets);

		    } else {
			callback({
			    error : 'No Tilesets found.'
			});
		    }
		}
	    }
	    );
    },

    /**
     * List available tilesets
     * required options:
     * user
     * universe || universeID
     *
     * returns:
     * callback(maplist || error)  (mergabe with a universe.maps object)
     */
    listMaps : function(options,callback) {
	require('../Database/mysql.njs').mysql.query(
	    'SELECT mapID, mapName, m.options, '+
	    ' (SELECT min(X(point)) FROM maptiles mt WHERE mt.mapID = m.mapID) as minRow, ' +
	    ' (SELECT min(Y(point)) FROM maptiles mt WHERE mt.mapID = m.mapID) as minCol, ' +
	    ' (SELECT max(X(point)) FROM maptiles mt WHERE mt.mapID = m.mapID) as maxRow, ' +
	    ' (SELECT max(Y(point)) FROM maptiles mt WHERE mt.mapID = m.mapID) as maxCol ' +
	    'FROM maps m, universes un ' +
	    'WHERE m.universeID = un.universeID AND un.universeID = ? AND un.userID = ? '+
	    'ORDER BY m.mapName ASC'
	    ,
	    [
	    options.universeID || options.universe.options.database.universeID,
	    options.user.options.userID
	    ],
	    function(err,results) {
		if (err) {
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0]) {
			var maps = {};

			results.each(function(result){
			    if (!maps[result['mapName']]) {
				maps[result['mapName']] = {};
			    }
			    maps[result['mapName']] = {
				options : Object.merge({
				    database : {
					mapID : result['mapID'],
					minRow : result['minRow'],
					minCol : result['minCol'],
					maxRow : result['maxRow'],
					maxCol : result['maxCol']
				    }
				},
				JSON.decode(result['options'],true)
				    )
			    };
			});
			callback(maps);
		    } else {
			callback({
			    error : 'No Maps found.'
			});
		    }
		}
	    }
	    );
    }

}))();