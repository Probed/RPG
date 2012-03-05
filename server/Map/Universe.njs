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
     * userID
     * character || universeID or universeName
     *
     * optional:
     * character || mapID || mapName
     * tilePoints
     *
     * Returns :
     * callback(universe)
     */
    loadUniverse : function(options,callback) {
	if (options.character) {
	    options.mapID = options.character.location.mapID;
	    options.universeID = options.character.location.universeID;
	    var universe = require('../Cache.njs').Cache.retrieve(options.userID,'universe_'+options.character.location.universeID);
	    if (universe) {
		RPG.Log('cached','Universe: '+options.character.location.universeID);
		callback(universe);
		return;
	    } else {
		RPG.Log('database hit','Universe: '+options.character.location.universeID);
	    }
	} else {
	    RPG.Log('database hit','Loading Universe: '+options.universeID);
	}

	require('../Database/mysql.njs').mysql.query(
	    'SELECT universeID, universeName, options '+
	    'FROM  universes un ' +
	    'WHERE universe'+(options.universeID?'ID':'Name')+' = ? ' +
	    'AND userID = ?'
	    ,[
	    options['universe'+(options.universeID?'ID':'Name')],
	    options.userID
	    ],
	    function(err,universeResults) {
		if (err) {
		    callback({
			error : err
		    });
		} else if (universeResults && universeResults[0]) {
		    var universe = {};
		    var universeResult = universeResults[0];

		    universe.options = Object.merge(
		    {
			database : {
			    universeID : universeResult['universeID']
			}
		    },
		    JSON.decode(universeResult['options'],true)
			);


		    require('../Cache.njs').Cache.store(options.userID,'universe_'+universeResult['universeID'],universe);

		    if (options.mapID || options.mapName) {
			RPG.Map.loadMap(options,function(map){
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
			error : 'The universe '+ (options.universeID || options.universeName) +' could not be found for user: '+options.userID+'.'
		    });
		}
	    });
    }

}))();