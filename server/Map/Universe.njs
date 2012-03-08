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
		RPG.Log('database hit','Loaded Universe: '+options.universeID);
		if (err) {
		    callback({
			error : err
		    });
		} else if (universeResults && universeResults[0]) {
		    var universe = {};
		    var universeResult = universeResults[0];

		    universe.options = Object.merge({
			database : {
			    universeID : universeResult['universeID']
			}
		    },JSON.decode(universeResult['options'],true));

		    if (!options.bypassCache) {
			require('../Cache.njs').Cache.store(options.user.options.userID,'universe_'+universeResult['universeID'],universe);
		    }

		    if (options.mapID || options.mapName) {
			RPG.Map.load(options,function(map){
			    if (map.error) {
				callback(map);
				return;
			    }
			    callback(Object.merge(universe,map));
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

	var db =  options.universe.options.database;
	Object.erase(options.universe.options,'database');//remove the database stuff from the incoming universe

	if (db && db.universeID) {
	    if (!Number.from(db.universeID)) {
		callback({
		    error : 'The universe ID must be numeric.'
		});
		db = null;
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
		    RPG.Log('database hit','Updated Universe: #'+db.universeID);
		    if (err) {
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
				    callback(universe);
				});
			    } else {
				callback(options.universe);
			    }
			    db = null;
			} else {
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
		    RPG.Log('database hit','Inserted Universe: '+info.insertId);
		    if (err) {
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
				    if (universe.error) {
				    //@todo delete failed universeF
				    }
				    callback(universe);
				});
			    } else {
				callback(options.universe);
			    }
			} else {
			    callback({
				error : 'Failed to get newly inserted universe ID :( '
			    });
			}
		    }
		}
		);
	}

    }

}))();