var RPG = module.exports = {};
Object.merge(RPG,require('../../common/Game/Tiles/Utilities.js'));


RPG.Tileset = new (RPG.TilesetClass = new Class({
    /**
     * required options:
     * user
     * tilesetID
     *
     * optional:
     * tilePoints
     *
     * Returns :
     * callback(universe || error) 'universe' object mergable with a universe  or error object
     */
    loadTileset : function(options,callback) {

	var sql = '';
	var args = [];

	sql = 'SELECT tilesetID, name, category, options, '+
	' (SELECT min(X(point)) FROM tilesettiles tt WHERE tt.tilesetID = t.tilesetID) as minRow, ' +
	' (SELECT min(Y(point)) FROM tilesettiles tt WHERE tt.tilesetID = t.tilesetID) as minCol, ' +
	' (SELECT max(X(point)) FROM tilesettiles tt WHERE tt.tilesetID = t.tilesetID) as maxRow, ' +
	' (SELECT max(Y(point)) FROM tilesettiles tt WHERE tt.tilesetID = t.tilesetID) as maxCol ' +
	'FROM tilesets t ' +
	'WHERE t.userID = ? '+
	'AND t.tilesetID = ? ';

	args = [
	options.user.options.userID,
	options.tilesetID
	];

	RPG.Mysql.query(sql,args,
	    function(err,tResults) {
		if (err) {
		    callback({
			error : err
		    });
		} else if (tResults && tResults[0]) {
		    var tResult = tResults[0];
		    var universe = {
			tilesets : {}
		    };
		    var tileset = null;

		    universe.tilesets[tResult['name']] = tileset = {
			tiles : {},
			cache : {},
			options : JSON.decode(tResult['options'],true)
		    };
		    tileset.options.database = {
			minRow : tResult['minRow'],
			minCol : tResult['minCol'],
			maxRow : tResult['maxRow'],
			maxCol : tResult['maxCol']
		    };
		    tileset.options.database.id = tResult['tilesetID'];

		    RPG.Tileset.loadTiles(options,function(tileUni){
			if (tileUni.error) {
			    callback(tileUni);
			    return;
			}
			callback(Object.merge(universe,tileUni));
		    });

		} else {
		    callback({});
		}
	    });
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

	RPG.Mysql.query(
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
     *
     * options
     *     user
     *     universe with tilesets
     *
     * returns
     * callback(fake universe || error)
     */
    storeTileset : function(options,callback) {
	options.errors = options.errors || [];

	var remove = null;
	var update = null;
	var insert = null;

	//go through all the tilesets in the universe
	Object.each(options.universe.tilesets,function(tileset,name,source){

	    RPG.Tileset.checkDupeTilesetName({
		name : tileset.options.property.name,
		category : tileset.options.property.category,
		id : (tileset.options.database && tileset.options.database.id?tileset.options.database.id:0)
	    },function(dupeName) {
		if (dupeName) {
		    options.errors.push(dupeName);
		    return;
		}
		//get this tileset database options
		var db = Object.getFromPath(tileset,'options.database');
		if (db && db.id) {

		    //remove tiles specified in db.tileDelete (array of points)
		    if (db && db.deleted) {
			if (!remove) remove = RPG.Mysql.createQueue();
			//perform any deletes
			remove.queue('DELETE FROM tilesets ' +
			    'WHERE userID = ? ' +
			    'AND tilesetID = ? ',
			    [
			    options.user.options.userID,
			    db.id
			    ],
			    function(err,info){
				if (err) {
				    options.errors.push(err);
				} else {
				    if (info.affectedRows) {
					Object.erase(options.universe.tilesets,name);
				    } else {
					options.errors.push('Could not delete Tileset ' + tileset.options.property.name);
				    }
				}
			    });
		    } else if (db.id) {
			//perform any deletes
			if (!update) update = RPG.Mysql.createQueue();
			update.queue('UPDATE tilesets ' +
			    'SET name = ?, category = ?,' +
			    'options = ? ' +
			    'WHERE userID = ? ' +
			    'AND tilesetID = ? ' ,
			    [
			    tileset.options.property.name,
			    tileset.options.property.category,
			    JSON.encode(tileset.options),
			    options.user.options.userID,
			    db.id
			    ],
			    function(err,info){
				if (err) {
				    options.errors.push(err);
				} else {
				    if (info.affectedRows) {
					tileset.options.database = db;
				    } else {
					options.errors.push('Could not update tileset item ' + tileset.options.property.name);
				    }
				}
			    });
		    }
		} else {
		    if (!insert) insert = RPG.Mysql.createQueue();
		    insert.queue('INSERT INTO tilesets ' +
			'SET userID = ?, ' +
			'name = ?, category = ?,' +
			'options = ?',
			[
			options.user.options.userID,
			tileset.options.property.name,
			tileset.options.property.category,
			JSON.encode(tileset.options),
			],
			function(err,info){
			    if (err) {
				options.errors.push(err);
			    } else {

				if (info && info.insertId) {
				    tileset.options.database = {
					id : info.insertId
				    }
				} else {
				    options.errors.push('Could not insert tileset item ' + tileset.options.property.name);
				}
			    }
			});


		}

		//now that everything is all queued up:
		RPG.Mysql.executeQueues([remove,update,insert],true,function(){
		    if (options.errors && options.errors.length > 0) {
			callback({
			    error : options.errors
			})
			return;
		    }
		    RPG.Tileset.storeCache(options,function(){
			if (options.errors && options.errors.length > 0) {
			    callback({
				error : options.errors
			    })
			    return;
			}

			RPG.Tileset.storeTiles(options,function(){
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

	    });
	});
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
	RPG.Mysql.query(
	    'SELECT tilesetID, category, ts.name, options, u.name as userName, '+
	    '   (SELECT count(1) FROM tilesettiles WHERE tilesetID = ts.tilesetID) as totalArea, ' +
	    '   (SELECT count(1) FROM tilesetscache WHERE tilesetID = ts.tilesetID) as totalObjects ' +
	    'FROM tilesets ts, user u ' +
	    'WHERE ts.userID = u.userID  '+
	    'ORDER BY category ASC, ts.name ASC',
	    [],
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
					id : result['tilesetID'],
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
     * required options:
     *
     * user
     * tilesetID
     * tilePoints = array of points [point,point,point] (point=[x,y])
     *
     *
     * Returns:
     * callback = returns an object which is mergable with a universe object.
     * return = {
     *	    tilesets : {
     *	     [name] : {
     *		    cache : {}
     *		    tiles : {}
     *		}
     *	    }
     * }
     */
    loadTiles : function(options,callback) {
	if (!options.tilePoints) {
	    callback({});
	    return;
	}
	var universe = {};

	var points = [];
	if  (options.tilePoints == 'all') {
	//allow 'all' to go through
	} else {
	    options.tilePoints.each(function(point){
		points.push(RPG.getPointSQL(point));
	    });
	    if (points.length > 0) {
		if (points.length == 1) {
		    //for some reason using 'in' does not work with a single point. so double up the point
		    points[1] = points[0];
		}
	    } else {
		callback({});
		return;
	    }
	}
	var sql = '';
	var args = [];

	sql = 'SELECT X(point) as x, Y(point) as y, tiles, t.name '+
	'FROM tilesettiles tt, tilesets t ' +
	'WHERE t.tilesetID = ? '+
	'AND t.userID = ? '+
	'AND tt.tilesetID = t.tilesetID '+
	'AND point in (' + points.join(',')+') ' +
	'ORDER BY point ASC';
	args = [
	options.tilesetID,
	options.user.options.userID
	];

	RPG.Mysql.query(sql,args,
	    function(err,tResults) {
		Object.erase(options,'tilePoints');
		if (err) {
		    callback({
			error: err
		    });
		    return;
		} else if (tResults && tResults[0]) {
		    if (!universe.tilesets) universe.tilesets = {};

		    var tiles = {};
		    var tCache = [];
		    var name = null;
		    tResults.each(function(tResult){
			name = tResult['name'];
			if (!tiles[tResult['x']]) {
			    tiles[tResult['x']] = {};
			}
			tiles[tResult['x']][tResult['y']] = JSON.decode(tResult['tiles'],true);
			tiles[tResult['x']][tResult['y']].each(function(tile){
			    tCache.push(JSON.encode(tile));//push this tilePath for cache lookup
			});
		    });
		    options.paths = tCache.unique();
		    RPG.Tileset.loadCache(options,function(cache) {
			if (cache.error) {
			    callback(cache);
			    return;
			}

			universe.tilesets[name] = {
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
	    }
	    );
    },
    /**
     * Insert the universes tilesets tiles into the database,
     * required options :
     * user
     * universe
     *
     * callback(options.universe || errors)
     */
    storeTiles : function(options,callback) {
	options.errors = options.errors || [];

	var remove = RPG.Mysql.createQueue();
	var insert = RPG.Mysql.createQueue();

	//go through all the tilesets in the universe
	Object.each(options.universe.tilesets,function(tileset,path,source){

	    //get this tileset database options
	    var db = Object.getFromPath(tileset,'options.database');
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

			//perform any deletes
			remove.queue('DELETE FROM tilesettiles ' +
			    'WHERE tilesetID = ? ' +
			    'AND point in ('+del.join(',')+') '+
			    'AND tilesetID in (SELECT tilesetID FROM tilesets WHERE userID = ?)',
			    [
			    db.id,
			    options.user.options.userID
			    ],
			    function(err,info) {
				if (err) {
				    options.errors.push(err);
				} else {

			    }
			    }
			    );
		    }
		}
	    }
	    //For each row of tiles remove existing ones from the database
	    Object.each(tileset.tiles,function(col,rowNum,source) {
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
		    //remove all the points specified in this column
		    remove.queue('DELETE FROM tilesettiles ' +
			'WHERE tilesetID = ? ' +
			'AND point in ('+del.join(',')+') '+
			'AND tilesetID in (SELECT tilesetID FROM tilesets WHERE userID = ?)',
			[
			db.id,
			options.user.options.userID
			],
			function(err,info) {
			    if (err) {
				options.errors.push(err);
			    } else {
			}
			});
		}

		//insert incoming tiles:
		var sql = 'INSERT INTO tilesettiles (tilesetID,point,tiles) VALUES ';
		var arr = [];
		Object.each(col, function(tiles,colNum) {
		    if (tiles && tiles != 'null') {
			colNum = Number.from(colNum);
			sql += '(?,GeomFromText(\'POINT('+rowNum+' '+colNum+')\'),?),'
			arr.push(db.id,JSON.encode(tiles));
		    }
		});
		sql = sql.substr(0,sql.length-1);
		if (arr && arr.length > 1) {
		    insert.queue(sql,arr,
			function(err,info) {
			    if (err) {
				options.errors.push(err);
			    }
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
     *	    paths : json encoded paths
     */
    loadCache : function(options,callback) {

	var paths = [];
	var pathSql = [];
	options.paths.each(function(path,index) {
	    pathSql.push("?");
	    paths.push(path);
	});
	Object.erase(options,'paths');
	if (paths.length > 0) {
	    if (paths.length == 1) {
		//for some reason using 'in' does not work with a single entry. so double up
		pathSql.push("?");
		paths[1] = paths[0];
	    }
	} else {
	    callback({});
	    return;
	}
	var sql = 'SELECT tilesetCacheID, t.tilesetID, path, tc.options '+
	'FROM tilesetscache tc, tilesets t ' +
	'WHERE tc.tilesetID = t.tilesetID '+
	'AND t.tilesetID = ? ' +
	'AND t.userID = ? ' +
	'AND path in ('+pathSql.join(',')+') ' +
	'ORDER BY folderName ASC';

	var arr = [
	options.tilesetID,
	options.user.options.userID,
	].append(paths)

	RPG.Mysql.query(sql,arr,
	    function(err,results) {
		if (err) {
		    callback({
			error : err
		    });
		} else if (results && results[0]) {
		    callback(RPG.expandResultsCache(results,'tilesetID'));
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
     */
    storeCache : function(options,callback) {
	options.errors = options.errors || [];

	var remove = null;
	var insert = null;
	var update = null;

	Object.each(options.universe.tilesets,function(tileset,name,source){
	    var flat = RPG.flattenCache(tileset.cache);
	    Object.each(flat,function(tileOpts,path,source){
		var db = tileOpts.database;
		Object.erase(tileOpts,'database');
		if (db && db.id) {

		    if (!Number.from(db.id)) {
			options.errors.push('The Tileset Cache ID for "'+ path+'" must be numeric.');
			db = null;
			return;
		    }

		    if (db.deleted) {
			if (!remove) remove = RPG.Mysql.createQueue();
			remove.queue('DELETE FROM tilesetscache ' +
			    'WHERE tilesetID = ? ' +
			    'AND tilesetCacheID = ? ',
			    Array.clone([tileset.options.database.id,db.id]),
			    function(err,results) {
				if (err) {
				    options.errors.push(err);
				} else {
				    if (results.affectedRows) {
					var pathName = (path = JSON.decode(path)).pop();
					Object.erase(Object.getFromPath(tileset.cache,path),pathName);
				    } else {
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
			update.queue('UPDATE tilesetTiles ' +
			    "SET tiles = PREG_REPLACE('/\\?/',?,tiles) " +
			    'WHERE tilesetID = ? ',
			    Array.clone([
				JSON.encode(oldPath),
				path,
				tileset.options.database.id
				]),
			    function(err,results) {
				if (err) {
				    options.errors.push(err);
				}
			    });
		    }

		    if (!update) update = RPG.Mysql.createQueue();
		    update.queue('UPDATE tilesetscache ' +
			'SET folderName = ?,' +
			'path = ?,' +
			'tileName = ?,' +
			'options = ? ' +
			'WHERE tilesetID = ? ' +
			'AND tilesetCacheID = ? ',
			Array.clone([
			    tileOpts.property.folderName,
			    path,
			    tileOpts.property.tileName,
			    JSON.encode(tileOpts),
			    tileset.options.database.id,
			    db.id
			    ]),
			function(err,results) {
			    if (err) {
				options.errors.push(err);
			    } else {
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
		    insert.queue('INSERT INTO tilesetscache ' +
			'SET tilesetID = ?,' +
			'path = ?,' +
			'folderName = ?,' +
			'tileName = ?,' +
			'options = ?',
			Array.clone([
			    tileset.options.database.id,
			    path,
			    tileOpts.property.folderName,
			    tileOpts.property.tileName,
			    JSON.encode(tileOpts)
			    ]),
			function(err,results) {
			    if (err) {
				options.errors.push(err);
			    } else {
				if (results.insertId) {
				    tileOpts.database = {
					tilesetCacheID : results.insertId
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