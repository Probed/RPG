var RPG = module.exports = {};

Object.merge(RPG,require('./Tile.njs'));


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
     * callback(universe || error) 'universe' object mergable with a universe  or error object
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
				//RPG.Log('database delete',options.mapOrTileset+' "'+ mapName +'" #'+db[options.mapOrTileset+'ID']+' deleted ');
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
				//RPG.Log('database update',options.mapOrTileset+' "'+ mapName +'" #'+db[options.mapOrTileset+'ID']+' updated.');
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
	    if (err && err.length > 0) {
		callback({
		    error : err
		});
	    } else {
		RPG.Tile.storeAllCaches(options, function(universe) {
		    var err = options.errors;
		    if (err && err.length > 0) {
			callback({
			    error : err
			});
		    } else {
			RPG.Tile.storeTiles(options, function(universe) {
			    var err = options.errors;
			    if (err && err.length > 0) {
				callback({
				    error : err
				});
			    } else {
				callback(universe);
			    }
			});
		    }
		});
	    }
	});
	mapChain.callChain(); //start storeing all the maps.
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