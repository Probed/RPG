RPG.rpgApplication = new Class({
    Implements:[Options,Events],//mootools events and options
    pageHandlers : [],
    options : {

    },
    initialize : function(options) {
	this.setOptions(options);

	/**
	 * Initialize the user
	 */
	RPG.AppUser = new RPG.User(this.options.user);

	/**
	 * Initialize primary Application Tips
	 */
	this.tips = new Tips([],{
	    showDelay : 250,
	    fixed : true,
	    offset : {
		x : 0,
		y : 30
	    }
	});
	this.menuTips = new Tips([],{
	    showDelay : 100,
	    fixed : true,
	    offset : {
		x : 200,
		y : -10
	    }
	});

	/**
	 * Create the DOM elements that will comprise the skeleton of the MochaUI
	 * Currently :
	 * Desktop
	 *	- Desktop Header
	 *	    - desktopTitlebarWrapper
	 *		- desktopTitlebar
	 *	    - desktopNavbar
	 *	- Dock Wrapper
	 *	    - Dock
	 *		- Dock Placement
	 *		- Dock AutoHide
	 *		- Dock Sort
	 *		    - Dock Clear
	 *	- Page Wrapper
	 *	- Desktop Footer Wrapper
	 *	    - Desktop Footer
	 */
	this.desktop = new Element('div',{
	    id : 'desktop'
	}).adopt(
	    this.desktopHeader = new Element('div',{
		id : 'desktopHeader'
	    }),
	    this.dockWrapper = new Element('div',{
		id : 'dockWrapper'
	    }),
	    this.pageWrapper = new Element('div',{
		id : 'pageWrapper'
	    })
	    //	    ,
	    //	    this.desktopFooterWrapper = new Element('div',{
	    //		id : 'desktopFooterWrapper'
	    //	    })
	    );

	this.desktopHeader.adopt(
	    (this.desktopTitlebarWrapper = new Element('div',{
		id : 'desktopTitlebarWrapper'
	    })).adopt(
		this.desktopTitlebar = new Element('div',{
		    id : 'desktopTitlebar'
		})
		)
	    );
	this.desktopTitlebar.adopt(
	    (this.topNav = new Element('div',{
		id : 'topNav'
	    })).adopt(
		this.getTopNav()
		)
	    );

	this.dockWrapper.adopt(
	    (this.dock = new Element('div',{
		id : 'dock'
	    })).adopt(
		this.dockPlacement = new Element('div',{
		    id : 'dockPlacement'
		}),
		this.dockAutoHide = new Element('div',{
		    id : 'dockAutoHide'
		}),
		(this.dockSort = new Element('div',{
		    id : 'dockSort'
		})).adopt(
		    this.dockClear = new Element('div',{
			id : 'dockClear'
		    })
		    )
		)
	    );

	//	this.desktopFooterWrapper.adopt(
	//	    this.desktopFooter = new Element('div',{
	//		id : 'desktopFooter'
	//	    })
	//	    );

	/**
	 * Put the Application Dom Element on the DOM Tree
	 */
	$(document.body).adopt(this.desktop);

	/**
	 * Now that the desktop is on the DOM
	 * we can initialize the Mocha User Interface
	 */
	MUI.myChain = new Chain();
	MUI.myChain.chain(
	    function(){
		MUI.Desktop.initialize();
	    },
	    function(){
		MUI.Dock.initialize();
	    },
	    function(){
		this.initializeColumns();
	    }.bind(this),
	    function(){
		this.initializeWindows();
	    }.bind(this)
	    ).callChain();

	/**
	 * Start Listening for url Hash changes
	 */
	window.addEvent('hashchange',function(event) {
	    if (window.location.hash) {
		this.browseTo(window.location.hash);
	    }
	}.bind(this));
	if (window.location.hash) {
	    this.browseTo(window.location.hash);
	}

	/**
	 * Start Listening for User Events
	 */
	RPG.AppUser.addEvent('login',this.onLogin = function(appOptions) {
	    this.setOptions(appOptions);
	    this.topNavUserName.set('html','<span class="User">'+RPG.AppUser.options.name+'</span>');
	    this.updateAccountPanel();
	    [this.topNavSign].each(function(elm){
		elm.hide();
	    });
	    this.topNavLogout.setStyle('display','inline');
	    if (self.location.hash == '#Play' || self.location.hash == 'MapEditor') {
		this.browseTo(self.location.hash);
	    }
	}.bind(this));
	RPG.AppUser.addEvent('logout',this.onLogout = function(appOptions) {
	    this.setOptions(appOptions);
	    this.topNavUserName.set('html','<span class="User">'+RPG.AppUser.options.name+'</span>');
	    this.updateAccountPanel();
	    [this.topNavSign].each(function(elm){
		elm.setStyle('display','inline');
	    });
	    this.topNavLogout.hide();
	    if (self.location.hash == '#Play' || self.location.hash == 'MapEditor') {
		this.browseTo('#Home');
	    }
	}.bind(this));

	if (RPG.AppUser.options.isLoggedIn) {
	    this.onLogin(this.options);
	} else {
	    this.onLogout(this.options);
	}
	if (!self.location.hash) {
	    this.browseTo('#Play');
	}
    },
    toElement : function() {
	return this.desktop;
    },
    initializeColumns : function() {

	/**
	 *Left Column (Holds Menu/Donate/Contact)
	 */
	new MUI.Column({
	    id : 'leftColumn',
	    placement : 'left',
	    width : 175,
	    resizeLimit : [165,300],
	    sortable : false,
	    collapsible : false
	});

	/**
	 * Middle Column (holds Main Content)
	 */
	new MUI.Column({
	    id : 'mainColumn',
	    placement : 'main',
	    sortable : false
	});

	/*
	 * Right Column (holds Account/Help)
	 */
	new MUI.Column({
	    id : 'rightColumn',
	    placement : 'right',
	    width : 156,
	    resizeLimit : [50,300],
	    sortable : false,
	    isCollapsed : false
	});


	/*
	 * Main Menu Panel. uses this.getMainMenu() to retrieve the element populated into this panel.
	 */
	this.pnlMainMenu = new MUI.Panel({
	    id: 'pnlMainMenu',
	    column: 'leftColumn',
	    collapsible : true,
	    header : true,
	    loadMethod : 'html',
	    require: {
		css: [MUI.path.plugins + 'tree/css/style.css'],
		js: [MUI.path.plugins + 'tree/scripts/tree.js'],
		onloaded: function(){
		    if (buildTree) buildTree('treeMainMenu');
		}
	    },
	    title: new Element('div',{
		'class' : 'Pointer',
		html : 'Main Menu',
		events : {
		    click : function(event) {
			this.pnlMainMenu.collapseToggleEl.collapseClick(event);
			event.stopPropagation();
		    }.bind(this)
		}
	    }),
	    headerToolbox : true,
	    headerToolboxContent : new Element('div',{
		'class' : 'toolbox divider'
	    }).adopt(
		this.mainMenuRefresh = RPG.elementFactory.headerToolBox.refresh({
		    events : {
			click : function() {
			    if (this.mainMenuRefresh.hasClass('AsyncWait') || this.mainMenuRefresh.hasClass('Yes')) {
				return;
			    }
			    this.mainMenuRefresh.swapClass('Refresh','AsyncWait')
			    this.reloadMainMenu(function(){
				this.mainMenuRefresh.swapClass('AsyncWait','Yes');
				setTimeout(function(){
				    this.mainMenuRefresh.swapClass('Yes','Refresh');
				}.bind(this),1500);
			    }.bind(this));
			}.bind(this)
		    }
		})
		),
	    content : this.getMainMenu(RPG.mainMenu, RPG.pages)
	});

	/**
	 * Account Panel (Login/Logout/Account Stuff)
	 */
	this.pnlAccount = new MUI.Panel({
	    id: 'pnlAccount',
	    title: new Element('div',{
		'class' : 'Pointer',
		html : 'Account',
		events : {
		    click : function(event) {
			this.pnlAccount.collapseToggleEl.collapseClick(event);
			event.stopPropagation();
		    }.bind(this)
		}
	    }),
	    headerToolbox : true,
	    headerToolboxContent : new Element('div').adopt(
		new Element('div',{
		    'class' : 'toolbox divider'
		}).adopt(
		    RPG.elementFactory.headerToolBox.help({
			events : {
			    click : function() {

			    }.bind(this)
			}
		    })
		    ),
		new Element('div',{
		    'class' : 'toolbox divider'
		}).adopt(
		    RPG.elementFactory.headerToolBox.refresh({
			events : {
			    click : function() {

			    }.bind(this)
			}
		    })
		    )
		),
	    column: 'rightColumn',
	    isCollapsed : false,
	    content : this.getAccountContent()
	});

	/**
	 * Donate Panel. holds links to donate.
	 */
	this.pnlDonate = new MUI.Panel({
	    id: 'pnlDonate',
	    title: new Element('div',{
		'class' : 'Pointer',
		html : 'Donate',
		events : {
		    click : function(event) {
			this.pnlDonate.collapseToggleEl.collapseClick(event);
			event.stopPropagation();
		    }.bind(this)
		}
	    }),
	    headerToolbox : true,
	    headerToolboxContent : new Element('div',{
		'class' : 'toolbox divider'
	    }).adopt(
		RPG.elementFactory.headerToolBox.help({
		    events : {
			click : function() {
			    this.reloadDonate();
			}.bind(this)
		    }
		})
		),
	    loadMethod : 'html',
	    content : this.getDonateContent().toElement(),
	    column: 'leftColumn',
	    height : 90
	});

	/**
	 * Contact Panel
	 */
	this.pnlContact = new MUI.Panel({
	    id: 'pnlContact',
	    title: new Element('div',{
		'class' : 'Pointer',
		html : 'Contact',
		events : {
		    click : function(event) {
			this.pnlContact.collapseToggleEl.collapseClick(event);
			event.stopPropagation();
		    }.bind(this)
		}
	    }),
	    loadMethod : 'html',
	    headerToolbox : true,
	    headerToolboxContent : new Element('div',{
		'class' : 'toolbox divider'
	    }).adopt(
		RPG.elementFactory.headerToolBox.help({
		    events : {
			click : function() {
			    this.reloadContact();
			}.bind(this)
		    }
		})
		),
	    content : this.getContactContent().toElement(),
	    column: 'rightColumn',
	    isCollapsed : false,
	    height : 150
	});

	/*
	 * Main Content Panel
	 */
	new MUI.Panel({
	    id: 'pnlMainContent',
	    title: this.pnlMainContentTitle = new Element('div',{
		id : 'pnlMainContentTitle',
		html : '&nbsp;'
	    }),
	    column: 'mainColumn',
	    collapsible : false,
	    header : true,
	    headerToolbox : true,
	    headerToolboxContent : new Element('div').adopt(
		new Element('div',{
		    'class' : 'toolbox divider'
		}).adopt(
		    RPG.elementFactory.headerToolBox.help({
			events : {
			    click : function() {

			    }.bind(this)
			}
		    })
		    ),
		new Element('div',{
		    'class' : 'toolbox divider'
		}).adopt(
		    RPG.elementFactory.headerToolBox.print({
			events : {
			    click : function() {

			    }.bind(this)
			}
		    })
		    )
		)
	});

	//	this.pnlConsole = new MUI.Panel({
	//	    id: 'pnlMainFooter',
	//	    title: new Element('div',{
	//		'class' : 'Pointer',
	//		html : 'Console',
	//		events : {
	//		    click : function(event) {
	//			this.pnlConsole.collapseToggleEl.collapseClick(event);
	//			event.stopPropagation();
	//		    }.bind(this)
	//		}
	//	    }),
	//	    column: 'mainColumn',
	//	    collapsible : true,
	//	    isCollapsed : true
	//	});

	/*
	 * Help Panel
	 */
	this.pnlHelp = new MUI.Panel({
	    id: 'pnlHelp',
	    title: new Element('div',{
		'class' : 'Pointer',
		html : 'Help',
		events : {
		    click : function(event) {
			this.pnlHelp.collapseToggleEl.collapseClick(event);
			event.stopPropagation();
		    }.bind(this)
		}
	    }),
	    headerToolbox : true,
	    headerToolboxContent : new Element('div').adopt(
		new Element('div',{
		    'class' : 'toolbox divider'
		}).adopt(
		    RPG.elementFactory.headerToolBox.print({
			events : {
			    click : function() {

			    }.bind(this)
			}
		    })
		    ),
		new Element('div',{
		    'class' : 'toolbox divider'
		}).adopt(
		    RPG.elementFactory.headerToolBox.refresh({
			events : {
			    click : function() {

			    }.bind(this)
			}
		    })
		    )
		),
	    column: 'rightColumn'
	});


	MUI.myChain.callChain();
    },
    initializeWindows : function() {

	MUI.myChain.callChain();
    },
    reloadTopNav : function() {
	if (this.topNav) {
	    this.topNav.empty().adopt(this.getTopNav());
	}
    },
    getTopNav : function() {
	this.topNavUl = new Element('ul',{
	    'class' : 'menu-right',
	    id : 'topNavUI'
	}).adopt(

	    /*
	 * Welcome
	 */
	    (new Element('li')).adopt(
		new Element('span',{
		    html : 'Welcome: '
		}),
		this.topNavUserName = RPG.elementFactory.buttons.actionButton({
		    html : '<span class="User">'+RPG.AppUser.options.name+'</span>',
		    events : {
			click : function(event) {
			//RPG.AppUser.showUserDetails();
			}.bind(this)
		    }
		})
		),
	    /**
	 * Sign In / Register
	 */
	    (this.topNavSign = new Element('li',{
		styles : {
		    display : (!RPG.AppUser.isLoggedIn?'inline-block':'none')
		}
	    })).adopt(
		new Element('span',{
		    styles : {
			display : 'inline-block'
		    }
		}).adopt(
		    RPG.AppUser.getLoginLink(),
		    new Element('span',{
			html : ' / '
		    }),
		    RPG.AppUser.getRegistrationLink(),
		    new Element('span',{
			html : ' / '
		    }),
		    RPG.AppUser.getVerifyLink()
		    )
		),
	    /**
	 *  Logout
	 */
	    (this.topNavLogout = new Element('li',{
		styles : {
		    display : (RPG.AppUser.isLoggedIn?'inline-block':'none')
		}
	    })).adopt(
		RPG.AppUser.getLogoutLink()
		)
	    );
	return this.topNavUl;
    },
    reloadDonateContent : function() {
	if (this.donateTable) {
	    this.donateTable.dispose();
	}
	MUI.updateContent({
	    element : 'pnlDonate',
	    loadMethod : 'html',
	    content : this.getDonateContent()
	});
    },
    getDonateContent : function() {
	this.donateTable = new HtmlTable({
	    zebra : true,
	    selectable : false,
	    useKeybaord : false,
	    properties : {
		cellpadding : 2,
		styles : {
		    width : '100%'
		}
	    },
	    rows  : [
	    [
	    {
		properties : {
		    'class' : 'textCenter'
		},
		content : new Element('div', {
		    'class' : 'Pointer BitcoinDonate_rev',
		    html : '&nbsp;',
		    'title' : 'Donate via Bitcoin using the address below.',
		    events : {
			click : function(event) {
			//@Todo open bitcoin donate form
			}
		    }

		})
	    },
	    {
		properties : {
		    'class' : 'textCenter'
		},
		content : new Element('div', {
		    'class' : 'Pointer PaypalDonate',
		    html : '&nbsp;',
		    title : 'Donate via Paypal!',
		    events : {
			click : function(event) {
			//@Todo open paypal donate form
			}
		    }

		})
	    }
	    ],
	    [
	    {
		properties : {
		    'class' : 'textMedium textCenter'
		},
		content : RPG.elementFactory.buttons.actionButton({
		    'html' : 'Copy',
		    'tipTitle' : 'Copy Address',
		    'tipText' : 'Copies the bitcoin address to you clipboard',
		    tips : this.menuTips,
		    events : {
			click : function(event) {

			}.bind(this)
		    }
		})
	    },
	    {
		properties : {
		    'class' : 'textMedium textCenter'
		},
		content : 'Bitcoin Address:'
	    }
	    ],
	    [
	    {
		properties : {
		    'class' : 'textTiny textCenter',
		    colspan : 2
		},
		content : RPG.appInfo.bitcoinDonate
	    }
	    ]
	    ]
	});
	return this.donateTable;
    },
    reloadContactContent : function() {
	if (this.contactTable) {
	    this.contactTable.dispose();
	}
	MUI.updateContent({
	    element : this.pnlContact,
	    loadMethod : 'html',
	    content : this.getContactContent()
	});
    },
    getContactContent : function() {
	this.contactTable = new HtmlTable({
	    zebra : true,
	    selectable : false,
	    useKeybaord : false,
	    properties : {
		cellpadding : 1,
		styles : {
		    width : '100%'
		}
	    },
	    rows  : [
	    [
	    {
		properties : {
		    'class' : '',
		    colspan : 2
		},
		content : 'Admin Email'
	    }
	    ],
	    [
	    {
		properties : {
		    'class' : '',
		    colspan : 2
		},
		content : new Element('a', {
		    html : RPG.appInfo.adminEmail,
		    href : 'mailto:'+RPG.appInfo.adminEmail
		})
	    }
	    ],
	    [
	    {
		properties : {
		    'class' : ''
		},
		content : 'Feedback'
	    },
	    {
		properties : {
		    'class' : ''
		},
		content : new Element('a', {
		    html : 'Submit Now',
		    href : 'javascript:void(0);',
		    events : {
			click : function(event) {
			//@Todo open feedback form
			}
		    }
		})
	    }
	    ],
	    [
	    {
		properties : {
		    'class' : ''
		},
		content : 'Petition'
	    },
	    {
		properties : {
		    'class' : ''
		},
		content : new Element('a', {
		    html : 'Submit Now',
		    href : 'javascript:void(0);',
		    events : {
			click : function(event) {
			//@Todo open Pitition form
			}
		    }
		})
	    }
	    ],
	    [
	    {
		properties : {
		    'class' : ''
		},
		content : 'Aliens'
	    },
	    {
		properties : {
		    'class' : ''
		},
		content : new Element('a', {
		    html : 'Contact Now',
		    href : 'javascript:void(0);',
		    events : {
			click : function(event) {
			//@Todo open alient contact form
			}
		    }
		})
	    }
	    ]
	    ]
	});
	return this.contactTable;
    },

    updateAccountPanel : function() {
	MUI.updateContent({
	    element : $('pnlAccount'),
	    loadMethod : 'html',
	    content : this.getAccountContent()
	});
    },
    getAccountContent : function() {
	if (RPG.AppUser.options.isLoggedIn){
	    var tbl = new HtmlTable({
		zebra : true,
		selectable : false,
		useKeybaord : false,
		properties :{
		    cellpadding : 2
		}
	    });
	    ['userID','name','email','created','updated','lastLogin'].each(function(col){
		tbl.push([
		{
		    properties : {
			'class' : 'textMedium textLeft'
		    },
		    content : col
		},
		{
		    properties : {
			'class' : 'textMedium textLeft'
		    },
		    content : RPG.AppUser.options[col] || '&nbsp;'
		}
		]);
	    }.bind(this));
	    tbl.push([
	    {
		properties : {
		    'class' : 'textMedium textLeft'
		},
		content : 'My Maps'
	    },
	    {
		properties : {
		    'class' : 'textMedium textLeft'
		},
		content : RPG.elementFactory.menu.pageLink({
		    'display' : 'Map Editor',
		    'hashTag' : '#MapEditor'
		})

	    }
	    ]);
	    return tbl.toElement();
	} else {
	    return RPG.AppUser.smallLoginDiv;
	}
    },

    reloadMainMenu : function(onSuccess) {
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=reloadMainMenu',
	    onFailure : function(error) {
		RPG.Error.show(error);
	    }.bind(this),
	    onSuccess : function(newMenu) {
		var oldTree = this.menuTreeEl;
		var newTree = this.getMainMenu(newMenu.mainMenu,newMenu.pages);
		if (newTree && oldTree) {
		    newTree.replaces(oldTree);
		    oldTree.dispose();
		    if (buildTree) {
			buildTree('treeMainMenu');
		    }
		    //overwrite the global variabe pages with this newly downloaded version
		    RPG.pages = newMenu.pages;
		    RPG.mainMenu = newMenu.mainMenu;
		}
		if (typeOf(onSuccess) == 'function') {
		    onSuccess();
		}
		this.pageLinkCurrent(window.location.hash);
	    }.bind(this)
	}).get();
    },
    getMainMenu : function(mainMenu, pages) {
	pages.each(function(page) {
	    if (page && page.treeParent && mainMenu[page.treeParent] && mainMenu[page.treeParent].items) {
		if (page.pageLink) {
		    page.pageLink.dispose();
		}
		mainMenu[page.treeParent].items.push({
		    display : page.pageLink = RPG.elementFactory.menu.pageLink(Object.merge(page,{
			tips:this.menuTips
		    }))
		});
	    }
	}.bind(this));
	return this.buildTreeElements([mainMenu['Main'],mainMenu['Players'],mainMenu['Forum'],mainMenu['Patches']],'treeMainMenu');
    },

    buildTreeElements : function(tree,id) {
	this.menuTreeEl = new Element('ul', {
	    id : id,
	    'class' : 'tree'
	});
	tree.each(function(topLevel) {
	    if (!topLevel) {
		return;
	    }
	    var subUl = new Element('ul');
	    topLevel.items.each(function(subLevel) {
		subUl.adopt(
		    new Element('li',{
			}).adopt(
			subLevel.display
			)
		    );
	    });
	    this.menuTreeEl.adopt(new Element('li',{
		'class' : topLevel['class']
	    }).adopt(
		new Element('span',{
		    html : topLevel.display
		}),
		subUl
		)
	    );
	}.bind(this));

	return this.menuTreeEl;
    },
    browseTo : function(url) {
	new Request.JSON({
	    url : '/index.njs?xhr=true&a='+(url.replace(/\#/,'')),
	    onFailure : function(error) {
		RPG.Error.show(error);
	    }.bind(this),
	    onSuccess : function(page) {
		/**
		 * Using the returned object use or create the
		 * specified object to handle the response
		 */
		var onloaded = function() {
		    if (page.populates && RPG[page.requires.exports]) {
			if (!this.pageHandlers[Object.toQueryString(page.requires)]) {
			    this.pageHandlers[Object.toQueryString(page.requires)] = new RPG[page.requires.exports](page.options);
			}
			MUI.updateContent({
			    element : $(page.populates),
			    loadMethod : 'html',
			    content : this.pageHandlers[Object.toQueryString(page.requires)].toElement(),
			    title : page.title
			});
			this.pageHandlers[Object.toQueryString(page.requires)].populate(page);
			if (page.title) {
			    document.title = page.title;
			}
			if (page && page.requires && page.requires.exports == 'MapEditor') {
			    if ($('pnlMainMenu') && $('pnlMainMenu').hasClass('expanded')) {
				$('pnlMainContent_header').hide();
				this.pnlMainMenu.collapseToggleEl.collapseClick();
			    }
			} else {
			    if ($('pnlMainMenu') && $('pnlMainMenu').hasClass('collapsed')) {
				$('pnlMainContent_header').show();
				this.pnlMainMenu.collapseToggleEl.collapseClick();
			    }
			}
		    }
		}.bind(this);

		if (page && page.requires) {
		    if (!this.pageHandlers[Object.toQueryString(page.requires)]) {
			new MUI.Require(Object.merge({
			    onloaded : onloaded
			},page.requires));
		    } else {
			onloaded();
		    }

		}
		this.pageLinkCurrent(url);
	    }.bind(this)
	}).get();
    },
    pageLinkCurrent : function(url) {
	$$('.pageLinkCurrent').each(function(link){
	    if (link && link.removeClass) {
		link.removeClass('pageLinkCurrent');
	    }
	});
	$$('.page'+url.toMD5()).each(function(link){
	    if (link && link.addClass) {
		link.getParent().addClass('pageLinkCurrent');
	    }
	});
    }

});