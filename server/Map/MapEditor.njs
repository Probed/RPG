/*
 * #MapEditore page
 */
var RPG = module.exports = {};
Object.merge(RPG,
    require('../../common/Map/universe.js'),
    require('../../common/Map/Generators/Utilities.js'),
    require("../pages/pageBase.njs")
    );

RPG.MapEditor =  new (RPG.MapEditorClass = new Class({
    Extends : RPG.PageBaseClass,
    options : {},
    initialize : function(options) {
	this.parent(options);

	//Client Received Page Contents:
	this.page = {
	    title : 'Map Editor',
	    populates : 'pnlMainContent',
	    requires : {
		'css' : ['/client/mochaui/themes/charcoal/css/Map/MapEditor.css','/client/mochaui/themes/charcoal/css/Map/Tile.css'],
		'js' : [
		'/client/Map/MapEditor.js',
		'/common/Map/Tiles/Tiles.js',
		'/common/Map/universe.js',
		'/common/Map/Generators/Words.js',
		'/common/optionConfig.js',
		'/common/Random.js',
		'/common/Map/Generators/Generators.js',
		'/common/Map/Generators/Utilities.js',
		'/common/Map/Tiles/Utilities.js',
		],
		exports :'MapEditor'
	    },
	    pageContents : '',
	    options : {}
	};

	var constraints = this.buildTileConstraints(['./common','Map','Tiles']);
	var str = '/*This File is Generated in /server/Map/MapEditor.njs*/if (!RPG) var RPG = {};RPG.Tiles=';
	str += JSON.encode(constraints);
	str += ';if (typeof exports != "undefined") {module.exports = RPG;}';
	require('fs').writeFileSync('./common/Map/Tiles/Tiles.js',str,'utf8');
	Object.merge(RPG,{
	    Tiles : constraints
	});

	//only after we have created RPG.Tiles can we merge in the Utilities which requires RPG.Tiles
	Object.merge(RPG,require('../../common/Map/Tiles/Utilities.js'));
	constraints = null;
    },

    /**
     * buildTileConstraints Here we recursivly traverse the /common/Map/Tiles  directory and build up the RPG.Tiles object
     * Each folder can have an options.js file which will be imported and merged into the tile to give the tile it's unique abilities.
     * option.js files will reference TileTypes.js for the different types available
     *
     */
    buildTileConstraints : function(dir,constraints) {
	if (!constraints) constraints = {};

	var folders = require('fs').readdirSync(dir.join('/'));

	if (require('path').existsSync(dir.join('/')+'/options.js')) {
	    constraints.options = require('../.'+dir.join('/')+'/options.js').options;
	}
	folders.each(function(name){
	    if (name == 'options.js') return;
	    var stat = require('fs').statSync(dir.join('/')+'/'+name);
	    if (stat.isFile() && /bmp|gif|png|jpg$/i.test(name)) {
		if (!constraints.options) constraints.options = {};
		if (!constraints.options.property) constraints.options.property = {};
		if (!constraints.options.property.image) constraints.options.property.image = {};
		if (!constraints.options.property.image.name) constraints.options.property.image.name = [];
		constraints.options.property.image.name.push(name);

	    } else if (stat.isDirectory()) {
		constraints[name] = {};
		dir.push(name);
		this.buildTileConstraints(dir,constraints[name]);
		dir.pop();
	    }

	}.bind(this));
	return constraints;
    },

    onRequest : function(request,response) {

	//	if (!request.user.isLoggedIn) {
	//	    response.onRequestComplete(response,{
	//		error : 'Must be <b>logged in</b> to use the Map Editor'
	//	    });
	//	}

	/**
	 * Determine what is being asked for and route accordingly
	 * by default the MapEditor 'page' is give to the user which begins the MapEditing
	 */
	switch (request.url.query.m) {

	    case 'save' :
		this.saveUniverse(request,response);
		break;

	    case 'saveTileset' :
		this.saveTileset(request,response);
		break;

	    case 'listTilesets' :
		this.listTilesets(request, response);
		break;

	    case 'openTileset' :
		this.openTileset(request, response);
		break;

	    case 'checkDupeTilesetName' :
		this.checkDupeTilesetName(request.url.query.category, request.url.query.name, request.url.query.tilesetID || 0, function(dupeName) {
		    if (dupeName) {
			response.onRequestComplete(response, dupeName);
		    } else {
			response.onRequestComplete(response, {
			    success : 'The tileset name <b>'+request.url.query.universeName+'</b> is available.'
			});
		    }
		}.bind(this));
		break;

	    case 'checkDupeUniverseName' :
		this.checkDupeUniverseName(request.user.options.userID, request.url.query.universeName, request.url.query.universeID || 0, function(dupeName) {
		    if (dupeName) {
			response.onRequestComplete(response, dupeName);
		    } else {
			response.onRequestComplete(response, {
			    success : 'The universe name <b>'+request.url.query.universeName+'</b> is available.'
			});
		    }
		}.bind(this));
		break;

	    case 'listUserUniverses' :
		this.listUserUniverses(request, response);
		break;


	    case 'openUserUniverse' :
		this.openUserUniverse(request,response);
		break;

	    case 'loadTiles' :
		this.loadTiles(request,response);
		break;


	    default :
		response.onRequestComplete(response,this._onRequest(request,this.page));
		break;
	}
    },

    saveUniverse : function(request,response) {
	if (request.method == 'POST') {
	    if (!request.dataReceived) {
		//console.log('Monitoring POST data...');
		request.on('end',function(){
		    //console.log('Data Received: '+(request.data.length/1024)+'kb'+String.fromCharCode(13));
		    this.beginUserUniverseSave(request,response);
		}.bind(this));
	    } else {
		//console.log('Data Available: '+(request.data.length/1024)+'kb'+String.fromCharCode(13));
		this.beginUserUniverseSave(request,response);
	    }
	} else {
	    response.onRequestComplete(response,{
		error : 'MapEditor Save must use POST.'
	    });
	}
    },

    beginUserUniverseSave : function(request,response) {
	if (this.checkUserUniverseSaving(request.user)) {
	    response.onRequestComplete(response, {
		error : 'Please wait for the current universe to finish saving.'
	    });
	    return;
	}

	request.user.savingUniverse = true;
	request.user.savingUniverseTimeout = setTimeout(function(){
	    this.endUserUniverseSave(request,response,{
		error : 'Request Timed Out :( '+ request.user.saveUniverseCounter
	    });
	}.bind(this),3000000);

	this.storeUniverse(request,response);
    },

    checkUserUniverseSaving : function(user) {
	return user.savingUniverse || false;
    },

    endUserUniverseSave : function(request, response, errors) {

	clearTimeout(request.user.savingUniverseTimeout);

	Object.erase(request.user,'savingUniverse');
	Object.erase(request.user,'savingUniverseTimeout');
	Object.erase(request.user,'saveUniverseObj');
	Object.erase(request.user,'saveUniverseErrors');
	Object.erase(request.user,'saveUniverseCounter');

	if (errors) {
	    if (errors && errors.error) {
		response.onRequestComplete(response,errors);
	    } else {
		response.onRequestComplete(response, {
		    error : errors
		});
	    }
	} else {
	    response.onRequestComplete(response,request.user.saveUniverseReturn);
	}
    },

    /**
     * Called upon each successful insert to see if it was the last to finish
     */
    checkInsertUniverseComplete : function(request,response) {
	if (request.user.saveUniverseCounter == 0) {
	    this.endUserUniverseSave(request,response,request.user.saveUniverseErrors && request.user.saveUniverseErrors.length > 0?request.user.saveUniverseErrors:null);
	}
    },

    storeUniverse : function(request,response) {
	var universeName = request.url.query.universeName;

	if (universeName) {

	    /**
	     * Store the incoming universe into the user object
	     */
	    request.user.saveUniverseObj = typeOf(request.data) == 'string'?JSON.decode(request.data,true):request.data;
	    Object.erase(request,'data');//clear the request object of the incoming universe



	    /**
	     * Validate Universe
	     */
	    //@todo validate universe


	    /**
	     * Insert/Update Universe
	     */
	    this.checkDupeUniverseName(request.user.options.userID, request.user.saveUniverseObj.options.property.universeName, (request.user.saveUniverseObj.options.database && request.user.saveUniverseObj.options.database.universeID?request.user.saveUniverseObj.options.database.universeID:0), function(dupeName) {
		if (dupeName) {
		    this.endUserUniverseSave(request,response, dupeName);
		} else {
		    this.insertUniverse(request.user.options.userID, request.user.saveUniverseObj, function(universeID){
			if (typeOf(universeID) != 'number') {
			    this.endUserUniverseSave(request,response, universeID);

			} else {
			    request.user.saveUniverseErrors = [];
			    request.user.saveUniverseCounter = 0; //counts up when a query is made, counts down when the query finishes

			    if (!request.user.saveUniverseObj.maps || (request.user.saveUniverseObj.maps && request.user.saveUniverseObj.maps.length < 1)) {
//				this.endUserUniverseSave(request,response, {
//				    error : 'This universe currently has no maps.<br>Please add a map before saving.'
//				});
//				return;
			    }

			    request.user.saveUniverseReturn = {
				options : Object.merge({
				    database : {
					universeID : universeID,
					created : Date('now'),
					updated : Date('now')
				    }
				},
				request.user.saveUniverseObj.options),
				maps : {}
			    };

			    /**
			     * Loop through all maps:
			     */
			    Object.each(request.user.saveUniverseObj.maps,function(map,mapName){

				/**
				 * Insert Map
				 * Increment our counter
				 */
				request.user.saveUniverseCounter++;
				var mapDBOptions = map.options.database; //map.options.database gets removed upon update/insert so save it here for use later
				this.insertMap('map',universeID,mapName,null,null,map.options,function(mapID){

				    /**
				     * insert map finihsed. decrease counter
				     */
				    request.user.saveUniverseCounter--;
				    if (typeOf(mapID) != 'number') {
					request.user.saveUniverseErrors.push(mapID);
					return;
				    }
				    request.user.saveUniverseReturn.maps[mapName] = {
					options : {
					    database : {
						mapID : mapID
					    }
					}
				    };


				    /**
				     * insert/update all this maps cache objects
				     */
				    map.cache && Object.each(map.cache,function(folder,folderName){
					this.insertMapCache('map',request,folder,mapID,folderName,[],mapName,function(mapCacheID){

					    /**
					     * insert/update cache finihsed. decrease counter
					     */
					    request.user.saveUniverseCounter--;
					    if (typeOf(mapCacheID) != 'number') {
						request.user.saveUniverseErrors.push(mapCacheID);
					    }
					    this.checkInsertUniverseComplete(request,response);
					}.bind(this));
				    }.bind(this));

				    /**
				     * Insert All the maps Tiles row by row
				     */
				    map.tiles && Object.each(map.tiles,function(cols,rowNum){
					this.insertMapTiles('map',mapDBOptions, request, mapID, cols, rowNum, function(tileID){
					    request.user.saveUniverseCounter--;
					    if (typeOf(tileID) != 'number') {
						request.user.saveUniverseErrors.push(tileID);
					    }
					    this.checkInsertUniverseComplete(request,response);
					}.bind(this));//end insert map.tiles insert
				    }.bind(this));//end object.each map.tiles

				}.bind(this));//end insert map

			    }.bind(this));//end object.each maps
			    this.checkInsertUniverseComplete(request,response);
			}
		    }.bind(this));//end universe insert
		}
	    }.bind(this));//end dupeUniverseName check

	} else {
	    this.endUserUniverseSave(request,response, {
		error : 'Could not determine universeName.'
	    });
	    return;
	}
    },

    /**
     * Checks for Duplicate Display Names
     */
    checkDupeUniverseName : function(userID,universeName,universeID,callback) {
	require('../Database/mysql.njs').mysql.query(
	    'SELECT un.universeName ' +
	    'FROM universes un ' +
	    'WHERE un.universeName = ? ' +
	    'AND un.userID = ? ' +
	    'AND un.universeID <> ? '
	    ,
	    [
	    universeName,
	    userID,
	    Number.from(universeID) // exclude current universe in dupe name search if update is being performed.
	    ],
	    function(err,results) {
		if (err) {
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0] && results[0]['universeName']) {
			callback({
			    error : 'You have a Universe named <b>"'+results[0]['universeName']+'"(id:'+Number.from(universeID)+')</b> already.<br>Please choose another name.'
			});
		    } else {
			callback(null);
		    }
		}
	    }
	    );
    },

    /**
     * Insert the universe into the database,
     * callsback with the inserted id
     */
    insertUniverse : function(userID,universe,callback) {
	var db =  universe.options.database;
	Object.erase(universe.options,'database');//remove the database stuff from the incoming universe

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
		universe.options.property.universeName,
		JSON.encode(universe.options),
		db.universeID,
		userID
		],
		function(err,info) {
		    if (err) {
			callback({
			    error : err
			});
		    } else {
			if (info.affectedRows) {
			    callback(Number.from(db.universeID));
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
		universe.options.property.universeName,
		JSON.encode(universe.options),
		userID
		],
		function(err,info) {
		    if (err) {
			callback({
			    error : err
			});
		    } else {
			if (info.insertId) {
			    callback(info.insertId);
			} else {
			    callback({
				error : 'Failed to get newly inserted universe ID :( '
			    });
			}
		    }
		}
		);
	}
    },


    /**
     * Insert the universes maps or tileset into the database,
     * callsback with the inserted id
     */
    insertMap : function(mapOrTileset, universeID, name,category, userID, options,callback) {
	var db =  options.database;
	Object.erase(options,'database');//remove the database stuff from the incoming options

	if (db && db[mapOrTileset+'ID']) {
	    /**
	     * Update
	     */
	    if (!Number.from(db[mapOrTileset+'ID'])) {
		callback({
		    error : 'The '+mapOrTileset+' ID for "'+ name +'" must be numeric.'
		});
		db = null;
		return;
	    }
	    if (db.deleted) {
		/**
		 * Remove if requested.
		 * this will cause the mapCache and mapTiles to be removed also
		 */
		require('../Database/mysql.njs').mysql.query(
		    'DELETE FROM '+mapOrTileset+'s ' +
		    'WHERE '+(mapOrTileset=='map'?'universeID':'userID')+' = ? ' +
		    'AND '+mapOrTileset+'ID = ? ',
		    [universeID,
		    db[mapOrTileset+'ID'],
		    ],
		    function(err,info) {
			if (err) {
			    callback({
				error : err
			    });
			} else {
			    if (info.affectedRows) {
				callback(Number.from(db[mapOrTileset+'ID']));
			    } else {
				callback({
				    error : 'Could not delete '+mapOrTileset+' "'+ name +'" :('
				});
			    }
			}
		    }
		    );
	    } else {
		require('../Database/mysql.njs').mysql.query(
		    'UPDATE '+mapOrTileset+'s ' +
		    'SET '+(mapOrTileset=='map'?'mapName':'name = ?, category')+' = ?,' +
		    'options = ? ' +
		    'WHERE '+(mapOrTileset=='map'?'universeID':'userID')+' = ? ' +
		    'AND '+mapOrTileset+'ID = ? ' ,
		    [
		    name,
		    (mapOrTileset=='map'?null:category),
		    JSON.encode(options),
		    (mapOrTileset=='map'?universeID:userID),
		    db[mapOrTileset+'ID'],
		    ].clean(),
		    function(err,info) {
			if (err) {
			    callback({
				error : err
			    });
			} else {
			    if (info.affectedRows) {
				callback(Number.from(db.mapID));
			    } else {
				callback({
				    error : 'Failed to get updated '+mapOrTileset+' ID for "'+ name +'":( '
				});
			    }
			}
		    }
		    );
	    }

	} else {
	    /**
	     * Insert
	     */
	    require('../Database/mysql.njs').mysql.query(
		'INSERT INTO '+mapOrTileset+'s ' +
		'SET '+(mapOrTileset=='map'?'universeID':'userID')+' = ?, ' +
		(mapOrTileset=='map'?'mapName':'name = ?, category')+' = ?,' +
		'options = ?',
		[
		(mapOrTileset=='map'?universeID:userID),,
		name,
		(mapOrTileset=='map'?null:category),
		JSON.encode(options)
		].clean(),
		function(err,info) {
		    if (err) {
			callback({
			    error : err
			});
		    } else {
			if (info.insertId) {
			    callback(info.insertId);
			} else {
			    callback({
				error : 'Failed to get newly inserted '+mapOrTileset+' ID for "'+ name +'" :( '
			    });
			}
		    }
		}
		);
	}
    },

    /**
     * Insert the maps tile cache into the database,
     * recursivly traverses the map cache path (eg { terrain : { earth : { solid : { dirt : { dirt1 : {options}}}}}
     * until it finds the options
     *
     * translates the and stores the path as an array ['terrain','earth',etc]
     *
     */
    insertMapCache : function(mapOrTileset, request,folder,mapOrTilesetID,pathName,path,mapName,callback) {
	path.push(pathName);
	if (folder && folder.options) {
	    if (mapOrTileset == 'map') {
		request.user.saveUniverseCounter++;
	    } else if (mapOrTileset == 'tileset') {
		request.user.saveTilesetCounter++;
	    }

	    var db =  folder.options.database;
	    Object.erase(folder.options,'database');//remove the database stuff from the incoming options

	    if (db && db[mapOrTileset+'CacheID']) {
		/**
		 * Update
		 */
		if (!Number.from(db[mapOrTileset+'CacheID'])) {
		    callback({
			error : 'The Cache ID for "'+ path.join('.')+'" must be numeric.'
		    });
		    db = null;
		    return;
		}
		if (db.deleted) {
		    /**
		     * Remove if requested.
		     */
		    require('../Database/mysql.njs').mysql.query(
			'DELETE FROM '+mapOrTileset+'scache ' +
			'WHERE '+mapOrTileset+'ID = ? ' +
			'AND '+mapOrTileset+'CacheID = ? ',
			[mapOrTilesetID,
			db[mapOrTileset+'CacheID']
			],
			function(err,info) {
			    if (err) {
				callback({
				    error : err
				});
			    } else {
				if (info.affectedRows) {
				    callback(Number.from(db[mapOrTileset+'CacheID']));
				} else {
				    callback({
					error : 'Could not delete mapCache item "'+ path.join('.')+'" :('
				    });
				}
			    }
			}
			);
		} else {
		    if (db.renamed || db.moved) {
			/**
			 * When a mapCache object is renamed we need to find all the tiles that use the old name, and replace them
			 * or the object is moved to a different folder
			 */
			var oldPath = Array.clone(path)
			if (db.renamed) {
			    oldPath[oldPath.length-1] = db.renamed;
			}
			if (db.moved) {
			    oldPath[0] = db.moved;
			}
			if (mapOrTileset == 'map') {
			    request.user.saveUniverseCounter++;
			} else if (mapOrTileset == 'tileset') {
			    request.user.saveTilesetCounter++;
			}
			require('../Database/mysql.njs').mysql.query(
			    'UPDATE '+mapOrTileset+'Tiles ' +
			    "SET tiles = PREG_REPLACE('/\\?/',?,tiles) " +
			    'WHERE '+mapOrTileset+'ID = ? ',
			    [
			    JSON.encode(oldPath),
			    JSON.encode(path),
			    mapOrTilesetID
			    ],
			    function(err,info) {
				if (err) {
				    callback({
					error : err
				    });
				} else {
				    if (info.affectedRows) {
					callback(Number.from(db[mapOrTileset+'CacheID']));
				    } else {
					callback({
					    error : 'Error renaming/moving Cache item "'+ path.join('.')+'" :('
					});
				    }
				}
			    }
			    );
		    }
		    require('../Database/mysql.njs').mysql.query(
			'UPDATE '+mapOrTileset+'scache ' +
			'SET folderName = ?,' +
			'path = ?,' +
			'tileName = ?,' +
			'options = ? ' +
			'WHERE '+mapOrTileset+'ID = ? ' +
			'AND '+mapOrTileset+'CacheID = ? ',
			[
			folder.options.property.folderName,
			JSON.encode(path),
			folder.options.property.tileName,
			JSON.encode(folder.options),
			mapOrTilesetID,
			db[mapOrTileset+'CacheID']
			],
			function(err,info) {
			    if (err) {
				callback({
				    error : err
				});
			    } else {
				if (info.affectedRows) {
				    callback(Number.from(db[mapOrTileset+'CacheID']));
				} else {
				    callback({
					error : 'Could not update Cache item "'+ path.join('.')+'" :('
				    });
				}
			    }
			}
			);
		}
	    } else {
		/**
		 * Insert
		 */
		var pathClone = Array.clone(path);
		require('../Database/mysql.njs').mysql.query(
		    'INSERT INTO '+mapOrTileset+'scache ' +
		    'SET '+mapOrTileset+'ID = ?,' +
		    'folderName = ?,' +
		    'path = ?,' +
		    'tileName = ?,' +
		    'options = ?',
		    [
		    mapOrTilesetID,
		    folder.options.property.folderName,
		    JSON.encode(path),
		    folder.options.property.tileName,
		    JSON.encode(folder.options)
		    ],
		    function(err,info) {
			if (err) {
			    callback({
				error : err
			    });
			} else {
			    if (info.insertId) {
				callback(info.insertId);
				var obj = null;
				if (mapOrTileset == 'map') {
				    if (!request.user.saveUniverseReturn.maps[mapName]) {
					request.user.saveUniverseReturn.maps[mapName] = {};
				    }
				    if (!request.user.saveUniverseReturn.maps[mapName].cache) {
					request.user.saveUniverseReturn.maps[mapName].cache = {};
				    }
				    obj = request.user.saveUniverseReturn.maps[mapName].cache;
				} else if (mapOrTileset == 'tileset') {
				    obj = request.user.saveTilesetReturn.cache;
				}
				pathClone.each(function(p){
				    if (!obj[p]) {
					obj[p] = {};
				    }
				    obj = obj[p];
				});
				obj.options = {
				    database : {}
				};
				obj.options.database[mapOrTileset+'CacheID'] = info.insertId;
				pathClone = null;
			    } else {
				callback({
				    error : 'Failed to get newly inserted Cache ID :( '+JSON.encode(folder)
				});
			    }
			}
		    }
		    );

	    }
	} else {
	    Object.each(folder,function(f,fn){
		this.insertMapCache(mapOrTileset, request,f,mapOrTilesetID,fn,path,mapName,callback);
	    }.bind(this));
	}
	path.pop();
    },

    /**
     * Insert the maps tiles into the database,
     * callsback with the inserted id
     */
    insertMapTiles : function(mapOrTileset, mapDBOptions, request,mapOrTilesetID, cols,rowNum,callback) {

	if (mapDBOptions && mapDBOptions.mapID) {
	    var del = '';
	    /**
	     * Once only we will go through the tileDelete from the mapsDBOptions and remove the requested tiles.
	     * Once that is complete, this function will be called again to perform the next stuff
	     */
	    if (mapDBOptions && mapDBOptions.tileDelete) {
		del = '(';

		mapDBOptions.tileDelete.each(function(point){
		    if (!point || typeOf(point) != 'string') return;
		    del += RPG.getPointSQL(point.split(',')) + ',';
		});
		if (del.length > 1) {
		    del = del.substr(0,del.length-3) + ')';
		    require('../Database/mysql.njs').mysql.query(
			'DELETE FROM '+mapOrTileset+'tiles WHERE '+mapOrTileset+'ID = ? AND point in '+del,
			[mapOrTilesetID],
			function(err,info) {
			    if (err) {
				callback({
				    error : err
				});
			    } else {
				this.insertMapTiles(mapOrTileset,mapDBOptions,request,mapOrTilesetID,cols,rowNum,callback);
			    }
			}.bind(this));
		}
		Object.erase(mapDBOptions,'tileDelete');//erasing this will make sure this code is not executed again.

		return;//exit the function and wait for db operation to complete.
	    }

	    /**
	     * Existing Map, delete incoming tiles from database to be replaced by the new ones being sent in
	     * once the delete is complete, this function gets called again to do the insert
	     */
	    del = 'DELETE FROM '+mapOrTileset+'tiles WHERE mapID = ? AND X(point) = ? AND (';
	    Object.each(cols, function(tiles,colNum) {
		del += 'Y(point)='+colNum+' OR ';
	    });
	    del = del.substr(0,del.length-3) + ')';
	    require('../Database/mysql.njs').mysql.query(del,[mapOrTilesetID, rowNum],
		function(err,info) {
		    if (err) {
			callback({
			    error : err
			});
		    } else {
			this.insertMapTiles(mapOrTileset,null,request,mapOrTilesetID,cols,rowNum,callback);
		    }
		}.bind(this));
	    return;//exit the function and wait for db operation to complete.
	}


	var sql = 'INSERT INTO '+mapOrTileset+'tiles ('+mapOrTileset+'ID,point,tiles) VALUES ';
	var arr = [];
	Object.each(cols, function(tiles,colNum) {
	    if (tiles && tiles != 'null') {
		sql += '(?,GeomFromText(\'POINT('+Number.from(rowNum) + ' ' + Number.from(colNum)+')\'),?),'
		arr.push(mapOrTilesetID,JSON.encode(tiles));
	    }
	}.bind(this));
	sql = sql.substr(0,sql.length-1);
	if (arr && arr.length < 1) return;

	if (mapOrTileset == 'map') {
	    request.user.saveUniverseCounter++;
	} else if (mapOrTileset == 'tileset') {
	    request.user.saveTilesetCounter++;
	}
	require('../Database/mysql.njs').mysql.query(sql,arr,
	    function(err,info) {
		if (err) {
		    callback({
			error : err
		    });
		} else {
		    if (info.insertId) {
			callback(info.insertId);
		    } else {
			callback({
			    error : 'Failed to get newly inserted '+mapOrTileset+' Tiles :( '
			});
		    }
		}
	    }
	    );
    },

    getUserUniverse : function(userID, universeID, callback) {
	require('../Database/mysql.njs').mysql.query(
	    'SELECT universeID, universeName, options, created, updated '+
	    'FROM universes un ' +
	    'WHERE un.userID = ? '+
	    'AND un.universeID = ? '
	    ,
	    [
	    userID,
	    universeID
	    ],
	    function(err,results) {
		if (err) {
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0]) {
			var result = results[0]
			var universe = {
			    options : Object.merge({
				database : {
				    universeID : result['universeID'],
				    created : result['created'],
				    updated : result['updated']
				}
			    },
			    JSON.decode(result['options'],true)
				)
			};
			callback(universe);

		    } else {
			callback({
			    error : 'Universe '+universeID+' not found for user '+userID+'.'
			});
		    }
		}
	    }
	    );
    },

    listUserUniverses : function(request,response) {
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
	    request.user.options.userID
	    ],
	    function(err,results) {
		if (err) {
		    response.onRequestComplete(response,{
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
					userName : request.user.options.name,
					totalArea : result['totalArea'],
					totalObjects : result['totalObjects'],
					totalMaps : result['totalMaps']
				    }
				},
				JSON.decode(result['options'],true)
				    )
			    };
			});

			response.onRequestComplete(response,universes);

		    } else {
			response.onRequestComplete(response,{
			    error : 'No universes found.'
			});
		    }
		}
	    }
	    );
    },

    openUserUniverse : function(request,response) {
	var errors = [];
	if (!Number.from(request.url.query.universeID)) {
	    errors.push('Invalid tniverseID supplied: '+request.url.query.universeID);
	}

	if (!Number.from(request.url.query.rows)) {
	    errors.push('Invalid rows parameter supplied: '+request.url.query.cols);
	}
	if (!Number.from(request.url.query.cols)) {
	    errors.push('Invalid cols parameter supplied: '+request.url.query.rows);
	}

	if (this.checkUserUniverseOpening(request.user)) {
	    errors.push('Open Universe currently in progress.<br>Please try again after the current universe is finished loading.');
	}

	if (errors && errors.length > 0) {
	    response.onRequestComplete(response,{
		error : errors
	    });
	    return;
	}

	this.beginUserUniverseOpen(request,response);


	require('../Database/mysql.njs').mysql.query(
	    'SELECT un.universeID, un.options '+
	    'FROM universes un ' +
	    'WHERE un.universeID = ? AND un.userID = ? '+
	    'ORDER BY un.updated DESC'
	    ,
	    [
	    request.url.query.universeID,
	    request.user.options.userID
	    ],
	    function(err,uniResults) {
		if (err) {
		    response.onRequestComplete(response,{
			error : err
		    });
		} else {
		    if (uniResults && uniResults[0]) {
			var uniOptions = JSON.decode(uniResults[0]['options'],true) || {};
			var maps = {};
			request.user.openUniverseCounter++;
			require('../Database/mysql.njs').mysql.query(
			    'SELECT mapID, universeID, mapName, options '+
			    'FROM maps m ' +
			    'WHERE m.universeID = ? '+
			    'ORDER BY m.mapName ASC'
			    ,[request.url.query.universeID],
			    function(err,mapResults) {
				if (mapResults && mapResults[0]) {
				    mapResults.each(function(mapResult){


					maps[mapResult['mapName']] = {
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

					/**
				 * Attach the tile cache to the current map:
				 */
					request.user.openUniverseCounter++;
					require('../Database/mysql.njs').mysql.query(
					    'SELECT mapCacheID, mapID, path, options '+
					    'FROM mapscache mc ' +
					    'WHERE mc.mapID = ? '+
					    'ORDER BY folderName ASC'
					    ,[mapResult['mapID']],
					    function(err,mcResults) {
						if (mcResults && mcResults[0]) {
						    //go through each map cache result:
						    mcResults.each(function(mcResult){

							//translate the path into an object path. (from array to obj.arr1.arr2.arrN)
							var path = JSON.decode(mcResult['path'],true);
							var obj = maps[mapResult['mapName']].cache;
							path.each(function(p){
							    if (!obj[p]) {
								obj[p] = {};
							    }
							    obj = obj[p];
							});

							//merge the options, with this id so it can be updated.
							obj.options = Object.merge({
							    database : {
								mapCacheID : mcResult['mapCacheID']
							    }
							},
							JSON.decode(mcResult['options'])
							    );

							path = null;
							obj = null;
						    });
						}
						request.user.openUniverseCounter--;
						this.checkOpenUniverseComplete(request,response,maps);
					    }.bind(this)
					    );


					/**
				 * Find upper/lower limits of rows/cols
				 */
					request.user.openUniverseCounter++;
					require('../Database/mysql.njs').mysql.query(
					    'SELECT min(X(point)) as minRow, max(X(point)) as maxRow, min(Y(point)) as minCol, max(Y(point)) as maxCol '+
					    'FROM maptiles mt ' +
					    'WHERE mt.mapID = ? '
					    ,[mapResult['mapID']],
					    function(err,lResults) {
						if (lResults && lResults[0]) {
						    Object.merge(maps[mapResult['mapName']].options.database,lResults[0]);
						}
						request.user.openUniverseCounter--;
						this.checkOpenUniverseComplete(request,response,maps);
					    }.bind(this)
					    );
				    }.bind(this));
				}
				request.user.openUniverseCounter--;
			    }.bind(this)
			    );

		    } else {
			response.onRequestComplete(response,{
			    error : 'Requested universe could not be found. ID:' + request.url.query.universeID
			});
		    }
		}
	    }.bind(this)
	    );

    },



    beginUserUniverseOpen : function(request,response) {
	request.user.openUniverseCounter = 0;
	request.user.openingUniverse = true;
	request.user.openingUniverseTimeout = setTimeout(function(){
	    this.endUserUniverseOpen(request,response,{
		error : 'Request Timed Out :( '+ request.user.openUniverseCounter
	    });
	}.bind(this),30000);
    },

    checkUserUniverseOpening : function(user) {
	return user.openingUniverse || false;
    },

    /**
     * Called upon each successful insert to see if it was the last to finish
     */
    checkOpenUniverseComplete : function(request,response,results) {
	if (request.user.openUniverseCounter == 0) {
	    this.endUserUniverseOpen(request,response,results);
	}
    },

    endUserUniverseOpen : function(request, response, results) {

	clearTimeout(request.user.openingUniverseTimeout);

	Object.erase(request.user,'openingUniverse');
	Object.erase(request.user,'openingUniverseTimeout');
	Object.erase(request.user,'openUniverseCounter');

	if (results) {
	    response.onRequestComplete(response,results);
	} else {
	    response.onRequestComplete(response, {
		error : 'No results retruned from open universe request. :('
	    });
	}
    },

    loadTiles : function(request,response) {

	if (!request.dataReceived) {
	    //if not all the data has arrived yet, wait for it then call self again.
	    request.on('end',function(){
		this.loadTiles(request,response);
	    }.bind(this));
	    return;
	}

	var errors = [];

	if (!Number.from(request.url.query.mapID)) {
	    errors.push('Invalid mapID provided: '+request.url.query.mapID);
	}

	var tileLookup = JSON.decode(request.data,true);
	Object.erase(request,'data');

	var minRow = Number.from(request.url.query.minRow);
	var maxRow = Number.from(request.url.query.maxRow);
	var minCol = Number.from(request.url.query.minCol);
	var maxCol = Number.from(request.url.query.maxCol);

	var sql = '(';
	tileLookup.each(function(point){
	    if (!point || typeOf(point) != 'array') return;

	    point[0] = Number.from(point[0]);
	    point[1] = Number.from(point[1]);

	    if (point[0] >= minRow && point[0] <= maxRow && point[1] >= minCol && point[1] <= maxCol) {
		sql += RPG.getPointSQL(point) + ',';
	    }
	});
	if (sql.length > 1) {
	    sql = sql.substr(0,sql.length-1);
	    sql += ')'
	} else {
	    errors.push('No tiles to lookup.');
	}

	if (errors && errors.length > 0) {
	    response.onRequestComplete(response,{
		error : errors
	    });
	    return;
	}

	require('../Database/mysql.njs').mysql.query(
	    'SELECT X(point) as x, Y(point) as y, tiles '+
	    'FROM maptiles mt, maps m, universes un ' +
	    'WHERE mt.mapID = ? AND un.userID = ? '+
	    'AND mt.mapID = m.mapID AND m.universeID = un.universeID '+
	    'AND point in '+sql +' '+
	    'ORDER BY point ASC'
	    ,[
	    request.url.query.mapID,
	    request.user.options.userID
	    ],

	    function(err,mtResults) {
		if (err) {
		    response.onRequestComplete(response,err);

		} else if (mtResults && mtResults[0]) {
		    //go through each map cache result:
		    var tiles = {};
		    mtResults.each(function(mtResult){
			if (!tiles[mtResult['x']]) {
			    tiles[mtResult['x']] = {};
			}
			tiles[mtResult['x']][mtResult['y']] = JSON.decode(mtResult['tiles'],true);
		    });
		    response.onRequestComplete(response,tiles);
		    tiles = null;
		} else {
		    response.onRequestComplete(response,{
			error : 'Could not locate any of the requested tiles.'
		    });
		}
		tileLookup = null;
	    }.bind(this)
	    );
	sql = null;
    },



    beginUserTilesetSave : function(request,response) {
	request.user.saveTilesetCounter = 0;
	request.user.savingTileset = true;
	request.user.savingTilesetTimeout = setTimeout(function(){
	    this.endUserTilesetSave(request,response,{
		error : 'Request Timed Out :( '+ request.user.saveTilesetCounter
	    });
	}.bind(this),30000);

	this.storeTileset(request,response);
    },

    checkUserTilesetSaving : function(user) {
	return user.savingTileset || false;
    },

    /**
     * Called upon each successful insert to see if it was the last to finish
     */
    checkUserTilesetSaved : function(request,response) {
	if (request.user.saveTilesetCounter == 0) {
	    this.endUserTilesetSave(request,response);
	}
    },

    endUserTilesetSave : function(request, response) {
	var results = null;
	clearTimeout(request.user.savingTilesetTimeout);
	if (request.user.saveTilesetErrors && request.user.saveTilesetErrors.length > 0) {
	    results = {
		error : request.user.saveTilesetErrors
	    };
	} else {
	    results = request.user.saveTilesetReturn;
	}

	Object.erase(request.user,'savingTileset');
	Object.erase(request.user,'savingTilesetTimeout');
	Object.erase(request.user,'saveTilesetReturn');
	Object.erase(request.user,'saveTilesetCounter');
	Object.erase(request.user,'saveTilesetErrors');
	Object.erase(request.user,'saveTilesetObj');

	if (results) {
	    response.onRequestComplete(response,results);
	} else {
	    response.onRequestComplete(response, {
		error : 'No results retruned from save tileset request. :('
	    });
	}
    },

    saveTileset : function(request,response) {
	if (request.method == 'POST') {
	    if (!request.dataReceived) {
		request.on('end',function(){
		    this.beginUserTilesetSave(request,response);
		}.bind(this));
	    } else {
		this.beginUserTilesetSave(request,response);
	    }
	} else {
	    response.onRequestComplete(response,{
		error : 'MapEditor Save Tileset must use POST.'
	    });
	}
    },

    storeTileset : function(request,response) {
	/**
	 * Store the incoming tileset into the user object
	 */
	request.user.saveTilesetObj = JSON.decode(request.data,true);
	Object.erase(request,'data');//clear the request object of the incoming universe



	/**
	 * Validate the Tileset
	 */
	//@todo validate tileset


	/**
	 * Insert/Update Tileset
	 */
	this.checkDupeTilesetName(request.user.saveTilesetObj.options.property.category,request.user.saveTilesetObj.options.property.name, (request.user.saveTilesetObj.options.database && request.user.saveTilesetObj.options.database.tilesetID?request.user.saveTilesetObj.options.database.tilesetID:0),function(dupeName) {
	    if (dupeName) {
		this.endUserTilesetSave(request,response, dupeName);
	    } else {

		request.user.saveTilesetErrors = [];
		request.user.saveTilesetCounter = 0;
		request.user.saveTilesetReturn = {
		    options : {
			database : {}
		    },
		    cache : {}
		};

		request.user.saveTilesetCounter++;
		var mapDBOptions = request.user.saveTilesetObj.options.database; //map.options.database gets removed upon update/insert so save it here for use later
		this.insertMap('tileset', null,
		    request.user.saveTilesetObj.options.property.name,
		    request.user.saveTilesetObj.options.property.category,
		    request.user.options.userID,
		    request.user.saveTilesetObj.options,
		    function(tilesetID){
			/**
		     * Check insert success:
		     */
			request.user.saveTilesetCounter--;
			if (typeOf(tilesetID) != 'number') {
			    request.user.saveTilesetErrors.push(tilesetID);
			    return;
			}
			request.user.saveTilesetReturn.options.database.tilesetID = tilesetID;
			/**
		     * insert/update all this maps cache objects
		     */
			request.user.saveTilesetObj.cache && Object.each(request.user.saveTilesetObj.cache,function(folder,folderName){
			    this.insertMapCache('tileset',request,folder,tilesetID,folderName,[],null,function(mapCacheID){
				/**
			     * insert/update cache finihsed. decrease counter
			     */
				request.user.saveTilesetCounter--;
				if (typeOf(mapCacheID) != 'number') {
				    request.user.saveTilesetErrors.push(mapCacheID);
				}
				this.checkUserTilesetSaved(request,response);
			    }.bind(this));
			}.bind(this));

			/**
		     * Insert All the maps Tiles
		     */
			request.user.saveTilesetObj.tiles && Object.each(request.user.saveTilesetObj.tiles,function(cols,rowNum){
			    this.insertMapTiles('tileset',mapDBOptions, request, tilesetID, cols, rowNum, function(tileID){
				request.user.saveTilesetCounter--;
				if (typeOf(tileID) != 'number') {
				    request.user.saveTilesetErrors.push(tileID);
				}
				this.checkUserTilesetSaved(request,response);
			    }.bind(this));//end insert map.tiles insert
			}.bind(this));//end object.each map.tiles

			this.checkUserTilesetSaved(request,response);
		    }.bind(this));
	    }
	}.bind(this));
    },

    /**
     * Checks for Duplicate Display Names
     */
    checkDupeTilesetName : function(category,name,tilesetID,callback) {
	require('../Database/mysql.njs').mysql.query(
	    'SELECT name ' +
	    'FROM tilesets ' +
	    'WHERE name = ? ' +
	    'AND category = ? ' +
	    'AND tilesetID <> ? ',
	    [
	    name,
	    category,
	    Number.from(tilesetID) // exclude current tilesetid in dupe name search if update is being performed.
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


    listTilesets : function(request,response,callback) {
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
		    response.onRequestComplete(response,{
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

			response.onRequestComplete(response,tilesets);

		    } else {
			response.onRequestComplete(response,{
			    error : 'No Tilesets found.'
			});
		    }
		}
	    }
	    );
    },

    openTileset : function(request,response) {
	if (!Number.from(request.url.query.tilesetID)) {
	    response.onRequestComplete(response,{
		error : 'Invalid tileset ID provided: '+request.url.query.tilesetID
	    });
	    return;
	}

	require('../Database/mysql.njs').mysql.query(
	    'SELECT tilesetID, category, name, options, '+
	    ' (SELECT min(row) FROM tilesetTiles WHERE tilesetID = ts.tilesetID) as minRow, ' +
	    ' (SELECT max(row) FROM tilesetTiles WHERE tilesetID = ts.tilesetID) as maxRow, '+
	    ' (SELECT min(col) FROM tilesetTiles WHERE tilesetID = ts.tilesetID) as minCol, '+
	    ' (SELECT max(col) FROM tilesetTiles WHERE tilesetID = ts.tilesetID) as maxCol '+
	    'FROM tilesets ts ' +
	    'WHERE ts.tilesetID = ? '
	    ,
	    [
	    Number.from(request.url.query.tilesetID)
	    ],
	    function(err,results) {
		if (err) {
		    response.onRequestComplete(response,{
			error : err
		    });
		} else {
		    if (results && results[0]) {
			request.user.openTileset = {
			    options : Object.merge({
				database : {
				    tilesetID : results[0]['tilesetID'],
				    minRow :results[0]['minRow'],
				    maxRow :results[0]['maxRow'],
				    minCol :results[0]['minCol'],
				    maxCol :results[0]['maxCol']
				}
			    },JSON.decode(results[0]['options'])),
			    cache : {},
			    tiles : {}
			};
			request.user.openTilesetCounter = 0;
			request.user.openTilesetErrors = [];

			/**
		     * Attach the tile cache to the current tileset:
		     */
			request.user.openTilesetCounter++;
			require('../Database/mysql.njs').mysql.query(
			    'SELECT tilesetCacheID, tilesetID, path, options '+
			    'FROM tilesetscache tsc ' +
			    'WHERE tsc.tilesetID = ? '+
			    'ORDER BY folderName ASC'
			    ,[Number.from(request.url.query.tilesetID)],
			    function(err,tscResults) {
				if (err) {
				    request.user.openTilesetErrors.push(err);
				} else {
				    if (tscResults && tscResults[0]) {
					//go through each map cache result:
					tscResults.each(function(tscResult){

					    //translate the path into an object path. (from array to obj.arr1.arr2.arrN)
					    var path = JSON.decode(tscResult['path'],true);
					    var obj = request.user.openTileset.cache;
					    path.each(function(p){
						if (!obj[p]) {
						    obj[p] = {};
						}
						obj = obj[p];
					    });

					    //merge the options, with this id so it can be updated.
					    obj.options = Object.merge({
						database : {
						    tilesetCacheID : tscResult['tilesetCacheID']
						}
					    },
					    JSON.decode(tscResult['options'])
						);

					    path = null;
					    obj = null;
					});
				    }
				}
				request.user.openTilesetCounter--;
				this.checkOpenTilesetComplete(request,response);
			    }.bind(this)
			    );

			/**
		     * Load tileset Tiles
		     */
			request.user.openTilesetCounter++;
			require('../Database/mysql.njs').mysql.query(
			    'SELECT row, col, tiles '+
			    'FROM tilesettiles tst ' +
			    'WHERE tst.tilesetID = ? '+
			    'ORDER BY row ASC, col ASC'
			    ,[
			    Number.from(request.url.query.tilesetID)
			    ],
			    function(err,tstResults) {
				if (err) {
				    request.user.openTilesetErrors.push(err);
				} else {
				    if (tstResults && tstResults[0]) {
					//go through each map cache result:
					tstResults.each(function(tstResult){
					    if (!request.user.openTileset.tiles[tstResult['row']]) {
						request.user.openTileset.tiles[tstResult['row']] = {};
					    }
					    request.user.openTileset.tiles[tstResult['row']][tstResult['col']] = JSON.decode(tstResult['tiles'],true);
					});
				    }
				}
				request.user.openTilesetCounter--;
				this.checkOpenTilesetComplete(request,response);
			    }.bind(this)
			    );

		    } else {
			response.onRequestComplete(response,{
			    error : 'Specified tileset ID could not be found: '+request.url.query.tilesetID
			});
		    }
		}
	    }.bind(this)
	    );
    },

    checkOpenTilesetComplete : function(request,response) {
	if (request.user.openTilesetCounter == 0) {
	    this.endOpenTileset(request,response);
	}
    },

    endOpenTileset : function(request, response) {
	var results = null;

	if (request.user.saveTilesetErrors && request.user.saveTilesetErrors.length > 0) {
	    results = {
		error : request.user.openTilesetErrors
	    };
	} else {
	    results = request.user.openTileset;
	}

	Object.erase(request.user,'openTileset');
	Object.erase(request.user,'openTilesetCounter');
	Object.erase(request.user,'openTilesetErrors');

	if (results) {
	    response.onRequestComplete(response,results);
	} else {
	    response.onRequestComplete(response, {
		error : 'No results retruned from open tileset request. :('
	    });
	}
    }
}))();