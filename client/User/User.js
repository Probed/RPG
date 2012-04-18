/*
 * User.js
 *
 * Cient User Class
 *
 *
 */
RPG.AppUser = null;
RPG.User = new Class({
    Implements : [Events,Options],
    isLoggedIn : false, /*Contains the logged in state of the user*/
    options : {
	name : 'New User', /*Display Name of the user*/
	onLogin : null, /*Event triggered upon a successfull login*/
	onLogout : null /*Event triggered upon a successfull logout*/
    },

    /**
     * Init User
     */
    initialize : function(options) {
	this.setOptions(options);

	//Login Window Contents
	this.loginWindowDiv = new Element('div',{
	    id : 'loginWindowDiv'
	}).adopt(
	    new HtmlTable({
		zebra : false,
		selectable : false,
		useKeyboard : false,
		properties : {
		    align : 'center',
		    cellpadding : 5
		},
		rows : [
		[
		{
		    properties : {
			colspan : 2,
			'class' : 'textCenter'
		    },
		    content : 'Login Now!'
		}
		],
		[
		{
		    properties : {
			'class' : 'textRight textLarge vBottom'
		    },
		    content : 'Login Email'
		},
		{
		    properties : {
			'class' : 'textLarge vBottom'
		    },
		    content : this.loginWindowEmailInput = new Element('input',{
			id : 'loginWindowEmailInput',
			type : 'text',
			name : 'email',
			maxlength : '100',
			events : {
			    keypress : function(event) {
				if (event.code == 13) {
				    this.doWindowLogin();
				}
			    }.bind(this)
			}
		    })
		}
		],
		[
		{
		    properties : {
			'class' : 'textRight textLarge vTop'
		    },
		    content : 'Password'
		},
		{
		    properties : {
			'class' : 'textLarge vTop'
		    },
		    content : this.loginWindowPasswordInput = new Element('input',{
			id : 'loginWindowPasswordInput',
			type : 'password',
			name : 'password',
			maxlength : '100',
			events : {
			    keypress : function(event) {
				if (event.code == 13) {
				    this.doWindowLogin();
				}
			    }.bind(this)
			}
		    })
		}
		],
		[
		{
		    properties : {
			colspan : 2,
			'class' : 'textRight'
		    },
		    content : new Jx.Button({
			label : 'Login',
			image: '/client/jx/themes/dark/images/lock--arrow.png',
			tooltip: 'Log into your game.',
			toggle : false,
			onClick : function(event) {
			    this.doWindowLogin();
			}.bind(this)

		    }).toElement()
		}
		]
		]

	    })
	    );

	this.registerWindowDiv = new Element('div',{
	    id : 'registerWindowDiv'
	}).adopt(
	    new HtmlTable({
		zebra : true,
		selectable : false,
		useKeyboard : false,
		properties : {
		    align : 'center',
		    cellpadding : 5

		},
		rows : [
		[
		{
		    properties : {
			'class' : 'textRight User_rev'
		    },
		    content : 'Display name'
		},
		{
		    properties : {

		    },
		    content : this.registerWindowNameInput = new Element('input',{
			title : 'Display Name',
			rel : 'The name displayed to other users in stats/forum stuff.',
			name : 'name',
			type : 'text',
			maxlength : 15
		    })
		}
		],
		[
		{
		    properties : {
			'class' : 'textRight Email_rev'
		    },
		    content : 'Login Email'
		},
		{
		    properties : {

		    },
		    content : this.registerWindowEmailInput = new Element('input',{
			title : 'Your Email Address',
			rel : 'An activation email will be sent to this address.',
			name : 'email',
			type : 'text',
			maxlength : '100'
		    })
		}
		],
		[
		{
		    properties : {
			'class' : 'textRight'
		    },
		    content : 'Your Password'
		},
		{
		    properties : {

		    },
		    content : this.registerWindowPasswordInput = new Element('input',{
			title : 'Your Password',
			rel : 'Minimum of 7 symbols',
			name : 'password',
			type : 'password',
			maxlength : 50
		    })
		}
		],
		[
		{
		    properties : {
			'class' : 'textRight'
		    },
		    content : 'Re-Type Password'
		},
		{
		    properties : {

		    },
		    content : this.registerWindowRetypePasswordInput = new Element('input',{
			title : 'Retype Password',
			rel : 'Minimum of 7 symbols',
			name : 'retypePassword',
			type : 'password',
			maxlength : 50
		    })
		}
		],
		[
		{
		    properties : {
			'class' : 'textRight'
		    },
		    content : 'Email updates'
		},
		{
		    properties : {
			'class' : 'textLeft'
		    },
		    content : this.registerWindowEmailUpdatesInput = new Element('input',{
			title : 'Email Updates',
			rel : 'Receive game updates via email',
			name : 'emailUpdates',
			type : 'checkbox'
		    })
		}
		],
		[
		{
		    properties : {
			colspan : 2,
			'class' : 'textRight'
		    },
		    content : new Jx.Button({
			label : 'Complete Registration',
			image: '/client/jx/themes/dark/images/pencil--plus.png',
			tooltip: 'Submit your completed registration',
			toggle : false,
			onClick : function(event) {
			    this.doWindowRegister();
			}.bind(this)

		    }).toElement()
		}
		]
		]
	    })
	    );

	this.verifyWindowDiv = new Element('div',{
	    id : 'verifyWindowDiv'
	}).adopt(
	    new HtmlTable({
		zebra : false,
		selectable : false,
		useKeyboard : false,
		properties : {
		    align : 'center',
		    cellpadding : 5
		},
		rows : [
		[
		{
		    properties : {
			'class' : 'textLeft textMedium'
		    },
		    content : 'Verification Key:'
		}
		],
		[
		{
		    properties : {

		    },
		    content : this.verifyWindowKeyInput = new Element('input',{
			title : 'Enter the Verification Key you received in your email.',
			id : 'verifyWindowKeyInput',
			type : 'text',
			name : 'key',
			maxlength : '100',
			size : 42,
			events : {
			    keypress : function(event) {
				if (event.code == 13) {
				    this.doWindowVerify();
				}
			    }.bind(this)
			}
		    })
		}
		],
		[
		{
		    properties : {
			colspan : 2,
			'class' : 'textRight'
		    },
		    content : new Jx.Button({
			label : 'Verify Account',
			image: '/client/jx/themes/dark/images/link.png',
			tooltip: 'Verify your account email address.',
			toggle : false,
			onClick : function(event) {
			    this.doWindowVerify();
			}.bind(this)

		    }).toElement()
		}
		]
		]
	    })
	    );

	this.forgotWindowDiv = new Element('div',{
	    id : 'forgotWindowDiv'
	}).adopt(
	    new HtmlTable({
		zebra : false,
		selectable : false,
		useKeyboard : false,
		properties : {
		    align : 'center',
		    cellpadding : 5
		},
		rows : [
		[
		{
		    properties : {
			'class' : 'textLeft textMedium'
		    },
		    content : 'Login Email Address:'
		}
		],
		[
		{
		    properties : {

		    },
		    content : this.forgotWindowEmailInput = new Element('input',{
			title : 'Enter the Verification Key you received in your email.',
			id : 'forgotWindowEmailInput',
			type : 'text',
			name : 'email',
			maxlength : '100',
			size : 42,
			events : {
			    keypress : function(event) {
				if (event.code == 13) {
				    this.doWindowForgot();
				}
			    }.bind(this)
			}
		    })
		}
		],
		[
		{
		    properties : {
			colspan : 2,
			'class' : 'textRight'
		    },
		    content : new Jx.Button({
			label : 'Reset Password',
			image: '/client/jx/themes/dark/images/question.png',
			tooltip: 'Send the reset email to your email address.',
			toggle : false,
			onClick : function(event) {
			    this.doWindowForgot();
			}.bind(this)

		    }).toElement()
		}
		]
		]
	    })
	    );

    },

    /**
     * perform the login operation from the contents of the loginWindow
     */
    doWindowLogin : function() {
	this.login({
	    email : this.loginWindowEmailInput.value,
	    password : this.loginWindowPasswordInput.value
	});
    },

    /**
     * Perform a login attempt.
     * Options :
     *	    email : login email address,
     *	    password : login password
     *
     * fires the 'login' event upon success
     */
    login : function(options) {
	if (this.loginWindow) {
	    this.loginWindow.showSpinner();
	}
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=login&'+Object.toQueryString(options),
	    onFailure : function(error) {
		RPG.Dialog.error(error);
	    }.bind(this),
	    onSuccess : function(appOptions) {
		this.setOptions(appOptions.user);
		this.fireEvent('login',[appOptions]);
	    }.bind(this)
	}).get();

    },

    /**
     * Log the user out of the app
     * fires the 'logout' event upon success
     */
    logout : function(options) {
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=logout',
	    onFailure : function(error) {
		RPG.Dialog.error(error);
	    }.bind(this),
	    onSuccess : function(appOptions) {
		this.setOptions(appOptions.user);
		this.options.isLoggedIn = false;
		this.fireEvent('logout',[appOptions]);
	    }.bind(this)
	}).get();
    },

    doWindowRegister : function() {
	this.register(this.registerWindowDiv.toQueryString());
    },

    /**
     * Perform the registration of a new user
     * Options : (see serverside User.js for all possible options)
     */
    register : function(querystring) {
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=register&'+querystring,
	    onFailure : function(error) {
		RPG.Dialog.error(error);
	    }.bind(this),
	    onSuccess : function(success) {
		RPG.Dialog.success(success);
	    }.bind(this)
	}).get();
    },

    /**
     * Validate then perform the password reset email operation from the contents of the forgotWindow
     */
    doWindowForgot : function(event) {
	/**
	 * @Todo Validate and display validation results
	 */
	this.forgot({
	    email : this.forgotWindowEmailInput.value
	});
    },

    /**
     * Perform a forgotten password reset attempt.
     * Options :
     *	    email : login email address
     *
     */
    forgot : function(options) {
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=forgot&'+Object.toQueryString(options),
	    onFailure : function(error) {
		RPG.Dialog.error(error);
	    }.bind(this),
	    onSuccess : function(success) {
		RPG.Dialog.success(success);
	    }.bind(this)
	}).get();

    },

    /**
     * Validate then perform the password reset email operation from the contents of the forgotWindow
     */
    doWindowVerify : function(event) {
	/**
	 * @Todo Validate and display validation results
	 */
	this.verify({
	    verifyKey : this.verifyWindowKeyInput.value
	});
    },

    /**
     * Perform a account verification attempt.
     * Options :
     *	    key : account key
     *
     */
    verify : function(options) {
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=verify&'+Object.toQueryString(options),
	    onFailure : function(error) {
		RPG.Dialog.error(error);
	    }.bind(this),
	    onSuccess : function(appOptions) {
		this.setOptions(appOptions.user);
		this.fireEvent('login',[appOptions]);
	    }.bind(this)
	}).get();

    }
});