var RPG = module.exports = {};
Object.merge(RPG,
    require('../Log/Log.njs'),
    require('../Game/Inventory.njs'),
    require('../../common/Game/Generators/Equipment.js'),
    require('../../common/Constraints.js'),
    require('../../common/Character/Character.js'),
    require('../../common/Character/CharacterSlots.js')
    );

var logger = RPG.Log.getLogger('RPG.Character');

RPG.Character = new (RPG.CharacterClass = new Class({

    initialize : function(options) {
	logger.info('Initialized');
    },

    /**
     * Character names are server wide and duplicates are not allowed.
     * required options :
     *    character
     *    user
     *
     * callback(error || null) (null == not a dupe)
     */
    checkDupeName : function(options, callback) {
	if (!RPG.Constraints.requiredOptions(options,['character','user'],logger,callback)){
	    return;
	}

	RPG.Mysql.query(
	    'SELECT name ' +
	    'FROM characters ' +
	    'WHERE name = ? ' +
	    'AND characterID <> ? ',
	    [
	    options.character.name,
	    (options.character.database && Number.from(options.character.database.characterID)) || 0 // exclude current characterID in dupe name search if update is being performed.
	    ],
	    function(err,results) {
		if (err) {
		    options.user.logger.error('Duplicate Character Name Error %s',JSON.encode(err));
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0] && results[0]['name']) {
			var str = 'Character name "%s" has been taken. Please choose another.';
			options.user.logger.info(str,results[0]['name']);
			callback({
			    error : str.replace('%s','<b>'+results[0]['name']+'</b>')
			});
		    } else {
			options.user.logger.info('Character Name Available: %s',Object.getFromPath(options,'character.name'));
			callback(null);
		    }
		}
	    }
	    );
    },

    /**
     * Required options:
     * user
     * character
     *
     * callback(character || error)
     */
    create : function(options,callback) {
	if (!RPG.Constraints.requiredOptions(options,['character','user'],logger,callback)){
	    return;
	}

	options.character = typeOf(options.character) == 'string'?JSON.decode(options.character):typeOf(options.character) == 'object'?options.character:{};

	//set stuff the user isn't allowed to set. calculated later.
	options.character.level = 1;
	options.character.xp = 0;
	options.character.hp = {
	    max : 1,
	    cur : 1
	};
	options.character.mana = {
	    max : 1,
	    cur : 1
	};
	options.character.lives = {
	    max : 1,
	    cur : 1
	};

	Object.erase(options.character,'RightGrowthLeg');
	Object.erase(options.character,'LeftGrowthLeg');
	Object.erase(options.character,'RightGrowthArm');
	Object.erase(options.character,'LeftGrowthArm');
	Object.erase(options.character,'GrowthHead');

//	options.character.RightGrowthLeg = true;
//	options.character.LeftGrowthLeg = true;
//	options.character.RightGrowthArm = true;
//	options.character.LeftGrowthArm = true;
//	options.character.GrowthHead = true;

	//validate the incoming character
	var errors = [];
	errors = RPG.Constraints.validate(options.character,RPG.character_options);

	var total = 0;
	var base = 0;
	var val = null;
	var min = null;

	options.character.Stats && Object.each(RPG.Stats, function(stats,name){
	    val = Number.from(options.character.Stats[name].value);
	    min =RPG.applyModifiers(options.character,stats.value,'Character.Stats.start.'+name);
	    base += min;
	    total += val;
	    if (!val) {
		errors.push('A value for <b>'+name + '</b> must be provided.');
	    }else if (val < min) {
		errors.push(name + ' for a ' + options.character.Class + ' is a <b>minimum of ' + min+'</b>')
	    }
	}.bind(this));

	var distributable = RPG.applyModifiers(options.character,0,'Character.Stats.distribute');
	if ((total - base) != distributable) {
	    errors.push('Please distribute the <b>' + (distributable - (total - base)) +'</b> remainig stat(s)');
	}
	min = null;

	if (errors && errors.length > 0) {
	    options.user.logger.error('Character Create error: '+ errors);
	    callback({
		error : errors
	    });
	    return;
	}

	options.character.hp = {
	    max : RPG.calcMaxHP(options.character),
	    cur : RPG.calcMaxHP(options.character)
	};
	options.character.mana = {
	    max : RPG.calcMaxMana(options.character),
	    cur : RPG.calcMaxMana(options.character)
	};
	options.character.lives = {
	    max : RPG.applyModifiers(options.character,0,'Character.lives'),//Infinity values are JSON encoded as null. be aware
	    cur : RPG.applyModifiers(options.character,0,'Character.lives') //Infinity values are JSON encoded as null. be aware
	};

	this.checkDupeName(options,function(dupeName) {
	    if (dupeName) {
		callback(dupeName);
		return;
	    }

	    this.store(options,function(storedCharacter){
		if (storedCharacter && storedCharacter.error) {
		    callback(storedCharacter);
		    return;
		}
		var equipCache = {};
		var equipTiles = {};
		//Create an inventory for this character
		RPG.Inventory.storeInventory({
		    user : options.user,
		    character : storedCharacter,
		    inventory : {
			character : {//a characters inventory
			    options : {//options for the character inventory
				property : {
				    name : 'character', //needs a name that is the same as above
				    maxRows : 11, //max number of slots
				    maxCols : 7 //max number of slots
				}
			    }
			},
			equipment : {
			    options : {//options for the character equipment
				property : {
				    name : 'equipment',
				    slots : (function(){
					var slots = [];
					Object.each(RPG.CharacterSlots,function(slot,name){
					    //filter out growth slots that are not a part of the character yet
					    if (!/Growth/.test(name) || (/Growth/.test(name) && storedCharacter[slot.partOf])) {
						var point = [slot.row,slot.col];
						slots.push(point);

					    //create some initial equipment
					    //if (/Head/.test(name)) {
					    //						var generated = RPG.Generator.Equipment.generate({
					    //						    properties : {
					    //							name : 'InitEquip',
					    //							seed : (Math.random() * (99999999999 - 1) + 1),
					    //							Difficulty : storedCharacter.Difficulty,
					    //							type : 'item.earth.equip.'+slot.itemTypes[0],
					    //							level : 1,
					    //							point : point,
					    //							identified : false
					    //						    }
					    //						});
					    //						Object.merge(equipCache,generated.cache);
					    //						Object.merge(equipTiles,generated.tiles);
					    //}
					    }

					});
					return slots
				    }())
				}
			    },
			    cache : equipCache,
			    tiles : equipTiles
			}
		    }
		},function(storedInventory) {
		    if (storedInventory && storedInventory.error) {
			callback(storedInventory);
			return;
		    }
		    callback(storedCharacter);
		});

	    });
	}.bind(this));
    },

    /**
     * Insert/Update a character in the database. (update occures when the character has a character.database.characterID present
     * required options :
     * user
     * chaacter
     *
     * callback(character || error)
     */
    store : function(options,callback) {
	if (!RPG.Constraints.requiredOptions(options,['character','user'],logger,callback)){
	    return;
	}

	var db =  options.character.database;
	Object.erase(options.character,'database');//remove the database stuff from the incoming character

	if (db && db.characterID) {
	    if (!Number.from(db.characterID)) {
		options.user.logger.error('The character ID must be numeric.');
		callback({
		    error : 'The character ID must be numeric.'
		});
		db = null;
		return;
	    }
	    /**
	     * Update
	     */
	    RPG.Mysql.query(
		'UPDATE characters ' +
		'SET name = ?, ' +
		'options = ? ' +
		'WHERE characterID = ? ' +
		'AND userID = ? ',
		[
		options.character.name,
		JSON.encode(options.character),
		db.characterID,
		options.user.options.userID
		],
		function(err,info) {
		    if (err) {
			options.user.logger.error('Character Update error: ' + JSON.encode(err)+ ' characterID:'+db.characterID);
			callback({
			    error : err
			});
		    } else {
			if (info.affectedRows) {
			    options.user.logger.trace('Character Update success. id:' + db.characterID);
			    callback(Object.merge(options.character,{
				database : {
				    characterID : db.characterID
				}
			    }));
			    db = null;
			} else {
			    options.user.logger.error('Character not found. characterID:'+db.characterID);
			    callback({
				error : 'Could not locate the character specified.'
			    });
			}
		    }
		}.bind(this)
		);

	} else {
	    /**
	     * Insert
	     */
	    RPG.Mysql.query(
		'INSERT INTO characters ' +
		'SET name = ?, ' +
		'options = ?,' +
		'created = NOW(),' +
		'userID = ?',
		[
		options.character.name,
		JSON.encode(options.character),
		options.user.options.userID
		],
		function(err,info) {
		    if (err) {
			options.user.logger.error('Character Insert error: ' + JSON.encode(err)+ ' character:'+JSON.encode(options.character));
			callback({
			    error : err
			});
		    } else {
			if (info.insertId) {
			    options.user.logger.trace('Character Update success. id:' + info.insertId + ' character:'+JSON.encode(options.character));
			    callback(Object.merge(options.character,{
				database : {
				    characterID : info.insertId
				}
			    }));
			} else {
			    options.user.logger.error('Character Insert Failed. No ID character:'+JSON.encode(options.character));
			    callback({
				error : 'Failed to get newly inserted character ID :( '
			    });
			}
		    }
		}.bind(this)
		);
	}
    },

    /**
     * Lists all the characters for a specific user
     * required options:
     * user
     *
     * callback(list || error)
     */
    list : function(options,callback) {
	if (!RPG.Constraints.requiredOptions(options,['user'],logger,callback)){
	    return;
	}

	RPG.Mysql.query(
	    'SELECT characterID, name, options, created, updated '+
	    'FROM characters c ' +
	    'WHERE c.userID = ? '+
	    'ORDER BY c.updated DESC'
	    ,
	    [
	    options.user.options.userID
	    ],
	    function(err,results) {
		if (err) {
		    options.user.logger.error('Character List error: ' + JSON.encode(err)+ ' character:'+JSON.encode(options.character));
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0]) {
			var characters = {};

			results.each(function(result){
			    characters[result['name']] = Object.merge({
				database : {
				    characterID : result['characterID'],
				    created : result['created'],
				    updated : result['updated']
				}
			    },
			    JSON.decode(result['options'],true));
			});
			options.user.logger.trace('Listing %s Characters',''+results.length);
			callback(characters);

		    } else {
			options.user.logger.trace('Character list error: None found. ' + JSON.encode(err)+ ' character:'+JSON.encode(options.character));
			callback({
			    error : 'No characters found.'
			});
		    }
		}
	    }
	    );
    },

    /**
     * Load a character from the Database
     *
     * required options:
     * user,
     * characterID || character
     *
     *
     * callback(character || error)
     */
    load : function(options, callback) {
	options.characterID = options.characterID || (options.character && options.character.database.characterID);
	if (!RPG.Constraints.requiredOptions(options,['user','characterID'],logger,callback)){
	    return;
	}

	/**
	 * Last resort load from database
	 */
	RPG.Mysql.query(
	    'SELECT characterID, name, options, created, updated '+
	    'FROM characters c ' +
	    'WHERE c.userID = ? '+
	    'AND c.characterID = ? ',
	    [
	    options.user.options.userID,
	    options.characterID
	    ],
	    function(err,results) {
		if (err) {
		    options.user.logger.error('Character Load error: ' + JSON.encode(err)+ ' characterID:'+options.characterID);
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0]) {
			var result = results[0];
			options.user.logger.trace('Character Load Successful: characterID:' + options.characterID);
			callback(Object.merge({
			    database : {
				characterID : result['characterID']
			    }
			},
			JSON.decode(result['options'],true))
			    );

		    } else {
			options.user.logger.error('Character Load error: Not found. characterID:'+options.characterID);
			callback({
			    error : 'No characters found.'
			});
		    }
		}
	    }.bind(this)
	    );
    },

    /**
     * Delete a character from the Database
     *
     * required options:
     * user,
     * characterID || character
     *
     * callback(success || error)
     */
    'delete' : function(options, callback) {
	options.characterID = options.characterID || (options.character && options.character.characterID);

	RPG.Mysql.query(
	    'DELETE FROM characters ' +
	    'WHERE userID = ? '+
	    'AND characterID = ?',
	    [
	    options.user.options.userID,
	    options.characterID
	    ],
	    function(err,info) {
		if (err) {
		    options.user.logger.error('Character Delete error: ' + JSON.encode(err)+ ' characterID:'+options.characterID);
		    callback({
			error : err
		    });
		} else {
		    if (info.affectedRows) {
			callback({
			    success : true,
			    characterID : options.characterID
			});
			options.user.logger.error('Character Delete Success: characterID:'+options.characterID);

		    } else {
			options.user.logger.error('Character Delete error: Not found. characterID:'+options.characterID);
			callback({
			    error : 'Character not found.'
			});
		    }
		}
	    }.bind(this)
	    );
    }
}))();