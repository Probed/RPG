var RPG = module.exports = {};
Object.merge(RPG,
    require('../Log/Log.njs'),
    require('../../common/optionConfig.js'),
    require('../../common/Character/Character.js')
    );

RPG.Character = new (RPG.CharacterClass = new Class({
    Implements : [Events,Options],
    cache : {},
    options : {

    },
    initialize : function(options) {
	this.setOptions(options);
    },

    /**
     * Character names are server wide and duplicates are not allowed.
     * required options :
     * character
     *
     * callback(error || null) (null == not a dupe)
     */
    checkDupeName : function(options, callback) {
	require('../Database/mysql.njs').mysql.query(
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
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0] && results[0]['name']) {
			callback({
			    error : 'The name <b>"'+results[0]['name']+'"</b> has been taken.<br>Please choose another.'
			});
		    } else {
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
	options.character = typeOf(options.character) == 'string'?JSON.decode(options.character):typeOf(options.character) == 'object'?options.character:{};

	//set stuff the user isn't allowed to set
	options.character.hp = {
	    max : RPG.calcMaxHP(options.character),
	    cur : RPG.calcMaxHP(options.character)
	};
	options.character.mana = {
	    max : RPG.calcMaxMana(options.character),
	    cur : RPG.calcMaxMana(options.character)
	};
	options.character.level = 1;
	options.character.xp = 0;

	//validate the incoming character
	var errors = [];
	errors = RPG.optionValidator.validate(options.character,RPG.character_options);

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
	    callback({
		error : errors
	    });
	    return;
	}

	this.checkDupeName(options,function(dupeName) {
	    if (dupeName) {
		callback(dupeName);
		return;
	    }
	    this.store(options,function(storedCharacter){
		callback(storedCharacter);
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
	var db =  options.character.database;
	Object.erase(options.character,'database');//remove the database stuff from the incoming character

	if (db && db.characterID) {
	    if (!Number.from(db.characterID)) {
		callback({
		    error : 'The character ID must be numeric.'
		});
		db = null;
		return;
	    }
	    /**
	     * Update
	     */
	    require('../Database/mysql.njs').mysql.query(
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
		    RPG.Log('database update','Updated Character: '+db.characterID);
		    if (err) {
			callback({
			    error : err
			});
		    } else {
			if (info.affectedRows) {
			    callback(require('../Cache.njs').Cache.store(options.user.options.userID,'character_'+db.characterID,Object.merge(options.character,{
				database : {
				    characterID : db.characterID
//				    ,
//				    updated : Date('now'),
//				    created : db.created
				}
			    })));
			    db = null;
			} else {
			    callback({
				error : 'Could not locate the character specified'
			    });
			}
		    }
		}.bind(this)
		);

	} else {
	    /**
	     * Insert
	     */
	    require('../Database/mysql.njs').mysql.query(
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
		    RPG.Log('database insert','Inserted Character: '+info.insertId);
		    if (err) {
			callback({
			    error : err
			});
		    } else {
			if (info.insertId) {
			    callback(require('../Cache.njs').Cache.store(options.user.options.userID,'character_'+info.insertId,Object.merge(options.character,{
				database : {
				    characterID : info.insertId
//				    ,
//				    updated : Date('now'),
//				    created : Date('now')
				}
			    })));
			} else {
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
	require('../Database/mysql.njs').mysql.query(
	    'SELECT characterID, name, options, created, updated '+
	    'FROM characters c ' +
	    'WHERE c.userID = ? '+
	    'ORDER BY c.updated DESC'
	    ,
	    [
	    options.user.options.userID
	    ],
	    function(err,results) {
		RPG.Log('database hit','Loading Character List: '+options.user.options.userID);
		if (err) {
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

			callback(characters);

		    } else {
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
     * optional options
     * bypassCache
     *
     * callback(character || error)
     */
    load : function(options, callback) {
	options.characterID = options.characterID || (options.character && options.character.characterID);
	/**
	 * Check the cache first
	 */
	if (!options.bypassCache) {
	    var chr = require('../Cache.njs').Cache.retrieve(options.user.options.userID,'character_'+options.characterID);
	    if (chr) {
		//RPG.Log('cached','Character: '+options.characterID);
		callback(chr);
		return;
	    }
	}

	/**
	 * Last resort load from database
	 */
	require('../Database/mysql.njs').mysql.query(
	    'SELECT characterID, name, options, created, updated '+
	    'FROM characters c ' +
	    'WHERE c.userID = ? '+
	    'AND c.characterID = ? ',
	    [
	    options.user.options.userID,
	    options.characterID
	    ],
	    function(err,results) {
		RPG.Log('database hit','Loading Character: '+options.characterID);
		if (err) {
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0]) {
			var result = results[0];
			callback(require('../Cache.njs').Cache.store(options.user.options.userID,'character_'+options.characterID, Object.merge({
			    database : {
				characterID : result['characterID'],
				created : result['created'],
				updated : result['updated']
			    }
			},
			JSON.decode(result['options'],true))
			    ));

		    } else {
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

	require('../Database/mysql.njs').mysql.query(
	    'DELETE FROM characters ' +
	    'WHERE userID = ? '+
	    'AND characterID = ?',
	    [
	    options.user.options.userID,
	    options.characterID
	    ],
	    function(err,info) {
		if (err) {
		    callback({
			error : err
		    });
		} else {
		    if (info.affectedRows) {
			callback({
			    success : true,
			    characterID : options.characterID
			});
			RPG.Log('delete','Character Deleted: '+options.characterID);
			require('../Cache.njs').Cache.remove(options.user.options.userID,'character_'+options.characterID);

		    } else {
			callback({
			    error : 'Character not found.'
			});
		    }
		}
	    }.bind(this)
	    );
    },


    /**
     * required options:
     * character
     */
    calcSightRadius : function(options, callback) {
	callback(5);
    },

    /**
     * baseXP the amount to modify
     *
     * required options
     * game
     *
     * callback(xp || 0)
     */
    calcXP : function(baseXP, options,callback) {
	var modifier = RPG.applyModifiers(options.game.character,1,'Character.xp.modifier');
	callback(baseXP * (modifier || 1));
    }


}))();