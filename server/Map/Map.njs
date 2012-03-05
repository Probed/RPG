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
     * userID
     * mapID or mapName
     * universeID
     *
     * optional:
     * tilePoints
     *
     * Returns :
     * callback(map) 'map' object mergable with a universe eg: {maps:{mapName:{...}}
     */
    loadMap : function(options,callback) {
	RPG.Log('database hit','Loading Map: '+ (options.mapID || options.mapName));
	require('../Database/mysql.njs').mysql.query(
	    'SELECT mapID, mapName, m.options '+
	    'FROM maps m, universes un ' +
	    'WHERE m.universeID = ? '+
	    'AND m.map'+(options.mapID?'ID':'Name')+' = ? ' +
	    'AND un.userID = ?'
	    ,[
	    options.universeID,
	    options['map'+(options.mapID?'ID':'Name')],
	    options.userID
	    ],
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
		    universe.maps[mapResult['mapName']] = {
			tiles : {},
			cache : {},
			options : Object.merge({
			    settings : {},
			    database : {
				mapID : mapResult['mapID']
			    }
			},
			JSON.decode(mapResult['options'],true)
			    )
		    };
		    if (options.tilePoints) {
			RPG.Tile.loadTiles(options,function(tiles){
			    if (tiles.error) {
				callback(tiles);
				return;
			    }
			    callback(universe,tiles);

			});
		    } else {
			callback(universe);
		    }

		} else {
		    callback({});
		}
	    });
    }

}))();