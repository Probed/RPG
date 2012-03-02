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
			'class' : 'textRight Email_rev textMedium'
		    },
		    content : 'Login Email'
		},
		{
		    properties : {

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
			'class' : 'textRight textMedium'
		    },
		    content : 'Password'
		},
		{
		    properties : {

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
			'class' : 'textCenter textSmall'
		    },
		    content : new Element('span',{
			styles : {
			    display : 'inline-block'
			}
		    }).adopt(
			new Element('br'),
			new Element('span',{
			    html : ' -- '
			}),
			this.getRegistrationLink(),

			new Element('span',{
			    html : ' -- '
			}),
			this.getForgotLink(),

			new Element('span',{
			    html : ' -- '
			}),
			this.getVerifyLink(),
			new Element('span',{
			    html : ' -- '
			})
			)
		}
		]
		]

	    })
	    );

	/**
		 * Small Login tabe
		 */
	this.smallLoginDiv = new Element('div',{
	    id : 'smallLoginDiv'
	}).adopt(
	    new HtmlTable({
		zebra : false,
		selectable : false,
		useKeyboard : false,
		properties : {
		    align : 'center',
		    cellpadding : 2
		},
		rows : [
		[
		{
		    properties : {
			'class' : 'textLeft textSmall'
		    },
		    content : 'Email'
		},
		{
		    properties : {
			'class' : 'textRight textTiny NoWrap'
		    },
		    content : this.getRegistrationLink().set('html','(Register Free)')
		}
		],
		[
		{
		    properties : {
			colspan : 2
		    },
		    content : this.smallLoginEmailInput = new Element('input',{
			id : 'smallLoginEmailInput',
			type : 'text',
			name : 'email',
			maxlength : '100',
			events : {
			    keypress : function(event) {
				if (event.code == 13) {
				    this.doSmallDivLogin();
				}
			    }.bind(this)
			}
		    })
		}
		],
		[
		{
		    properties : {
			'class' : 'textLeft textSmall'
		    },
		    content : 'Password'
		},
		{
		    properties : {
			'class' : 'textRight textTiny NoWrap'
		    },
		    content : this.getForgotLink().set('html','(Fogot?)')
		}
		],
		[
		{
		    properties : {
			colspan : 2
		    },
		    content : this.smallLoginPasswordInput = new Element('input',{
			id : 'smallLoginPasswordInput',
			type : 'password',
			name : 'password',
			maxlength : '100',
			events : {
			    keypress : function(event) {
				if (event.code == 13) {
				    this.doSmallDivLogin();
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
			'class' : 'textRight textSmall'
		    },
		    content : RPG.elementFactory.buttons.actionButton({
			html : '<span class="Login_rev textMedium">Login</span>',
			events : {
			    click : function(event) {
				this.doSmallDivLogin();
			    }.bind(this)
			}
		    })
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
			'class' : 'textCenter textSmall'
		    },
		    content : new Element('span',{
			styles : {
			    display : 'inline-block'
			}
		    }).adopt(
			new Element('br'),
			new Element('span',{
			    html : ' -- '
			}),
			this.getLoginLink(),

			new Element('span',{
			    html : ' -- '
			}),
			this.getRegistrationLink(),

			new Element('span',{
			    html : ' -- '
			}),
			this.getForgotLink(),
			new Element('span',{
			    html : ' -- '
			})
			)
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
			'class' : 'textCenter textSmall'
		    },
		    content : new Element('span',{
			styles : {
			    display : 'inline-block'
			}
		    }).adopt(
			new Element('br'),
			new Element('span',{
			    html : ' -- '
			}),
			this.getLoginLink(),

			new Element('span',{
			    html : ' -- '
			}),
			this.getRegistrationLink(),

			new Element('span',{
			    html : ' -- '
			}),
			this.getVerifyLink(),
			new Element('span',{
			    html : ' -- '
			})
			)
		}
		]
		]
	    })
	    );

    },

    /**
     * Returns a new span containing three spans: 'Login', '/', 'Register
     */
    getLoginRegisterLinks : function() {
	return new Element('span',{
	    styles : {
		display : 'inline-block'
	    }
	}).adopt(
	    this.getLoginLink(),
	    new Element('span',{
		html : ' / '
	    }),
	    this.getRegistrationLink()
	    );
    },

    /**
     * Returns a clickablespan that shows the login window
     */

    getLoginLink : function() {
	return new Element('span',{
	    'class' : 'Pointer Login_rev pageLink',
	    html : 'Sign In',
	    events : {
		click : function(event) {
		    this.showLoginWindow();
		}.bind(this)
	    }
	});
    },


    /**
     * Creates(if not created) and displays the login window
     */
    showLoginWindow : function() {
	this.minimizeAllUserWindows();
	this.loginWindow = new MUI.Window({
	    id : 'loginWindow',
	    title : 'Log into your Account',
	    type : 'window',
	    loadMethod : 'html',
	    content : this.loginWindowDiv,
	    collapsible : false,
	    storeOnClose : true,
	    resizable : false,
	    maximizable : false,
	    closable : true
	});
	if (!this.loginWindowButton) {
	    this.loginWindowButton = RPG.elementFactory.buttons.actionButton({
		'class' : 'WinFootRight',
		html : '<span class="Login_rev textMedium">Login</span>',
		events : {
		    click : function(event) {
			this.doWindowLogin();
		    }.bind(this)
		}
	    });
	    this.loginWindowCancelButton = RPG.elementFactory.buttons.cancelButton({
		'class' : 'WinFootLeft',
		events : {
		    click : function(event) {
			this.loginWindow.minimize();
		    }.bind(this)
		}
	    });
	    $('loginWindow').adopt(this.loginWindowButton,this.loginWindowCancelButton);
	}
	$(this.loginWindowEmailInput).focus();
    },

    /**
     * perform the login operation from the contents of the smallLoginDiv
     */
    doSmallDivLogin : function() {
	this.login({
	    email : this.smallLoginEmailInput.value,
	    password : this.smallLoginPasswordInput.value
	});
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
		if (this.loginWindow) {
		    this.loginWindow.hideSpinner();
		}
		RPG.Error.show(error);
	    }.bind(this),
	    onSuccess : function(appOptions) {
		this.setOptions(appOptions.user);
		MUI.notification('Login Successful<br>Welcome: '+appOptions.user.name);
		if (this.loginWindow) {
		    this.loginWindow.hideSpinner();
		    this.minimizeAllUserWindows();
		}
		this.fireEvent('login',[appOptions]);
	    }.bind(this)
	}).get();

    },

    /**
     * Returns a span with an onclick event to logout the user
     */
    getLogoutLink : function() {
	return new Element('span',{
	    'class' : 'Pointer Logout_rev',
	    html : 'Logout',
	    events : {
		click : function(event) {
		    this.logout();
		}.bind(this)
	    }
	});
    },

    /**
     * Log the user out of the app
     * fires the 'logout' event upon success
     */
    logout : function(options) {
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=logout',
	    onFailure : function(error) {
		RPG.Error.show(error);
	    }.bind(this),
	    onSuccess : function(appOptions) {
		MUI.notification('Logout Successful<br>Please don\'t go '+this.options.name + ' :(');
		this.setOptions(appOptions.user);
		this.options.isLoggedIn = false;
		this.fireEvent('logout',[appOptions]);
	    }.bind(this)
	}).get();
    },

    /**
     * Return a clickable span to show the registration window
     */
    getRegistrationLink : function() {
	return new Element('span',{
	    'class' : 'Pointer pageLink',
	    html : 'Register Free',
	    events : {
		click : function(event) {
		    this.showRegistration();
		}.bind(this)
	    }
	});
    },

    /**
     * Create(if not already created) and show the Registration Window
     */
    showRegistration : function() {
	this.minimizeAllUserWindows();
	this.registerWindow = new MUI.Window({
	    id : 'registerWindow',
	    title : 'Register your new Account for Free!',
	    type : 'window',
	    loadMethod : 'html',
	    content : this.registerWindowDiv,
	    collapsible : false,
	    storeOnClose : true,
	    resizable : false,
	    maximizable : false,
	    closable : true,
	    width : 400,
	    height : 200,
	    require : {
		js : ['/client/mootools/Form.PasswordStrength.js'],
		onloaded : function() {
		    new Form.PasswordStrength(this.registerWindowPasswordInput);
		}.bind(this)
	    }
	});
	if (!this.registerWindowButton) {
	    this.registerWindowButton = RPG.elementFactory.buttons.newButton({
		'class' : 'WinFootRight',
		html : '<span class="Add textMedium">Submit your Registration</span>',
		events : {
		    click : function(event) {
			this.doWindowRegister();
		    }.bind(this)
		}
	    });
	    this.registerWindowCancelButton = RPG.elementFactory.buttons.cancelButton({
		'class' : 'WinFootLeft',
		events : {
		    click : function(event) {
			this.registerWindow.minimize();
		    }.bind(this)
		}
	    });
	    $('registerWindow').adopt(this.registerWindowButton,this.registerWindowCancelButton);
	}
	$(this.registerWindowEmailInput).focus();

    },

    doWindowRegister : function() {
	this.register(this.registerWindowDiv.toQueryString());
    },

    /**
     * Perform the registration of a new user
     * Options : (see serverside User.js for all possible options)
     */
    register : function(querystring) {
	if (this.registerWindow) {
	    this.registerWindow.showSpinner();
	}
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=register&'+querystring,
	    onFailure : function(error) {
		RPG.Error.show(error);
		if (this.registerWindow) {
		    this.registerWindow.hideSpinner();
		}
	    }.bind(this),
	    onSuccess : function(success) {
		RPG.Success.show(success);
		MUI.notification('Registration Successful. Check your Email.');
		if (this.registerWindow) {
		    this.registerWindow.hideSpinner();
		}
	    }.bind(this)
	}).get();
    },

    /**
     * Return a clickable span to show the registration window
     */
    getForgotLink : function() {
	return new Element('span',{
	    'class' : 'Pointer pageLink',
	    html : 'Forgot Password',
	    events : {
		click : function(event) {
		    this.showForgotWindow();
		}.bind(this)
	    }
	});
    },

    /**
     * Creates(if not created) and displays the forgot window
     */
    showForgotWindow : function() {
	this.minimizeAllUserWindows();
	this.forgotWindow = new MUI.Window({
	    id : 'forgotWindow',
	    title : 'Forgotten Password Resetter',
	    type : 'window',
	    loadMethod : 'html',
	    content : this.forgotWindowDiv,
	    collapsible : false,
	    storeOnClose : true,
	    resizable : false,
	    maximizable : false,
	    closable : true
	});
	if (!this.forgotWindowButton) {
	    this.forgotWindowButton = RPG.elementFactory.buttons.actionButton({
		'class' : 'WinFootRight',
		html : '<span class="textMedium">Send Reset Email</span>',
		events : {
		    click : function(event) {
			this.doWindowForgot();
		    }.bind(this)
		}
	    });
	    this.forgotWindowCancelButton = RPG.elementFactory.buttons.cancelButton({
		'class' : 'WinFootLeft',
		events : {
		    click : function(event) {
			this.forgotWindow.minimize();
		    }.bind(this)
		}
	    });
	    $('forgotWindow').adopt(this.forgotWindowButton,this.forgotWindowCancelButton);
	}
	$(this.forgotWindowEmailInput).focus();
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
	if (this.forgotWindow) {
	    this.forgotWindow.showSpinner();
	}
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=forgot&'+Object.toQueryString(options),
	    onFailure : function(error) {
		if (this.forgotWindow) {
		    this.forgotWindow.hideSpinner();
		}
		RPG.Error.show(error);
	    }.bind(this),
	    onSuccess : function(success) {
		RPG.Success.show(success);
		MUI.notification('Email sent to: ' + options.email);
		if (this.forgotWindow) {
		    this.forgotWindow.hideSpinner();
		    this.minimizeAllUserWindows();
		}
	    }.bind(this)
	}).get();

    },


    /**
     * Return a clickable span to show the registration window
     */
    getVerifyLink : function() {
	return new Element('span',{
	    'class' : 'Pointer pageLink',
	    html : 'Verify Account',
	    events : {
		click : function(event) {
		    this.showVerifyWindow();
		}.bind(this)
	    }
	});
    },

    /**
     * Creates(if not created) and displays the login window
     */
    showVerifyWindow : function() {
	this.minimizeAllUserWindows();
	this.verifyWindow = new MUI.Window({
	    id : 'verifyWindow',
	    title : 'Verify your new Account',
	    type : 'window',
	    loadMethod : 'html',
	    content : this.verifyWindowDiv,
	    collapsible : false,
	    storeOnClose : true,
	    resizable : false,
	    maximizable : false,
	    closable : true
	});
	if (!this.verifyWindowButton) {
	    this.verifyWindowButton = RPG.elementFactory.buttons.actionButton({
		'class' : 'WinFootRight',
		html : '<span class="textMedium">Verify my Account</span>',
		events : {
		    click : function(event) {
			this.doWindowVerify();
		    }.bind(this)
		}
	    });
	    this.verifyWindowCancelButton = RPG.elementFactory.buttons.cancelButton({
		'class' : 'WinFootLeft',
		events : {
		    click : function(event) {
			this.verifyWindow.minimize();
		    }.bind(this)
		}
	    });
	    $('verifyWindow').adopt(this.verifyWindowButton,this.verifyWindowCancelButton);
	}
	$(this.verifyWindowKeyInput).focus();
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
	if (this.verifyWindow) {
	    this.verifyWindow.showSpinner();
	}
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=verify&'+Object.toQueryString(options),
	    onFailure : function(error) {
		if (this.verifyWindow) {
		    this.verifyWindow.hideSpinner();
		}
		RPG.Error.show(error);
	    }.bind(this),
	    onSuccess : function(appOptions) {
		this.setOptions(appOptions.user);
		MUI.notification('Verification Successful<br>Welcome: '+appOptions.user.name);
		if (this.verifyWindow) {
		    this.verifyWindow.hideSpinner();
		    this.minimizeAllUserWindows();
		}
		this.fireEvent('login',[appOptions]);
	    }.bind(this)
	}).get();

    },

    minimizeAllUserWindows : function() {
	if (this.loginWindow) {
	    this.loginWindow.minimize();
	}
	if (this.verifyWindow) {
	    this.verifyWindow.minimize();
	}
	if (this.forgotWindow) {
	    this.forgotWindow.minimize();
	}
	if (this.registerWindow) {
	    this.registerWindow.minimize();
	}
    }
});