/*
 * #MapEditore page
 */
var RPG = module.exports = {};
Object.merge(RPG,
    require('./Universe.njs'),
    require('./Tileset.njs'),
    require('../../common/Game/universe.js'),
    require('../../common/Game/Generators/Utilities.js'),
    require('../../common/Game/Tiles/Utilities.js')
    );

RPG.MapEditor =  new (RPG.MapEditorClass = new Class({

    onRequest : function(request,response) {

	//	if (!request.user.isLoggedIn) {
	//	    response.onRequestComplete(response,{
	//		error : 'Must be <b>logged in</b> to use the Map Editor'
	//	    });
	//	}

	/**
	 * Determine what is being asked for and route accordingly
	 */
	switch (request.url.query.m) {

	    case 'save' :
		this.saveUniverse(request,response);
		break;

	    case 'saveTileset' :
		this.saveTileset(request,response);
		break;

	    case 'listTilesets' :
		RPG.Tileset.listTilesets({},function(tilesets){
		    response.onRequestComplete(response, tilesets);
		});
		break;

	    case 'openTileset' :
		this.openTileset(request, response);
		break;

	    case 'listUserUniverses' :
		RPG.Universe.list({
		    user : request.user
		},function(universes){
		    response.onRequestComplete(response, universes);
		});
		break;


	    case 'openUniverse' :
		this.openUniverse(request,response);
		break;

	    case 'loadTiles' :
		this.loadTiles(request,response);
		break;


	    case 'checkDupeTilesetName' :
		RPG.Tileset.checkDupeTilesetName({
		    user : request.user,
		    name  : request.url.query.name,
		    category : request.url.query.category,
		    tilesetID : Number.from(request.url.query.tilesetID) || 0
		}, function(dupeName){
		    if (dupeName) {
			response.onRequestComplete(response, dupeName);
		    } else {
			response.onRequestComplete(response, {
			    success : 'The tileset name <b>'+request.url.query.name+'</b> is available.'
			});
		    }
		});
		break;

	    case 'checkDupeUniverseName' :
		RPG.Universe.checkDupeName({
		    user : request.user,
		    universeID  : request.url.query.universeID,
		    universeName : request.url.query.universeName
		}, function(dupeName){
		    if (dupeName) {
			response.onRequestComplete(response, dupeName);
		    } else {
			response.onRequestComplete(response, {
			    success : 'The universe name <b>'+request.url.query.universeName+'</b> is available.'
			});
		    }
		});
		break;
	}
    },

    saveUniverse : function(request,response) {
	if (request.method == 'POST') {
	    if (!request.dataReceived) {
		request.on('end',function(){
		    this.saveUniverse(request,response);//call again now that we have all the data
		}.bind(this));
	    } else {
		var uni = JSON.decode(request.data,true);
		var errors = RPG.Constraints.validate(uni,RPG.universe_options);
		if (errors.length > 0) {
		    response.onRequestComplete(response,{
			error : errors
		    });
		    return;
		}
		this.checkDupeName({
		    user : request.user,
		    universe : uni
		},function(dupeName){
		    if (dupeName) {
			callback(dupeName);
			return;
		    }
		    //Store the universe in the database:
		    RPG.Universe.store({
			user : request.user,
			universe : uni
		    },function(universe){
			//remove all tiles since the clinet should have these already
			Object.each(universe.maps,function(map,mapName){
			    Object.erase(map,'tiles');
			});
			response.onRequestComplete(response,universe);
		    });
		});
	    }
	} else {
	    response.onRequestComplete(response,{
		error : 'MapEditor Universe save must use POST.'
	    });
	}
    },

    openUniverse : function(request,response) {
	if (!request.dataReceived) {
	    request.on('end',function(){
		this.openUniverse(request,response);//call again now that we have all the data
	    }.bind(this));
	    return;
	}

	var options = JSON.decode(request.data,true);
	RPG.Universe.load({
	    user : request.user,
	    universe : 'none',
	    universeID : options.universeID,
	    tilePoints : RPG.getRectangleArea(options.start,options.end).area
	},function(universe){
	    if (universe.error) {
		response.onRequestComplete(response,universe);
		return;
	    }
	    RPG.Map.listMaps({
		user : request.user,
		universe : universe
	    },function(maplist) {
		if (maplist.error) {
		    response.onRequestComplete(response,maplist);
		    return;
		}
		Object.merge(universe.maps,maplist);
		response.onRequestComplete(response,{
		    universe : universe
		});
	    })
	});

    },

    loadTiles : function(request,response) {

	if (!request.dataReceived) {
	    //if not all the data has arrived yet, wait for it then call self again.
	    request.on('end',function(){
		this.loadTiles(request,response);
	    }.bind(this));
	    return;
	}

	var options = {
	    user : request.user,
	    mapID : Number.from(request.url.query.mapID) || 0,
	    universeID : request.url.query.universeID,
	    tilePoints : []
	};

	var tileLookup = JSON.decode(request.data,true);
	Object.erase(request,'data');

	var minRow = Number.from(request.url.query.minRow) || 0;
	var maxRow = Number.from(request.url.query.maxRow) || 0;
	var minCol = Number.from(request.url.query.minCol) || 0;
	var maxCol = Number.from(request.url.query.maxCol) || 0;

	tileLookup.each(function(point){
	    if (!point || typeOf(point) != 'array') return;

	    point[0] = Number.from(point[0]);
	    point[1] = Number.from(point[1]);

	    if (point[0] >= minRow && point[0] <= maxRow && point[1] >= minCol && point[1] <= maxCol) {
		options.tilePoints.push(point);
	    }
	});

	RPG.Map.loadMap(options, function(universe){
	    if (universe.error) {
		response.onRequestComplete(response,{
		    error : universe.error
		});
		return;
	    }
	    response.onRequestComplete(response,{
		universe : universe
	    });
	});
    },

    saveTileset : function(request,response) {
	if (request.method == 'POST') {
	    if (!request.dataReceived) {
		request.on('end',function(){
		    this.saveTileset(request,response);
		}.bind(this));
	    } else {
		var tileset = JSON.decode(request.data);
		var errors = RPG.Constraints.validate(tileset,RPG.tileset_options);
		if (errors.length > 0) {
		    response.onRequestComplete(response,{
			error : errors
		    });
		    return;
		}
		var uni = {
		    tilesets : {}
		};
		uni.tilesets[tileset.options.property.name] = tileset;

		RPG.Tileset.storeTileset({
		    user : request.user,
		    universe : uni
		}, function(universe){
		    if (universe.error) {
			response.onRequestComplete(response,{
			    error : universe.error
			});
			return;
		    }

		    response.onRequestComplete(response,{
			options : universe.tilesets[tileset.options.property.name].options,
			cache : universe.tilesets[tileset.options.property.name].cache
		    });
		});
	    }
	} else {
	    response.onRequestComplete(response,{
		error : 'MapEditor Save Tileset must use POST.'
	    });
	}
    },


    openTileset : function(request,response) {

	var options = {
	    user : request.user,
	    tilesetID : Number.from(request.url.query.tilesetID),
	    tilePoints : 'all'
	};

	RPG.Tileset.loadTileset(options,function(tilesetUniverse){
	    if (tilesetUniverse.error) {
		response.onRequestComplete(response,{
		    error : tilesetUniverse.error
		});
		return;
	    }
	    response.onRequestComplete(response,tilesetUniverse.maps[Object.keys(tilesetUniverse.maps)[0]]);
	});
    }
}))();