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

    createCharacter : function(request,response) {
	if (request.method == 'POST') {
	    if (!request.dataReceived) {
		request.on('end',function(){
		    this.beginCharacterSave(request,response);
		}.bind(this));
	    } else {
		this.beginCharacterSave(request,response);
	    }
	} else {
	    response.onRequestComplete(response,{
		error : 'New Character must use POST.'
	    });
	}
    },

    beginCharacterSave : function(request,response) {
	var character = typeOf(request.data) == 'string'?JSON.decode(request.data):request.data;

	var errors = RPG.optionValidator.validate(character,RPG.character_options);

	var total = 0;
	var base = 0;
	Object.each(RPG.Stats, function(stat,name){
	    var val = Number.from(character.Stats[name].value);
	    var min = RPG.getClassStat(character.Class,name,'start');
	    base += min;
	    total += val;
	    if (!val) {
		errors.push('A value for <b>'+name + '</b> must be provided.');

	    }else if (val < min) {
		errors.push(name + ' for a ' + character.Class + ' is a <b>minimum of ' + min+'</b>')
	    }
	}.bind(this));
	if (total - base != RPG.difficultyVal(character.Difficulty,'Character.Stats.start')) {
	    errors.push('Please distribute the <b>' + (RPG.difficultyVal(character.Difficulty,'Character.Stats.start') - (total - base)) +'</b> remainig stat(s)')
	}

	if (errors && errors.length > 0) {
	    response.onRequestComplete(response,{
		error : errors
	    });
	    return;
	}


	character.level = 1;
	character.xp = 0;

	this.checkDupeCharacterName(character,function(dupeName) {
	    if (dupeName) {
		response.onRequestComplete(response,dupeName);
		return;
	    }

	    this.insertCharacter(request.user.options.userID,character,function(character){
		response.onRequestComplete(response,character);
	    });
	}.bind(this));
    },

    checkDupeCharacterName : function(character, callback) {
	require('../Database/mysql.njs').mysql.query(
	    'SELECT name ' +
	    'FROM characters ' +
	    'WHERE name = ? ' +
	    'AND characterID <> ? ',
	    [
	    character.name,
	    (character.database && Number.from(character.database.characterID)) || 0 // exclude current characterID in dupe name search if update is being performed.
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
     * Insert the character into the database,
     * callsback with the inserted id
     */
    insertCharacter : function(userID,character,callback) {
	var db =  character.database;
	Object.erase(character,'database');//remove the database stuff from the incoming universe

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
		character.name,
		JSON.encode(character),
		db.characterID,
		userID
		],
		function(err,info) {
		    if (err) {
			callback({
			    error : err
			});
		    } else {
			if (info.affectedRows) {
			    RPG.Log('update','Updated Character: '+db.characterID);
			    callback(require('../Cache.njs').Cache.store(userID,'character_'+db.characterID,Object.merge(character,{
				database : {
				    characterID : db.characterID,
				    updated : Date('now'),
				    created : db.created
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
		character.name,
		JSON.encode(character),
		userID
		],
		function(err,info) {
		    if (err) {
			callback({
			    error : err
			});
		    } else {
			if (info.insertId) {
			    RPG.Log('insert','Inserted Character: '+info.insertId);
			    callback(require('../Cache.njs').Cache.store(userID,'character_'+info.insertId,Object.merge(character,{
				database : {
				    characterID : info.insertId,
				    updated : Date('now'),
				    created : Date('now')
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

    listCharacters : function(userID,callback) {
	require('../Database/mysql.njs').mysql.query(
	    'SELECT characterID, name, options, created, updated '+
	    'FROM characters c ' +
	    'WHERE c.userID = ? '+
	    'ORDER BY c.updated DESC'
	    ,
	    [
	    userID
	    ],
	    function(err,results) {
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

    loadCharacter : function(userID,characterID, callback) {
	/**
	 * Check the cache first
	 *
	 */
	var chr = require('../Cache.njs').Cache.retrieve(userID,'character_'+characterID);
	if (chr) {
	    RPG.Log('cached','Character: '+characterID);
	    callback(chr);
	    return;
	} else {
	    RPG.Log('lookup','Loading Character: '+characterID);
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
	    userID,
	    characterID
	    ],
	    function(err,results) {
		if (err) {
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0]) {
			var result = results[0];
			callback(require('../Cache.njs').Cache.store(userID,'character_'+characterID, Object.merge({
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

    deleteCharacter : function(userID,characterID,callback) {
	require('../Database/mysql.njs').mysql.query(
	    'DELETE FROM characters ' +
	    'WHERE userID = ? '+
	    'AND characterID = ?',
	    [
	    userID,
	    characterID
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
			    characterID : characterID
			});
			RPG.Log('delete','Character Deleted: '+characterID);
			require('../Cache.njs').Cache.remove(userID,'character_'+characterID);

		    } else {
			callback({
			    error : 'Character not found.'
			});
		    }
		}
	    }.bind(this)
	    );
    },


    calcSightRadius : function(character, callback) {
	callback(5);
    }
}))();