/*
 * Users.js
 *
 * Manages user sessions/creating & updating users/etc
 *
 *
 */

var RPG = module.exports = {};

Object.merge(RPG,
    require('../Log/Log.njs'),
    require('./User.njs')
    );

RPG.Users = new (RPG.UsersClass = new Class({
    Implements : [Events,Options],

    userIDs : 0,
    routeAccepts : ['login','forgot','verify','register','logout','updateUser','resetPassword','updateOptions'],
    userColumns : ['userID', 'name', 'email', 'passwordHash', 'verifyKey', 'role', 'enabled', 'created', 'updated', 'apiKey', 'lastLogin', 'emailUpdates','settings'],
    PASSWORD_SALT : 'TastyTastyLoginSalt!',
    APIKEY_SALT : 'TastyTastyCookieSalt!',
    VERIFY_SALT : 'TastyTastyVerifySalt!',
    RESET_SALT : 'TastyTastyResetSalt!',

    options : {
	onLogin : null, /*Event fired when a user logs in*/
	onLogout : null, /*Event fired when a user logs out*/
	defaultSettings : {
	    keyboard : {
		up : 'Up',
		down : 'Down',
		left : 'Left',
		right : 'Right',
		activate : 'numKey+0'
	    }
	},
	cookieOptions : {
	    name : 'apiKey'
	/*
	     expires: a Date object indicating the cookie's expiration date (expires at the end of session by default).
	     path: a string indicating the path of the cookie (/ by default).
	     domain: a string indicating the domain of the cookie (no default).
	     secure: a boolean indicating whether the cookie is only to be sent over HTTPS (false by default for HTTP, true by default for HTTPS).
	     httpOnly: a boolean indicating whether the cookie is only to be sent over HTTP(S), and not made available to client JavaScript (true by default).
	     signed: a boolean indicating whether the cookie is to be signed (false by default). If this is true, another cookie of the same name with the .sig suffix appended will also be sent, with a 27-byte url-safe base64 SHA1 value representing the hash of cookie-name=cookie-value against the first Keygrip key. This signature key is used to detect tampering the next time a cookie is received.
	     */
	}
    },
    initialize : function(options) {
	this.setOptions(options);
	RPG.Log('init','RPG.Users initialized');
    },
    determineUser : function(request,response, onComplete) {
	var cookies = new (require('./Cookies.njs').Cookies)(request,response);
	var apiKey = cookies.get(this.options.cookieOptions.name);

	var guestUser = (request.headers['user-agent']).toMD5();

	if (!apiKey) {
	    /**
	     * New User (or someone without cookies)
	     * either way we well set their user cookie and give them a userid
	     * based on there UserAgent and IP @Todo make better?
	     */

	    cookies.set(this.options.cookieOptions.name,guestUser,this.options.cookieOptions);
	    apiKey = guestUser;
	}

	/**
	 * Attempt to load the users data from the cache
	 * otherwise get from database
	 */
	var user = require('../Cache.njs').Cache.retrieve('users',apiKey);
	if (user) {
	    /**
	     * Return the cached user for this request session
	     */
	    onComplete(user);

	} else if (apiKey != guestUser) {

	    require('../Cache.njs').Cache.store('users',apiKey, user = new RPG.User({
		name : 'Guest User #'+ (++this.userIDs),
		id : this.userIDs
	    }));

	    /**
	     * @Attempt to find the user in the database based on the hash:
	     */
	    RPG.Mysql.query(
		'SELECT '+this.userColumnsToSelectList('u')+
		'FROM user u ' +
		'WHERE apiKey = ? ',
		[apiKey],
		function(err,results) {
		    if (!err) {
			if (results && results[0]) {
			    user.isLoggedIn = true;
			    this.populateUser(results[0],user);
			    //RPG.Log('lookup','User Found: '+JSON.encode(user));
			    onComplete(user);
			} else {
			    //RPG.Log('lookup','User Not Found: '+apiKey);
			    onComplete(user);
			}
		    } else {
			//RPG.Log('lookup error','User Error: '+JSON.encode(user));
			onComplete(user);
		    }
		}.bind(this)
		);
	} else {
	    /**
	     * Guest User
	     */
	    require('../Cache.njs').Cache.store('users',apiKey, user = new RPG.User({
		name : 'Guest User #'+ (++this.userIDs),
		id : this.userIDs
	    }));
	    /**
	     * Return the user for this request session
	     */
	    onComplete(user);
	}
    },

    onRequest : function(request,response) {
	/**
	 * Process incomming user requests
	 */
	var url = require('url').parse(request.url, true);
	switch (url.query.a) {
	    case 'login':
		this.login(request,response);
		break;

	    case 'forgot':
		this.forgot(request,response);
		break;

	    case 'verify':
		this.verify(request,response);
		break;

	    case 'register':
		this.register(request,response);
		break;

	    case 'resetPassword' :
		this.resetPassword(request,response);
		break;

	    case 'logout':
		this.logout(request,response);
		break;
	}
    },
    /**
     * creates a list of the user table columns with a spcified alias
     */
    userColumnsToSelectList : function(tableAlias) {
	var str = '';
	this.userColumns.each(function(col){
	    str += (tableAlias?tableAlias+'.':'')+col+',';
	});
	return str.substr(0, str.length-1) + ' ';
    },

    /**
     * Modifies a given users options to contain the contents of the results based on
     * the userColumns list, so only user recognized columns get stored
     */
    populateUser : function(result,user) {
	this.userColumns.each(function(col){
	    if (result[col]) {
		user.options[col] = result[col];
	    }
	});
	user.options.settings = JSON.decode(user.options.settings,true);
    },

    /**
     * Process the incomming request to login.
     * Successful login will set their cookie and the user.isLoggedIn flag to true.
     *
     */
    login : function(request,response) {
	var errors = [];
	var passwordHash = '';

	if (!(request.url.query.email)) {
	    errors.push('An <b>Email Address</b> must be provided.');
	}
	if (!(request.url.query.password)) {
	    errors.push('A <b>Password</b> must be provided.');
	}

	if (request.url.query.email && !/^[^@]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+$/.test(request.url.query.email)) {
	    errors.push('Invalid <b>Email Address</b>: ' + request.url.query.email);
	}
	if (request.url.query.password && request.url.query.password.trim().length <= 6) {
	    errors.push('<b>Password</b> provided is too short. Minimum 7 symbols.');
	}

	if (errors.length > 0) {
	    response.onRequestComplete(response,{
		error : errors
	    });
	    return;
	}

	passwordHash = (request.url.query.email + request.url.query.password + this.PASSWORD_SALT).toMD5()

	/**
	 * Attempt lookup of user in database:
	 */
	RPG.Mysql.query(
	    'SELECT '+ this.userColumnsToSelectList('u')+
	    'FROM user u ' +
	    'WHERE u.email = ? ' +
	    'AND u.passwordHash = ?',
	    [
	    request.url.query.email,
	    passwordHash
	    ],
	    /**
	 * Process Results of Query
	 */
	    function(err,results,fields) {
		if (err) {
		    response.onRequestComplete(response,{
			error : err
		    });
		} else {
		    if (results && results[0]) {
			/**
		     * Check to see if there account is pending verification
		     */
			//@todo remove verify key from return
			if (results[0]['verifyKey']) {
			    response.onRequestComplete(response,{
				error : 'This account is currently pending <b>verification</b>.<br>Please check your email for your verification key.<br>If you need it sent again, please use the forgot password form.<br><br>Key: ' +results[0]['verifyKey']
			    });
			    return;
			}

			this.doLogin(results,request,response);

		    } else{
			response.onRequestComplete(response,{
			    error : 'Invalid <b>Login/Password</b> combination.'
			});
		    }
		}
	    }.bind(this)
	    );
    },

    /**
     * Performs the database updates and user modifications nescessary to log a user in.
     */
    doLogin : function(results,request,response) {
	var apiKey = (request.url.query.email + request.url.query.passwordHash + this.APIKEY_SALT).toMD5();

	/**
	 * Update the users last logged in info and apiKey to make sure it is up to date
	 */
	RPG.Mysql.query(
	    'UPDATE user '+
	    'SET lastLogin = NOW(), apiKey = ? '+
	    'WHERE userID = ?',
	    [
	    apiKey,
	    results[0].userID
	    ],
	    function(err,results,fields) {
		if (err) {
		    console.log('Error updating User login information.\n');
		}
	    }.bind(this)
	    );

	/**
	 * Change thier cookie to make sure it is up to date.
	 */
	var cookies = new (require('./Cookies.njs').Cookies)(request,response);
	if (cookies.get(this.options.cookieOptions.name) != apiKey) {
	    cookies.set(this.options.cookieOptions.name,apiKey,this.options.cookieOptions);
	}

	/**
	 * Make new user and store in the cache, and the request object
	 */
	require('../Cache.njs').Cache.store('users',apiKey,request.user = new RPG.User({
	    id : ++this.userIDs
	}));

	/**
	 * Populate our cached user with the database data
	 */
	this.populateUser(results[0],request.user);

	request.user.isLoggedIn = true;

	/**
	 * Send back the users application options as the result of a successful login
	 */
	response.onRequestComplete(response,this.getApplicationOptions(request.user));

	/**
	 * Finally let everyone listening know about the successful login
	 */
	this.fireEvent('login',[request.user]);
    },


    /**
     * Logs the user out of the system.
     * Fires the logout event so listeneres can clean up the user.
     */
    logout : function(request,response) {
	/**
	 * Clobber their loggedin cookie by overwriting with a guest cookie
	 */
	var guestApiKey = (request.headers['user-agent']).toMD5();
	var cookies = new (require('./Cookies.njs').Cookies)(request,response);
	cookies.set(this.options.cookieOptions.name,guestApiKey,this.options.cookieOptions);
	var userApiKey = request.user.options.apiKey;
	/**
	 * remove user from cache
	 */

	require('../Cache.njs').Cache.remove('users',request.user.options.apiKey);

	/**
	 * dispose of the user
	 */
	delete request.user;
	Object.erase(request,'user');

	/**
	 * Send back the guest users application options as the result of a successful logout
	 */
	if (!require('../Cache.njs').Cache.retrieve('users',guestApiKey)) {
	    require('../Cache.njs').Cache.store('users',guestApiKey, request.user = new RPG.User({
		name : 'Guest User #'+ (++this.userIDs),
		id : this.userIDs
	    }));
	}
	response.onRequestComplete(response,this.getApplicationOptions(require('../Cache.njs').Cache.retrieve('users',guestApiKey)));

	/**
	 * Finally let everyone listening know about the logout
	 * send out the apiKey of the user so it can be invalidated
	 */
	this.fireEvent('logout',[userApiKey]);
    },

    /**
     * Process Incomming registration requests.
     */
    register : function(request,response) {

	var errors = [];

	if (!(request.url.query.name)) {
	    errors.push('Your <b>Display Name</b> must be provided.');
	}
	if (!(request.url.query.email)) {
	    errors.push('Your <b>Email Address</b> must be provided.');
	}
	if (!(request.url.query.password)) {
	    errors.push('You <b>Password</b> must be provided.');
	}
	if (!(request.url.query.retypePassword)) {
	    errors.push('<b>Re-typed Password</b> must be provided.');
	}

	//emailUpdates

	//@Todo limit display names better
	if (request.url.query.name && request.url.query.name.length < 3) {
	    errors.push('<b>Display Name</b> to short. Minimun size: 3.');
	}
	if (request.url.query.email && !/^[^@]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+$/.test(request.url.query.email)) {
	    errors.push('Invalid <b>Email Address</b>: ' + request.url.query.email);
	}

	if (request.url.query.password && request.url.query.password.length <= 6) {
	    errors.push('<b>Password</b> to short. Minimun 7 symbols.');
	}

	if (request.url.query.password && request.url.query.retypePassword && request.url.query.retypePassword !== request.url.query.password) {
	    errors.push('<b>Passwords do not Match</b> please retype your password.');
	}

	if (errors.length > 0) {
	    response.onRequestComplete(response,{
		error : errors
	    });
	    return;
	}

	this.checkDupeDisplayName(request.url.query.name,
	    function(dupeName) {
		if (dupeName) {
		    response.onRequestComplete(response, dupeName);
		} else {
		    this.checkDupeEmail(request.url.query.email,
			function(dupeEmail) {
			    if (dupeEmail) {
				response.onRequestComplete(response, dupeEmail);
			    } else {
				/**
			 * Perform User Registration
			 */
				var passwordHash = (request.url.query.email + request.url.query.password + this.PASSWORD_SALT).toMD5()
				var apiKey = (request.url.query.email + request.url.query.passwordHash + this.APIKEY_SALT).toMD5();
				var verifyKey = (passwordHash + apiKey + this.VERIFY_SALT).toMD5();

				RPG.Mysql.query(
				    'INSERT INTO user '+
				    'SET name = ?,'+
				    'email = ?,'+
				    'passwordHash = ?,'+
				    'verifyKey = ?,'+
				    'apiKey = ?,'+
				    'role = ?,'+
				    'enabled = ?,'+
				    'emailUpdates = ?,'+
				    'settings = ?, ' +
				    'created = NOW()',
				    [
				    request.url.query.name,
				    request.url.query.email,
				    passwordHash,
				    verifyKey,
				    apiKey,
				    '2',//@todo change role
				    true,
				    request.url.query.emailUpdates?true:false,
				    JSON.encode(this.options.defaultSettings)
				    ],
				    /**
			 * Process Results of Query
			 */
				    function(err,info) {
					if (err) {
					    response.onRequestComplete(response,{
						error : err
					    });
					} else {
					    if (info.insertId) {
						/**
				     * @todo email new user
				     */
						var message = '';

						/**
				     *Inser successful
				     */
						response.onRequestComplete(response,{
						    success : 'An email has been sent to '+request.url.query.email+' with a verification id.<br>Please use that id to verify your account.'
						    +'<br>Key: '+verifyKey //@todo : remove this
						});

					    } else {
						response.onRequestComplete(response,{
						    error : 'No insertId returned from users.register. Please try again. :('
						});
					    }
					}
				    }.bind(this)
				    );

			    }
			}.bind(this))
		}
	    }.bind(this));

    },
    /**
     * Checks for Duplicate Display Names
     */
    checkDupeDisplayName : function(name,callback) {
	RPG.Mysql.query(
	    'SELECT u.name ' +
	    'FROM user u ' +
	    'WHERE u.name = ?',
	    [
	    name
	    ],
	    /**
	 * Process Results of Query
	 */
	    function(err,results,fields) {
		if (err) {
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0] && results[0]['name']) {
			callback({
			    error : 'The display name <b>"'+results[0]['name']+'"</b> is already taken.<br>Please choose another name.'
			});
		    } else {
			callback(null);
		    }
		}
	    }.bind(this)
	    );
    },
    /**
     * Checks for Duplicate Display Names
     */
    checkDupeEmail : function(email,callback) {
	RPG.Mysql.query(
	    'SELECT u.email ' +
	    'FROM user u ' +
	    'WHERE u.email = ?',
	    [
	    email
	    ],
	    /**
	 * Process Results of Query
	 */
	    function(err,results,fields) {
		if (err) {
		    callback({
			error : err
		    });
		} else {
		    if (results && results[0] && results[0]['email']) {
			callback({
			    error : 'The email address: <b>"'+results[0]['email']+'"</b> is already in use.<br>Please enter another email address.'
			});
		    } else {
			callback(null);
		    }
		}
	    }.bind(this)
	    );
    },
    verify : function(request,response) {
	var errors = [];
	if (!request.url.query.verifyKey) {
	    errors.push('Verification key missing. Please provide a Key.');
	}

	if (errors.length > 0) {
	    response.onRequestComplete(response,{
		error : errors
	    });
	    return;
	}

	/**
	 * @Attempt to find the user in the database based on the key:
	 */
	RPG.Mysql.query(
	    'SELECT '+this.userColumnsToSelectList('u')+
	    'FROM user u ' +
	    'WHERE verifyKey = ? ',
	    [
	    request.url.query.verifyKey
	    ],
	    function(err,results,fields) {
		if (!err) {
		    if (results && results[0]) {
			RPG.Mysql.query(
			    'UPDATE user SET verifyKey = null '+
			    'WHERE verifyKey = ? ',
			    [
			    request.url.query.verifyKey
			    ],
			    function(err) {
				if (!err) {
				    this.doLogin(results,request,response);
				} else {
				    response.onRequestComplete(response,{
					error : err
				    });
				}
			    }.bind(this)
			    );
		    } else {
			response.onRequestComplete(response,{
			    error : 'Verification key not found. Sorry.'
			});
		    }
		} else {
		    response.onRequestComplete(response,{
			error : err
		    });
		}
	    }.bind(this)
	    );
    },

    forgot : function(request,response) {
	var errors = [];
	if (!request.url.query.email) {
	    errors.push('Your email address is required.');
	}

	if (request.url.query.email && !/^[^@]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+$/.test(request.url.query.email)) {
	    errors.push('Invalid Email Address.');
	}

	if (errors.length > 0) {
	    response.onRequestComplete(response,{
		error : errors
	    });
	    return;
	}

	/**
	 * @Attempt to find the user in the database based on the key:
	 */
	RPG.Mysql.query(
	    'SELECT email '+
	    'FROM user u ' +
	    'WHERE email = ? ',
	    [
	    request.url.query.email
	    ],
	    function(err,results,fields) {
		if (!err) {
		    if (results && results[0]) {
			/**
		     * Sends link to user to reset there account
		     * link contains: userID and resetKey
		     */
			var resetKey = (results[0].userID + results[0].name + results[0].passwordHash + this.RESET_SALT).toMD5();

			//@todo email user
			response.onRequestComplete(response,{
			    success : '"'+request.url.query.email+'" was found.'
			    +'ResetKey: '+ resetKey//@todo remove
			});
		    } else {
			response.onRequestComplete(response,{
			    error : 'The email address "'+request.url.query.email+'" was not found.'
			});
		    }
		} else {
		    response.onRequestComplete(response,{
			error : err
		    });
		}
	    }.bind(this)
	    );
    },

    resetPassword : function(request,response) {
	var errors = [];
	if (!request.url.query.userID) {
	    errors.push('A User ID is requied to reset its password.');
	}

	if (!request.url.query.resetKey) {
	    errors.push('A Reset Key is required to reset the password.');
	}

	if (errors.length > 0) {
	    response.onRequestComplete(response,{
		error : errors
	    });
	    return;
	}

	/**
	 * @Attempt to find the user in the database based on the userID:
	 */
	RPG.Mysql.query(
	    'SELECT u.userID, u.email '+
	    'FROM user u ' +
	    'WHERE userID = ? ',
	    [
	    request.url.query.userID
	    ],
	    function(err,results,fields) {
		if (!err) {
		    if (results && results[0]) {
			/**
		     * Sends link to user to reset there account
		     * link contains: userID and resetKey
		     */
			var resetKey = (results[0].userID + results[0].name + results[0].passwordHash + this.RESET_SALT).toMD5();


			if (resetKey === request.url.query.resetKey) {
			    var newPassword = 'NewPassword';
			    var passwordHash = (results[0].name + newPassword + this.PASSWORD_SALT);

			    RPG.Mysql.query(
				'UPDATE user '+
				'SET passwordHash = ?' +
				'WHERE userID = ? ',
				[
				passwordHash,
				results[0].userID
				],
				function(err) {
				    if (err) {
					response.onRequestComplete(response,{
					    error : err
					});
				    } else {
					//@todo email user

					response.onRequestComplete(response,{
					    success : 'An email has been sent to '+results[0].email+' with your new password.'
					});
				    }
				}
				);
			} else {
			    response.onRequestComplete(response,{
				error : 'Password reset failed. Unknown reset key.'
			    });
			}
		    } else {
			response.onRequestComplete(response,{
			    error : 'The user "'+request.url.query.userID+'" was not found.'
			});
		    }
		} else {
		    response.onRequestComplete(response,{
			error : err
		    });
		}
	    }.bind(this)
	    );
    },

    /**
     * these options control the ui based on the user
     * gets sent to the ui upon successful login (or on app start)
     */
    getApplicationOptions : function(user) {
	var opts = {
	    user : {
		settings : Object.clone(this.options.defaultSettings)
	    }
	};
	['userID','name','email','created','updated','lastLogin','settings'].each(function(col){
	    if (user.options[col]){

		if (opts.user[col]) {
		    Object.merge(opts.user[col],user.options[col]);
		} else {
		    opts.user[col] = user.options[col];
		}
	    }
	});

	if (user.isLoggedIn) {
	    opts.user.isLoggedIn = true;
	}
	return opts;
    }

}))();