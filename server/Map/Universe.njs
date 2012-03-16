var RPG = module.exports = {};
Object.merge(RPG,
    require('./Map.njs')
    );


RPG.Universe = new (RPG.UniverseClass = new Class({
    Implements : [Events,Options],
    options : {},
    initialize : function(options) {
	this.setOptions(options)
    },

    /**
     * required options:
     * user
     * character || universeID || universeName
     *
     * optional:
     * character || mapID || mapName
     * tilePoints
     * bypassCache
     *
     * Returns :
     * callback(universe)
     */
    load : function(options,callback) {

	//check to see if we should attempt to load the universe specified by the characters current location
	if (!options.bypassCache && options.character) {
	    options.mapID = options.character.location.mapID;
	    options.universeID = options.character.location.universeID;
	    var universe = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'universe_'+options.character.location.universeID);
	    if (universe) {
		//RPG.Log('cached','Universe: '+options.character.location.universeID);
		callback(universe);
		return;
	    }
	}

	if (!Number.from(options.universeID)) {
	    callback({
		error : 'universeID must be numeric'
	    });
	    return;
	}

	require('../Database/mysql.njs').mysql.query(
	    'SELECT universeID, universeName, options '+
	    'FROM  universes un ' +
	    'WHERE universe'+(options.universeID?'ID':'Name')+' = ? ' +
	    'AND userID = ?'
	    ,[
	    options['universe'+(options.universeID?'ID':'Name')],
	    options.user.options.userID
	    ],
	    function(err,universeResults) {
		if (err) {
		    callback({
			error : err
		    });
		} else if (universeResults && universeResults[0]) {
		    var universe = {};
		    var universeResult = universeResults[0];
		    RPG.Log('database hit','Loaded Universe: '+universeResult['universeName']+' (#'+universeResult['universeID']+')');

		    universe.options = Object.merge({
			database : {
			    universeID : universeResult['universeID']
			}
		    },JSON.decode(universeResult['options'],true));

		    if (!options.bypassCache) {
			require('../Cache.njs').Cache.store(options.user.options.userID,'universe_'+universeResult['universeID'],universe);
		    }
		    if (!options.mapID && !options.mapName && options.tilePoints) {
			options.mapName = universe.options.settings.activeMap;
		    }
		    if (options.mapID || options.mapName) {
			RPG.Map.load(options,function(mapUni){
			    if (mapUni.error) {
				callback(mapUni);
				return;
			    }
			    callback(Object.merge(universe,mapUni));
			});
		    } else {
			callback(universe);
		    }
		} else {
		    callback({
			error : 'The universe '+ (options.universeID || options.universeName) +' could not be found for user: '+options.user.options.userID+'.'
		    });
		}
		Object.erase(options,'universeID');
		Object.erase(options,'userID');
	    });
    },

    /**
     * Insert the universe into the database,
     * options :
     * user
     * universe
     *
     * optional:
     * bypassCache
     *
     * callsback(universe || error)
     */
    store : function(options,callback) {
	if (options.user.storingUniverse) {
	    callback({
		error : 'Please allow the current Universe to finish saving.'
	    });
	    return;
	}
	options.user.storingUniverse = true;
	//check dupe name:
	if (this.checkDupeName(options,function(dupeName){
	    if (dupeName) {
		options.user.storingUniverse = false;
		callback(dupeName);
		return;
	    }

	    //Check for update or insert
	    var db =  options.universe.options.database;
	    Object.erase(options.universe.options,'database');//remove the database stuff from the incoming universe

	    if (db && db.universeID) {
		if (!Number.from(db.universeID)) {
		    callback({
			error : 'The universe ID must be numeric.'
		    });
		    db = null;
		    options.user.storingUniverse = false;
		    return;
		}
		/**
		 * Update
		 */
		require('../Database/mysql.njs').mysql.query(
		    'UPDATE universes ' +
		    'SET universeName = ?, ' +
		    'options = ? ' +
		    'WHERE universeID = ? ' +
		    'AND userID = ? ',
		    [
		    options.universe.options.property.universeName,
		    JSON.encode(options.universe.options),
		    db.universeID,
		    options.user.options.userID
		    ],
		    function(err,info) {
			RPG.Log('database hit','Updated Universe: '+options.universe.options.property.universeName+' (#' +db.universeID+')');
			if (err) {
			    options.user.storingUniverse = false;
			    callback({
				error : err
			    });
			} else {
			    if (info.affectedRows) {
				options.universe.options.database = db;
				if (!options.bypassCache) {
				    require('../Cache.njs').Cache.store(options.user.options.userID,'universe_'+db.universeID,options.universe);
				}
				if (options.universe.maps) {
				    RPG.Map.store(options, function(universe) {
					options.user.storingUniverse = false;
					callback(universe);
				    });
				} else {
				    options.user.storingUniverse = false;
				    callback(options.universe);
				}
				db = null;
			    } else {
				options.user.storingUniverse = false;
				callback({
				    error : 'Could not locate the universe specified'
				});
			    }
			}
		    }
		    );

	    } else {
		/**
		 * Insert
		 */
		require('../Database/mysql.njs').mysql.query(
		    'INSERT INTO universes ' +
		    'SET universeName = ?, ' +
		    'options = ?,' +
		    'created = NOW(),' +
		    'userID = ?',
		    [
		    options.universe.options.property.universeName,
		    JSON.encode(options.universe.options),
		    options.user.options.userID
		    ],
		    function(err,info) {
			RPG.Log('database hit','Inserted Universe: '+options.universe.options.property.universeName+' (#'+info.insertId+')');
			if (err) {
			    options.user.storingUniverse = false;
			    callback({
				error : err
			    });
			} else {
			    if (info.insertId) {
				options.universe.options = Object.merge({
				    database : {
					universeID : info.insertId
				    }
				},options.universe.options);
				if (!options.bypassCache) {
				    require('../Cache.njs').Cache.store(options.user.options.userID,'universe_'+info.insertId,options.universe);
				}
				if (options.universe.maps) {
				    RPG.Map.store(options, function(universe) {
					options.user.storingUniverse = false;
					callback(universe);
				    });
				} else {
				    options.user.storingUniverse = false;
				    callback(options.universe);
				}
			    } else {
				options.user.storingUniverse = false;
				callback({
				    error : 'Failed to get newly inserted universe ID :( '
				});
			    }
			}
		    }
		    );
	    }
	}));
    },

    /*
     * Check to see if there is a universe by that name already. Ignores universeID if provided so an update can be performed
     * required options:
     * user
     * universe || universeName
     *
     * optional options
     * universe || universeID
     * tilePoints
     *
     * return
     * callback(dupeName || null if ok)
     */
    checkDupeName : function(options,callback) {
	var uID = options.universeID || 0;
	var uName = options.universeName || '';
	if (options.universe) {
	    uID = options.universe.options.database && options.universe.options.database.universeID || 0;
	    uName = options.universe.options.property.universeName;
	}

	require('../Database/mysql.njs').mysql.query(
	    'SELECT un.universeName ' +
	    'FROM universes un ' +
	    'WHERE un.universeName = ? ' +
	    'AND un.userID = ? ' +
	    'AND un.universeID <> ? '
	    ,
	    [
	    uName,
	    options.user.options.userID,
	    Number.from(uID)//ignore universeID for updates
	    ],
	    function(err,results) {
		RPG.Log('database hit','Universe.checkDupeName '+uName);
		if (err) {
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0] && results[0]['universeName']) {
			callback({
			    error : 'You have a Universe named <b>"'+results[0]['universeName']+'"</b> already.<br>Please choose another name.'
			});
		    } else {
			//name is available
			callback(null);
		    }
		}
	    }
	    );
    },

    /**
     * List available user universes
     * requied options:
     * user
     *
     * retuns
     * callback(universes || error)
     *
     */
    list : function(options, callback) {
	require('../Database/mysql.njs').mysql.query(
	    'SELECT universeID, universeName, options, created, updated, '+
	    '   (SELECT count(1) FROM maptiles WHERE mapID in (SELECT mapID FROM maps WHERE universeID = un.universeID)) as totalArea, ' +
	    '   (SELECT count(1) FROM mapscache WHERE mapID in (SELECT mapID FROM maps WHERE universeID = un.universeID)) as totalObjects, ' +
	    '   (SELECT count(1) FROM maps WHERE universeID = un.universeID) as totalMaps ' +
	    'FROM universes un ' +
	    'WHERE un.userID = ? '+
	    'ORDER BY un.updated DESC'
	    ,
	    [
	    options.user.options.userID
	    ],
	    function(err,results) {
		if (err) {
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0]) {
			var universes = {};

			results.each(function(result){
			    universes[result['universeName']] = {
				options : Object.merge({
				    database : {
					universeID : result['universeID'],
					created : result['created'],
					updated : result['updated'],
					userName : options.user.options.name,
					totalArea : result['totalArea'],
					totalObjects : result['totalObjects'],
					totalMaps : result['totalMaps']
				    }
				},
				JSON.decode(result['options'],true)
				    )
			    };
			});

			callback(universes);

		    } else {
			callback({
			    error : 'No universes found.'
			});
		    }
		}
	    }
	    );
    }
}))();