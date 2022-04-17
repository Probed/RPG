/**
 * Initialize our global namespace object.
 */
var RPG = {};

define([
    "./jx/jxlib.standalone",
    "./mootools/MooHashChange",
    "../common/string.utf8",
    "../common/string.md5",
    "../common/appInfo",
    "./User/User",
    "./Character/ListCharacters",
    "../common/pages",
    ], function() {

	RPG.rpgApplication = new Class({
	    Implements:[Options,Events],//mootools events and options
	    pageHandlers : [],
	    options : {

	    },
	    initialize : function(options) {
		this.setOptions(options);
		$$('.siteLoad').destroy();
		RPG.App = this;

		Jx.Stack.base = 10;
		Jx.Stack.increment = 5;

		/**
		 * Initialize the user
		 */
		RPG.AppUser = new RPG.User(this.options.user);

		RPG.App.container = new Jx.Container({
		    parent: 'body',
		    topLevel : true,
		    layoutManager: 'anchored',
		    items: [
		    {
			'class': Jx.Toolbar,
			layoutOpts: {
			    height: 28
			},
			options : {
			    scroll : false,
			    align: 'center',
			    items : [
			    new Jx.Menu({
				id: 'home',
				label: 'RPG Main',
				image: '/client/jx/themes/dark/images/logo_s.png',
				tooltip: 'Home Page',
				toggle : false
			    }).add(
				(function(){
				    var mnus = [];
				    Object.each(RPG.mainMenu,function(options,menu){
					mnus.push(new Jx.Menu.SubMenu({
					    label : options.label
					}));
					RPG.pages.each(function(item){
					    if (item.treeParent == menu) {
						mnus[mnus.length-1].add(new Jx.Menu.Item({
						    label : item.label,
						    image : item.image,
						    onClick : function(){
							if (document.location.hash != item.hashTag) {
							    document.location.href = item.hashTag;
							} else {
							    RPG.App.browseTo(window.location.hash);
							}
						    }
						}));
					    }
					});
				    });
				    mnus.push(this.mapEditorMenuItem = new Jx.Menu.Item({
					label: 'Map Editor',
					image: '/client/jx/themes/dark/images/maps-stack.png',
					onClick : function() {
					    if (!RPG.MapEditor) {
						require(['./client/Game/MapEditor'],function(){
						    $('pnlMainContent').empty().adopt(RPG.MapEditor.populate().toElement());
						});
					    } else {
						$('pnlMainContent').empty().adopt(RPG.MapEditor.toElement());
					    }
					}
				    }));
				    return mnus;
				}.bind(this)())
				),
			    new Jx.Toolbar.Separator(),
			    this.playNowBtn = new Jx.Button({
				id: 'play',
				label: 'Play Now',
				image: '/client/jx/themes/dark/images/map--arrow.png',
				tooltip: 'Play Now',
				onClick : function() {
				    if (!RPG.playNowDialog) {
					RPG.playNowDialog = new Jx.Dialog({
					    label : 'Select or Create a Character',
					    image: '/client/jx/themes/dark/images/character.png',
					    resize : true,
					    modal : false,
					    collapse:false,
					    height : 400,
					    width : 500,
					    content : this.playTabs = new Jx.TabBox({
						scroll : false,
						align: 'center'
					    }).add(
						this.charListTab = new Jx.Tab({
						    label: 'Character Listing',
						    image: '/client/jx/themes/dark/images/character.png',
						    content : RPG.ListCharacters.toElement(),
						    onDown : function() {
							var pnBtn = this.playNowBtn;
							var clTab = this.charListTab;
							var cBtn = this.charBtn;
							if (!this.listPlayEvent) {
							    this.listPlayEvent = RPG.ListCharacters.addEvents({
								play : function(character) {
								    require(['./client/Game/Game'],function(){
									pnBtn.setBusy(true);
									clTab.setBusy(true);
									RPG.Game.load({
									    character : character
									},function(){
									    RPG.playNowDialog.close();
									    pnBtn.setBusy(false);
									    clTab.setBusy(false);
									    cBtn.toElement().show();
									});
								    });
								}
							    });
							} else {
							    clTab.setBusy(true);
							}
							pnBtn.setBusy(true);
							RPG.ListCharacters.loadList(function(){
							    pnBtn.setBusy(false);
							    clTab.setBusy(false)
							}.bind(this));
						    }.bind(this)
						}),
						this.newCharTab = new Jx.Tab({
						    label: 'New Character',
						    image: '/client/jx/themes/dark/images/plus.png',
						    content : RPG.createCharacterDiv = new Element('div'),
						    onDown : function() {
							if (!RPG.CreateCharacter) {
							    var pnBtn = this.playNowBtn;
							    var ncTab = this.newCharTab;
							    var cBtn = this.charBtn;
							    pnBtn.setBusy(true);
							    ncTab.setBusy(true);
							    require(['./client/Character/CreateCharacter'],function(){
								pnBtn.setBusy(false);
								ncTab.setBusy(false);
								RPG.createCharacter = new RPG.CreateCharacter({
								    onPlay : function(game) {
									pnBtn.setBusy(true);
									ncTab.setBusy(true);
									require(['./client/Game/Game'],function(){
									    RPG.Game.load(game,function(){
										RPG.playNowDialog.close();
										pnBtn.setBusy(false);
										ncTab.setBusy(false);
										cBtn.toElement().show();
									    });
									});
								    }
								});
								RPG.createCharacterDiv.getParent().adopt(RPG.createCharacter.toElement());
								RPG.createCharacterDiv.destroy();
								Object.erase(RPG,'createCharacterDiv');
								var p = RPG.createCharacter.toElement().getParent().getSize();
								var c = RPG.createCharacter.toElement().getSize();
								var resized  = false;
								if ((c.x - p.x)) {
								    RPG.playNowDialog.options.width = RPG.playNowDialog.options.width + (c.x - p.x)+35;
								    RPG.playNowDialog.resize();
								    resized  = true;
								}
								if ((c.y - p.y)) {
								    RPG.playNowDialog.options.height = RPG.playNowDialog.options.height + (c.y - p.y)+35;
								    RPG.playNowDialog.resize();
								    resized  = true;
								}
								if (resized) {
								    RPG.playNowDialog.position(RPG.playNowDialog,document.body,'center','center');
								}
							    }.bind(this));
							} else {

						    }
						    }.bind(this)
						})
						)
					});
				    }
				    RPG.playNowDialog.open();
				    RPG.playNowDialog.resize();
				}.bind(this),
				toggle : false
			    }),
			    this.charBtn = new Jx.Button({
				id: 'character',
				label: 'Character',
				image: '/client/jx/themes/dark/images/character.png',
				tooltip: 'Play Now',
				onClick : function() {
				    if (!this.charDialog) {
					this.charDialog = new Jx.Dialog({
					    label : 'Euipment / Inventory / Spells / Skills',
					    image: '/client/jx/themes/dark/images/character.png',
					    resize : true,
					    modal : false,
					    collapse:false,
					    height : 580,
					    width : 790,
					    content : this.charTabs = new Jx.TabBox({
						scroll : false,
						align: 'center'
					    }).add(
						this.charEquipTab = new Jx.Tab({
						    label: 'Equipment / Inventory',
						    image: '/client/jx/themes/dark/images/character.png',
						    content : this.charEquipDiv = new Element('div'),
						    onDown : function() {
							if (this.charEquipDiv && RPG.CharacterEquipment) {
							    this.charEquipTab.setBusy(false);
							    this.charEquipDiv.getParent().adopt(RPG.CharacterEquipment.toElement());
							    this.charEquipDiv.destroy();
							}
						    }.bind(this)
						})
						)
					});
				    }
				    if (RPG.CharacterEquipment) {
					RPG.Game && RPG.CharacterEquipment.refresh(RPG.Game.game);
					this.charDialog.open();
					this.charDialog.resize();
				    }
				}.bind(this),
				toggle : false
			    }),
			    new Jx.Toolbar.Separator(),
			    this.loginBtn = new Jx.Button.Flyout({
				id: 'login',
				label: 'Login / Signup Free',
				image: '/client/jx/themes/dark/images/lock--arrow.png',
				tooltip: 'Signup Free today.',
				content : new Jx.TabBox({
				    width: 350,
				    height: 200
				}).add(
				    new Jx.Tab({
					label: 'Login',
					image: '/client/jx/themes/dark/images/lock--arrow.png',
					content: RPG.AppUser.loginWindowDiv
				    }),
				    new Jx.Tab({
					label: 'Signup Free',
					image: '/client/jx/themes/dark/images/pencil--plus.png',
					content: RPG.AppUser.registerWindowDiv
				    }),
				    new Jx.Tab({
					label: 'Verify',
					image: '/client/jx/themes/dark/images/link.png',
					content: RPG.AppUser.verifyWindowDiv
				    }),
				    new Jx.Tab({
					label: 'Forgot',
					image: '/client/jx/themes/dark/images/question.png',
					content: RPG.AppUser.forgotWindowDiv
				    })
				    ),
				toggle : false,
				loadOnDemand: true,
				cacheContent: false,
				onOpen: function(flyout) {},
				onClose: function(flyout) {}
			    }),
			    this.accountBtn = new Jx.Button.Flyout({
				id: 'account',
				enabled : RPG.AppUser.options.isLoggedIn,
				label: 'Guest',
				image: '/client/jx/themes/dark/images/cPanel.png',
				tooltip: 'Welcome Guest',
				toggle : false,
				content : new Jx.TabBox({
				    width: 350,
				    height: 200
				}).add(
				    new Jx.Tab({
					label: 'Account',
					image: '/client/jx/themes/dark/images/safe.png',
					content: 'test'
				    }),
				    new Jx.Tab({
					label: 'Settings',
					image: '/client/jx/themes/dark/images/wrench.png',
					content: 'test'
				    })
				    )
			    }),
			    this.logoutBtn = new Jx.Button({
				id: 'logout',
				label: 'Logout',
				image: '/client/jx/themes/dark/images/lock-unlock.png',
				tooltip: 'Logout',
				toggle : false,
				onClick : function() {
				    RPG.AppUser.logout();
				}
			    })
			    ]
			}
		    },
		    {
			'class' : Jx.Panel,
			layoutOpts : {
			    top: 30
			},
			options : {
			    id : 'pnlMainContent',
			    hideTitle : true
			}
		    }
		    ]
		});

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
		    this.loginBtn.toElement().hide();
		    this.logoutBtn.toElement().show();
		    this.accountBtn.toElement().show();
		    this.accountBtn.setLabel(RPG.AppUser.options.name);
		}.bind(this));
		RPG.AppUser.addEvent('logout',this.onLogout = function(appOptions) {
		    this.setOptions(appOptions);
		    this.loginBtn.toElement().show();
		    this.logoutBtn.toElement().hide();
		    this.accountBtn.toElement().hide();
		    this.accountBtn.setLabel('Guest');
		    this.charBtn.toElement().hide();
		}.bind(this));

		this.charBtn.toElement().hide();

		if (RPG.AppUser.options.isLoggedIn) {
		    this.onLogin(this.options);
		} else {
		    this.onLogout(this.options);
		}
		if (!self.location.hash) {
		    this.browseTo('#Home');
		}
	    },
	    toElement : function() {
		return this.desktop;
	    },

	    createElement : function(content,key) {
		if (key.contains('#')) {
		    var clone = Object.clone(content);
		    var k = Object.keys(clone);
		    var len = k.length;
		    var x = 0;
		    //remove sub elements to get just this elemetns options
		    for(x=0;x<len;x++) {
			if (k[x].contains('#')){
			    Object.erase(clone,k[x]);
			}
		    }
		    var tag = key.split('#')[0];
		    var id = key.split('#')[1];
		    var elm = new Element(tag,Object.merge({
			id : id
		    },clone));
		    return elm;
		}
		return null;
	    },
	    createElementRecurse : function (parentElm, objTree) {
		var len = 0;
		var k = 0;
		var i = 0;
		var elm = null;
		if (typeOf(objTree) == 'object') {
		    k = Object.keys(objTree);
		    len = k.length;
		    for(i=0;i<len;i++){
			elm = RPG.App.createElement(objTree[k[i]],k[i]);
			if (elm) {
			    RPG.App.createElementRecurse(elm,objTree[k[i]]);
			    parentElm.adopt(elm);
			}
		    }
		}
	    },

	    browseTo : function(url) {
		new Request.JSON({
		    url : '/index.njs?xhr=true&a='+(url.replace(/\#/,'')),
		    onFailure : function(error) {
			RPG.Dialog.error(error);
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
				$('pnlMainContent').empty().adopt(this.pageHandlers[Object.toQueryString(page.requires)].toElement())
				this.pageHandlers[Object.toQueryString(page.requires)].populate(page);
				if (page.title) {
				    document.title = page.title;
				}
			    }
			}.bind(this);

			if (page && page.requires) {
			    if (!this.pageHandlers[Object.toQueryString(page.requires)]) {
				require(page.requires.js,onloaded);
			    } else {
				onloaded();
			    }
			}
		    }.bind(this)
		}).get();
	    }

	});

	/**
	 * Various Dialogs
	 */
	RPG.Dialog = {
	    parseMessage : function(m) {
		if (m && m.responseText) {
		    m = JSON.decode(m.responseText);
		}
		if (m.error) {
		    m = m.error;
		}
		if (m.success) {
		    m = m.success;
		}
		var r = '';
		m.each && m.each(function(s) {
		    r += s + '<br>';
		});
		if (r.length > 0) {
		    m = r;
		}
		if (typeOf(m) == 'object') {
		    m = JSON.encode(m);
		}
		return m;
	    },
	    notify : function(message,duration) {
		var dialog = new Jx.Dialog({
		    width : 350,
		    height : 150,
		    label : 'An error has occured:',
		    close : true,
		    resize : true,
		    modal : false,
		    vertical : 'top top',
		    horizontal : 'center center',
		    image : '/client/jx/themes/dark/images/cross.png',
		    content : RPG.Dialog.parseMessage(message),
		    destroyOnClose : true
		});
		dialog.open();
		setTimeout(function(){
		    dialog.close();
		},duration || 1000);
		return dialog;
	    },
	    error : function(error,closed) {
		var dialog = new Jx.Dialog.Message({
		    width : 350,
		    height : 150,
		    label : 'An error has occured:',
		    close : true,
		    resize : true,
		    modal : true,
		    image : '/client/jx/themes/dark/images/cross.png',
		    destroyOnClose : true
		});
		dialog.setMessage(RPG.Dialog.parseMessage(error));
		!closed && dialog.open();
		return dialog;
	    },
	    success : function(success,closed) {
		var dialog = new Jx.Dialog.Message({
		    width : 350,
		    height : 150,
		    label : 'Success:',
		    close : true,
		    resize : true,
		    modal : false,
		    image : '/client/jx/themes/dark/images/tick.png',
		    destroyOnClose : true
		});
		dialog.setMessage(RPG.parseMessage(success));
		!closed && dialog.open();
		return dialog;
	    },

	    form :function(options,closed) {
		var dialog = new Jx.Dialog.Form(Object.merge({
		    label : 'Form Details:',
		    image : '/client/jx/themes/dark/images/ui-scroll-pane-blog.png',
		    destroyOnClose : true
		},options));
		!closed && dialog.open();
		return dialog;
	    }
	}


	Jx.Dialog.Form = new Class({
	    Extends:Jx.Dialog,
	    Family:"Jx.Dialog.Form",
	    options:{
		content:'',
		validate : null,//function called before closing
		useKeyboard:true,
		keys:{
		    'esc':'cancel',
		    'enter':'ok'
		},
		width:400,
		height:400,
		close:true,
		resize:true,
		collapse:false,
		modal:false,
		toolbarOptions:{
		    align:"right",
		    position:'bottom',
		    scroll:false
		}
	    },
	    keyboard:null,
	    render:function(){
		this.buttons=new Jx.Toolbar(this.options.toolbarOptions);
		this.ok=new Jx.Button({
		    label:this.getText({
			set:'RPG',
			key:'form',
			value:'submitLabel'
		    }),
		    onClick:this.onClick.bind(this,true)
		});
		this.reset=new Jx.Button({
		    label:this.getText({
			set:'RPG',
			key:'form',
			value:'resetLabel'
		    })
		//,onClick:this.onClick.bind(this,true)
		});
		this.cancel=new Jx.Button({
		    label:this.getText({
			set:'RPG',
			key:'form',
			value:'cancelLabel'
		    }),
		    onClick:this.onClick.bind(this,false)
		});
		this.buttons.add(this.cancel,new Jx.Toolbar.Separator(),this.reset,new Jx.Toolbar.Separator(),this.ok);
		this.options.toolbars=[this.buttons];
		var type=Jx.type(this.options.content);
		if(type==='string'||type==='object'||type=='element'){
		    this.content=new Element('div',{
			'class':'jxConfirmcontent'
		    });
		    switch(type){
			case'string':case'object':
			    this.content.set('html',this.getText(this.options.content));
			    break;
			case'element':
			    this.options.content.inject(this.content);
			    break;
		    }
		}else{
		    this.content=this.options.content;
		    document.id(this.content).addClass('jxConfirmcontent');
		}
		this.options.content=this.content;
		if(this.options.useKeyboard){
		    var self=this;
		    this.options.keyboardMethods.ok=function(ev){
			ev.preventDefault();
			self.onClick(true);
		    }
		    this.options.keyboardMethods.cancel=function(ev){
			ev.preventDefault();
			self.onClick(false);
		    }
		}
		this.parent();
		if(this.options.useKeyboard){
		    this.keyboard.addEvents(this.getKeyboardEvents());
		}
	    },
	    onClick:function(value){
		if (value && (!this.options.validate || (this.options.validate()))) {
		    this.isOpening=false;
		    this.hide();
		    this.fireEvent('close',[this,value]);
		} else if (!value) {
		    this.isOpening=false;
		    this.hide();
		    this.fireEvent('close',[this,value]);
		}
	    },
	    changeText:function(lang){
		this.parent();
		if(this.ok!=undefined&&this.ok!=null){
		    this.ok.setLabel({
			set:'RPG',
			key:'form',
			value:'submitLabel'
		    });
		}
		if(this.cancel!=undefined&&this.cancel!=null){
		    this.cancel.setLabel({
			set:'RPG',
			key:'form',
			value:'cancelLabel'
		    });
		}
		if(this.reset!=undefined&&this.cancel!=null){
		    this.reset.setLabel({
			set:'RPG',
			key:'form',
			value:'resetLabel'
		    });
		}
		if(Jx.type(this.options.content)==='object'){
		    this.content.set('html',this.getText(this.options.content))
		}
	    }
	});

	Locale.define('en-US','RPG',{
	    form : {
		submitLabel : 'Submit',
		resetLabel : 'Reset',
		cancelLabel : 'Cancel'
	    }
	});

    });