/*
 * MapEditor.js
 *
 * Cient MapEditor Class
 *
 *
 */

RPG.MapEditor = new Class({
    Implements : [Events,Options],
    currentTileCache : {},
    favoritesCache : {},
    tilesets : {},
    currentUniverse : null,
    currentTiles : {},
    rowOffset : 0,
    colOffset : 0,
    mapZoom : 32,
    miniMapZoom : 1,
    rows : 1,
    cols : 1,
    options : {

    },

    /**
     * Init MapEditor
     */
    initialize : function(options) {
	this.setOptions(options);

	this.mapEditorDiv = new Element('div',{
	    'id' : 'mapEditor'
	}).adopt(
	    this.desktopNavbar = new Element('div',{
		id : 'desktopNavbar'
	    }),
	    this.tilePickerDiv = new Element('div',{
		id : 'tilePicker'
	    }),
	    this.miniMap = new Element('div',{
		'class' : 'miniMap'
	    }).adopt(
		this.miniMapCanvas = new Element('canvas',{
		    styles : {
			position : 'absolute'
		    },
		    events : {
			click : function(event) {
			    if (event && event.event.layerX > 0 && event.event.layerY && !this.miniMapDragging) {
				this.rowOffset = Math.floor((event.event.layerY / this.miniMapZoom)  - (this.rows/2));
				this.colOffset = Math.floor((event.event.layerX / this.miniMapZoom) - (this.cols/2));
				this.refreshMap();
			    }
			}.bind(this),
			mousewheel : function(event) {
			    if (event.wheel > 0) {
				this.miniMapZoom += 1;
			    } else {
				this.miniMapZoom -= 1;
			    }
			//this.generateMinimap();
			}.bind(this)
		    }
		}
		)
		)
	    );
	this.miniMapDrag = new Drag(this.miniMapCanvas,{
	    preventDefault : false,
	    stopPropagation : false,
	    snap : 1,
	    onStart : function(event) {
		this.miniMapCanvas.addClass('MoveCursor');
		this.miniMapDragging = true;
	    }.bind(this),
	    onComplete : function(event) {
		this.miniMapCanvas.removeClass('MoveCursor');
		setTimeout(function(){
		    this.miniMapDragging = false;
		}.bind(this),100);
	    }.bind(this),
	    onCancel : function(event) {
		this.miniMapCanvas.removeClass('MoveCursor');
		setTimeout(function(){
		    this.miniMapDragging = false;
		}.bind(this),100);
	    }.bind(this)
	});
	this.miniMapDrag.attach();

	RPG.AppUser.addEvent('login', function(appOptions) {
	    this.showMapTreePanel();
	}.bind(this));
	RPG.AppUser.addEvent('logout', function(appOptions) {
	    this.hideMapPanel();
	}.bind(this));

	/**
	 * Map Editor Event Degelates:
	 */
	this.mapEditorDiv.addEvents({
	    /**
	     * Div Events
	     */
	    'mouseleave' : function(event) {
		this.keyboardEvents.deactivate();
		this.paintingRows = false;
		this.paintingColumns = false;
		this.paintingTiles = false;
	    }.bind(this),
	    'mouseenter' : function(event) {
		this.keyboardEvents.activate();
	    }.bind(this),



	    /**
	     * Nav Bar Stuff:
	     */
	    'click:relay(a.NewUniverse)' : function(event) {
		this.newUniverseWindow();
	    }.bind(this),
	    'click:relay(a.NewMap)' : function(event) {
		this.newMapWindow();
	    }.bind(this),
	    'click:relay(a.NewTileset)' : function(event) {
		this.newTilesetWindow();
	    }.bind(this),
	    'click:relay(a.OpenUniverse)' : function(event) {
		this.listUniverseWindow();
	    }.bind(this),
	    'click:relay(a.Generate)' : function(event) {
		this.generatorWindow(event.target.get('html'));
	    }.bind(this),
	    'click:relay(a.SaveUniverse)' : function(event) {
		this.saveUniverse();
	    }.bind(this),
	    'click:relay(a.CloseUniverse)' : function(event) {
		this.closeUniverse();
	    }.bind(this),
	    'click:relay(a.SaveTileset)' : function(event) {
		this.saveTileset();
	    }.bind(this),

	    'click:relay(a.mnuNewTile)' : function(event) {
		if (event && event.target && event.target.retrieve('path')) {
		    this.tileWindow({
			path : event.target.retrieve('path'),
			cache : RPG.Tiles
		    });
		}
	    }.bind(this),

	    /**
	     *Edit Menu
	     */
	    'click:relay(a.EditGoto)' : function(event) {
		this.gotoWindow();
	    }.bind(this),


	    /**
	     * Map Control Buttons:
	     */
	    'click:relay(td.panUp)' : function(event) {
		if (event && event.shift) {
		    this.rowOffset -= 10;
		} else {
		    this.rowOffset -= 5;
		}
		this.refreshMap();
	    }.bind(this),
	    'mousedown:relay(td.panUp)' : function(event) {
		event.preventDefault();
	    },
	    'mouseenter:relay(td.panUp)' : function(event) {
		this.paintingRows = false;
		this.paintingColumns = false;
		this.paintingTiles = false;
	    }.bind(this),
	    'click:relay(td.panDown)' : function(event) {
		if (event && event.shift) {
		    this.rowOffset += 10;
		} else {
		    this.rowOffset += 5;
		}
		this.refreshMap();
	    }.bind(this),
	    'mousedown:relay(td.panDown)' : function(event) {
		event.preventDefault();
	    },
	    'mouseenter:relay(td.panDown)' : function(event) {
		this.paintingRows = false;
		this.paintingColumns = false;
		this.paintingTiles = false;
	    }.bind(this),
	    'click:relay(td.panLeft)' : function(event) {
		if (event && event.shift) {
		    this.colOffset -= 10;
		    event.preventDefault();
		} else {
		    this.colOffset -= 5;
		}
		this.refreshMap();
	    }.bind(this),
	    'mousedown:relay(td.panLeft)' : function(event) {
		event.preventDefault();
	    },
	    'mouseenter:relay(td.panLeft)' : function(event) {
		this.paintingRows = false;
		this.paintingColumns = false;
		this.paintingTiles = false;
	    }.bind(this),
	    'click:relay(td.panRight)' : function(event) {
		if (event && event.shift) {
		    this.colOffset += 10;
		    event.preventDefault();
		} else {
		    this.colOffset += 5;
		}
		this.refreshMap();
	    }.bind(this),
	    'mousedown:relay(td.panRight)' : function(event) {
		event.preventDefault();
	    },
	    'mouseenter:relay(td.panRight)' : function(event) {
		this.paintingRows = false;
		this.paintingColumns = false;
		this.paintingTiles = false;
	    }.bind(this),

	    'click:relay(td.fillColumn)' : function(event) {
		var col = this.getFillColumn(event);
		if (col == null) return;
		if (event && event.control) {
		    for (var r = 0; r<this.rows; r++) {
			this.deleteSelectedTile({
			    row : r+this.rowOffset,
			    col : col+this.colOffset
			});
		    }
		} else {
		    for (var r = 0; r<this.rows; r++) {
			this.placeSelectedTile({
			    row : r+this.rowOffset,
			    col : col+this.colOffset
			},event.shift);
		    }
		}
	    }.bind(this),
	    'mouseenter:relay(td.fillColumn)' : function(event) {
		this.paintingTiles = false;
		if (this.paintingColumns) {
		    var col = this.getFillColumn(event);
		    if (col == null) return;
		    if (event && event.control) {
			for (var r = 0; r<this.rows; r++) {
			    this.deleteSelectedTile({
				row : r+this.rowOffset,
				col : col+this.colOffset
			    });
			}
		    } else {
			for (var r = 0; r<this.rows; r++) {
			    this.placeSelectedTile({
				row : r+this.rowOffset,
				col : col+this.colOffset
			    },event.shift);
			}
		    }
		}
	    }.bind(this),
	    'mousedown:relay(td.fillColumn)' : function(event) {
		this.paintingColumns = true;
		event.preventDefault();
	    }.bind(this),
	    'mouseup:relay(td.fillColumn)' : function(event) {
		this.paintingColumns = false;
		event.preventDefault();
	    }.bind(this),

	    'click:relay(td.fillRow)' : function(event) {
		var row = this.getFillRow(event);
		if (row == null) return;
		if (event && event.control) {
		    for (var c = 0; c<this.cols; c++) {
			this.deleteSelectedTile({
			    row : row+this.rowOffset,
			    col : c+this.colOffset
			});
		    }
		} else {
		    for (var c = 0; c<this.cols; c++) {
			this.placeSelectedTile({
			    row : row+this.rowOffset,
			    col : c+this.colOffset
			},event.shift);
		    }
		}
	    }.bind(this),
	    'mouseenter:relay(td.fillRow)' : function(event) {
		this.paintingTiles = false;
		if (this.paintingRows) {
		    var row = this.getFillRow(event);
		    if (row == null) return;
		    if (event && event.control) {
			for (var c = 0; c<this.cols; c++) {
			    this.deleteSelectedTile({
				row : row+this.rowOffset,
				col : c+this.colOffset
			    });
			}
		    } else {
			for (var c = 0; c<this.cols; c++) {
			    this.placeSelectedTile({
				row : row+this.rowOffset,
				col : c+this.colOffset
			    },event.shift);
			}
		    }
		}
	    }.bind(this),
	    'mousedown:relay(td.fillRow)' : function(event) {
		this.paintingRows = true;
		event.preventDefault();
	    }.bind(this),
	    'mouseup:relay(td.fillRow)' : function(event) {
		this.paintingRows = false;
		event.preventDefault();
	    }.bind(this),

	    'click:relay(td.floodFill)' : function(event) {
		for (var r = 0; r<this.rows; r++) {
		    for (var c = 0; c<this.cols; c++) {
			this.placeSelectedTile({
			    row : r+this.rowOffset,
			    col : c+this.colOffset
			},event.shift);
		    }
		}
	    }.bind(this),
	    'mousedown:relay(td.floodFill)' : function(event) {
		event.preventDefault();
	    },
	    'mouseenter:relay(td.floodFill)' : function(event) {
		this.paintingRows = false;
		this.paintingColumns = false;
		this.paintingTiles = false;
	    }.bind(this),

	    'click:relay(td.floodDelete)' : function(event) {
		for (var r = 0; r<this.rows; r++) {
		    for (var c = 0; c<this.cols; c++) {
			this.deleteSelectedTile({
			    row : r+this.rowOffset,
			    col : c+this.colOffset
			});
		    }
		}

	    }.bind(this),
	    'mousedown:relay(td.floodDelete)' : function(event) {
		event.preventDefault();
	    },
	    'mouseenter:relay(td.floodDelete)' : function(event) {
		this.paintingRows = false;
		this.paintingColumns = false;
		this.paintingTiles = false;
	    }.bind(this),




	    /**
	     * Map Editing Area
	     */
	    'click:relay(td.M_tileHolder)' : function(event) {
		if (!event) return;
		var options = this.getTileHolderRowCol(event);
		if (!options) return;
		if (event.shift) {
		    this.editTileOrder(options);
		} else if (event.control) {
		    this.deleteSelectedTile(options);
		} else if (event.alt) {
		    this.tilePicker(options);
		} else {
		    this.placeSelectedTile(options);
		}
	    }.bind(this),
	    'mousewheel:relay(td.M_tileHolder)' : function(event) {
		this.paintingRows = false;
		this.paintingColumns = false;
		this.paintingTiles = false;
		//if (event && event.shift) {
		if (event.wheel > 0) {
		    this.mapZoom += 8;
		    this.refreshMap();
		} else if (event.wheel < 0) {
		    this.mapZoom -= 8;
		    this.refreshMap();
		}
		event.preventDefault();
		//} else {

		//}
		event.preventDefault();
	    }.bind(this),
	    'mousedown:relay(td.M_tileHolder)' : function(event) {
		this.paintingTiles = true;
		this.draggingMap = true;
		this.dragMapStart = {
		    x : event.event.pageX,
		    y : event.event.pageY
		};
		event.preventDefault();
	    }.bind(this),
	    'mouseup:relay(td.M_tileHolder)' : function(event) {
		this.paintingTiles = false;
		event.preventDefault();
	    }.bind(this),
	    'mouseenter:relay(td.M_tileHolder)' : function(event) {
		if (!event) return;
		var options = this.getTileHolderRowCol(event);
		if (!options) return;
		if (this.paintingTiles) {
		    if (event.control) {
			this.deleteSelectedTile(options);
		    } else {
			this.placeSelectedTile(options,event.shift);
		    }
		    event.preventDefault();
		}
		if (event && event.shift) {

		    $$('.topColumn'+(options.col-this.colOffset),'.bottomColumn'+(options.col-this.colOffset)).each(function(elm){
			elm.addClass('fillColumn-hover');
		    });
		    $$('.leftRow'+(options.row-this.rowOffset),'.rightRow'+(options.row-this.rowOffset)).each(function(elm){
			elm.addClass('fillRow-hover');
		    });

		}

	    }.bind(this),
	    'mouseleave:relay(td.M_tileHolder)' : function(event) {
		if (!event) return;
		var options = this.getTileHolderRowCol(event);
		if (!options) return;
		$$('.fillColumn-hover').each(function(elm){
		    elm.removeClass('fillColumn-hover');
		});
		$$('.fillRow-hover').each(function(elm){
		    elm.removeClass('fillRow-hover');
		});
	    }.bind(this),

	    'mouseleave:relay(#tilePicker)' : function(event) {
		this.tilePickerDiv.empty().hide();
	    }.bind(this),
	    'click:relay(img.tilePicker)' : function(event) {
		if (event && event.control) {
		    this.deleteSelectedTile(
			Object.merge({
			    selectedTile : event.target
			},event.target.retrieve('options'))
			);
		    this.tilePicker(event.target.retrieve('options'))
		} else {
		    this.expandTree(['currentTileCache__'+event.target.retrieve('tilePath').join('__')]);
		    $$('.selectedTile').removeClass('selectedTile');
		    $$('#currentTileCache__'+event.target.retrieve('tilePath').join('__')+' a').addClass('selectedTile');
		    this.tilePickerDiv.empty().hide();
		}
	    }.bind(this)
	});

	document.body.addEvents({
	    mouseup : function(event) {
		if (this.draggingMap) {
		    this.draggingMap = false;
		    this.dragMapStart = null;

		} else if (this.draggingTileset) {

		    this.dropTileset(event);
		    this.draggingTileset = false;
		    this.hideTilesetDragger();
		}

	    }.bind(this),
	    mousemove : function(event) {
		if (this.draggingMap) {
		    var newRowOffset = Math.floor((this.dragMapStart.y - event.event.pageY) / this.mapZoom) + this.rowOffset;
		    var newColOffset = Math.floor((this.dragMapStart.x - event.event.pageX) / this.mapZoom) + this.colOffset;

		    if (newRowOffset != this.rowOffset || newColOffset != this.colOffset) {
			this.dragMapStart.x = event.event.pageX;
			this.dragMapStart.y = event.event.pageY;
			this.rowOffset = newRowOffset;
			this.colOffset = newColOffset;
			this.refreshMap();
		    }
		    newRowOffset = null;
		    newColOffset = null;

		} else if (this.draggingTileset && this.draggingTilesetTable) {
		    this.draggingTilesetTable.toElement().setPosition({
			x : event.event.pageX - (this.mapZoom/2),
			y : event.event.pageY - (this.mapZoom/2)
		    });
		}
	    }.bind(this)
	});

	this.keyboardEvents = new Keyboard({
	    defaultEventType: 'keyup',
	    events: {
		'alt+n': function(event) {
		    if (this.currentUniverse) {
			this.newMapWindow();
		    } else {
			this.newUniverseWindow();
		    }
		    event.preventDefault();
		}.bind(this),
		'alt+s': function(event){
		    if (event && event.target) {
			this.saveUniverse();
		    }
		}.bind(this),
		'ctrl+c': function(event){
		    if (event && event.target) {

		}
		}.bind(this),
		'ctrl+v': function(event){
		    if (event && event.target) {

		}
		}.bind(this),
		'ctrl+x': function(event){
		    if (event && event.target) {

		}
		}.bind(this),
		'ctrl+z': function(event){
		    if (event && event.target) {

		}
		}.bind(this),
		'ctrl+y': function(event){
		    if (event && event.target) {

		}
		}.bind(this)
	    }
	});

	/**
	 * Test
	 */
	this.currentUniverse = {
	    options : {
		property : {
		    universeName : 'Test',
		    author : 'Test',
		    startMap : 'Test'
		},
		settings : {
		    activeMap : 'Test'
		}
	    },
	    maps : {
		Test : {
		    options : {
			property : {
			    mapName : 'Test',
			    author : 'Test'
			},
			generators : {
			    terrain : {},
			    maze : {}
			}
		    },
		    cache : this.currentTileCache = {},
		    tiles : this.currentTiles = {}

		}
	    }
	};
	/**/

	[window,$('leftColumn').retrieve('instance'),$('rightColumn').retrieve('instance')].each(function(elm) {
	    elm.addEvents({
		'resize' : function(){
		    this.refreshMap();
		//this.positionMinimap();
		}.bind(this)
	    });
	}.bind(this));
	[$('leftColumn').retrieve('instance'),$('rightColumn').retrieve('instance')].each(function(elm) {
	    elm.addEvent('collapse',function(){
		this.refreshMap();
	    //this.positionMinimap();
	    }.bind(this));
	    elm.addEvent('expand',function(){
		this.refreshMap();
	    //this.positionMinimap();
	    }.bind(this))
	}.bind(this));
	if ($('pnlDonate') && $('pnlDonate').hasClass('expanded')) {
	    $('pnlDonate').retrieve('instance').collapseToggleEl.collapseClick();
	}
    },
    toElement : function() {
	return this.mapEditorDiv;
    },
    populate : function(page) {
	this.showMapTreePanel();
	this.populateNavbar();

	this.refreshMapTree('');
	this.refreshMap();

	return this;
    },
    populateNavbar : function() {
	var parentUl = null;

	this.desktopNavbar.empty().adopt(
	    parentUl = new Element('ul').adopt(
		new Element('li').adopt(
		    new Element('a').set('html','File'),
		    new Element('ul').adopt(
			new Element('li').adopt(
			    new Element('a').set('html','Universe').addClass('arrow-right').adopt(
				new Element('span',{
				    'class' : 'kbShortcut',
				    html : 'Alt+U'
				})),
			    new Element('ul').adopt(
				new Element('li').adopt(
				    new Element('a').set('html','New').addClass('NewUniverse').adopt(new Element('span',{
					'class' : 'kbShortcut',
					html : 'Alt+U+N'
				    }))
				    ),
				new Element('li').adopt(
				    new Element('a').set('html','Open').addClass('OpenUniverse').adopt(new Element('span',{
					'class' : 'kbShortcut',
					html : 'Alt+U+O'
				    }))
				    ),
				new Element('li',{
				    'class' : 'divider'
				}).adopt(
				    new Element('a').set('html','Save').addClass('SaveUniverse').adopt(
					new Element('span',{
					    'class' : 'kbShortcut',
					    html : 'Alt+U+S'
					}))
				    ),
				new Element('li',{
				    'class' : 'divider'
				}).adopt(
				    new Element('a').set('html','Close').addClass('CloseUniverse').adopt(new Element('span',{
					'class' : 'kbShortcut',
					html : 'Alt+U+C'
				    }))
				    ),
				new Element('li',{
				    'class' : 'divider'
				}).adopt(
				    new Element('a').set('html','Delete').addClass('DeleteUniverse')
				    )
				)
			    ),
			new Element('li').adopt(
			    new Element('a').set('html','Map').addClass('arrow-right').adopt(
				new Element('span',{
				    'class' : 'kbShortcut',
				    html : 'Alt+M'
				})),
			    new Element('ul').adopt(
				new Element('li').adopt(
				    new Element('a').set('html','New').addClass('NewMap').adopt(new Element('span',{
					'class' : 'kbShortcut',
					html : 'Alt+M+N'
				    }))
				    ),
				new Element('li',{
				    'class' : 'divider'
				}).adopt(
				    new Element('a').set('html','Delete').addClass('DeleteMap')
				    )
				)
			    ),
			new Element('li').adopt(
			    new Element('a').set('html','Tileset').addClass('arrow-right').adopt(
				new Element('span',{
				    'class' : 'kbShortcut',
				    html : 'Alt+T'
				})),
			    new Element('ul').adopt(
				new Element('li').adopt(
				    new Element('a').set('html','New').addClass('NewTileset').adopt(new Element('span',{
					'class' : 'kbShortcut',
					html : 'Alt+T+N'
				    }))
				    ),
				new Element('li',{
				    'class' : 'divider'
				}).adopt(
				    new Element('a').set('html','Save').addClass('SaveTileset').adopt(
					new Element('span',{
					    'class' : 'kbShortcut',
					    html : 'Alt+T+S'
					}))
				    ),
				new Element('li',{
				    'class' : 'divider'
				}).adopt(
				    new Element('a').set('html','Close').addClass('CloseTileset').adopt(new Element('span',{
					'class' : 'kbShortcut',
					html : 'Alt+T+C'
				    }))
				    ),
				new Element('li',{
				    'class' : 'divider'
				}).adopt(
				    new Element('a').set('html','Delete').addClass('DeleteTileset')
				    )
				)
			    ),
			new Element('li',{
			    'class':'divider'
			}).adopt(
			    new Element('a').set('html','Exit').addClass('FileExit')
			    )
			)
		    ),
		new Element('li').adopt(
		    new Element('a').set('html','Edit'),
		    new Element('ul').adopt(
			new Element('li').adopt(
			    new Element('a').set('html','Undo').addClass('mapUndo').adopt(
				new Element('span',{
				    'class' : 'kbShortcut',
				    html : 'Ctrl+Z'
				}))
			    ),
			new Element('li').adopt(
			    new Element('a').set('html','Redo').addClass('mapRedo').adopt(
				new Element('span',{
				    'class' : 'kbShortcut',
				    html : 'Ctrl+Y'
				}))
			    ),
			new Element('li',{
			    'class':'divider'
			}).adopt(
			    new Element('a').set('html','Cut').addClass('EditCut').adopt(
				new Element('span',{
				    'class' : 'kbShortcut',
				    html : 'Ctrl+X'
				}))
			    ),
			new Element('li').adopt(
			    new Element('a').set('html','Copy').addClass('EditCopy').adopt(
				new Element('span',{
				    'class' : 'kbShortcut',
				    html : 'Ctrl+C'
				}))
			    ),
			new Element('li').adopt(
			    new Element('a').set('html','Paste').addClass('EditPaste').adopt(
				new Element('span',{
				    'class' : 'kbShortcut',
				    html : 'Ctrl+V'
				}))
			    ),
			new Element('li').adopt(
			    new Element('a').set('html','Delete').addClass('EditDelete').adopt(
				new Element('span',{
				    'class' : 'kbShortcut',
				    html : 'Delete'
				}))
			    ),
			new Element('li',{
			    'class':'divider'
			}).adopt(
			    new Element('a').set('html','Goto').addClass('editGoto').adopt(
				new Element('span',{
				    'class' : 'kbShortcut',
				    html : 'Ctrl+G'
				}))

			    )
			)
		    ),
		new Element('li').adopt(
		    new Element('a').set('html','Generate'),
		    new Element('ul').adopt(
			new Element('li').adopt(
			    (function(){
				var generators = [];
				Object.each(RPG.Generators,function(content,key){
				    generators.push(new Element('li').adopt(new Element('a').set('html',key).addClass('Generate')))
				});
				return generators;
			    }())
			    )
			)

		    )

		)
	    );
	Object.each(RPG.Tiles,function(content,key) {
	    this.navbarTiles(parentUl,content,key,[]);
	}.bind(this));

    },

    navbarTiles : function (parentUl,content,key,path) {
	if (key == 'options') return;

	var li = null;
	var a = null;
	path.push(key);
	parentUl.adopt(li = new Element('li').adopt(a = new Element('a').set('html',key.capitalize().hyphenate().split('-').join(' ').capitalize())));
	if (content && Object.getLength(content) > (content.options?1:0)) {
	    var subUl = new Element('ul');
	    Object.each(content,function(c2,k2){
		if (k2 == 'options') return;
		if (typeOf(c2) == 'object') {
		    li.adopt(subUl);
		    if (path.length > 1) {
			a.addClass('arrow-right');
		    }
		    this.navbarTiles(subUl,c2,k2,path);
		}
	    }.bind(this));
	    subUl = null;
	} else {
	    a.addClass('mnuNewTile');
	    a.store('path',Array.clone(path));
	}
	a = null;
	li = null;
	path.pop();

    },


    hideMapPanel : function() {
	if ($('pnlMapEditor')) {
	    MUI.closePanel($('pnlMapEditor'));
	}
    },


    showMapTreePanel : function() {
	this.hideMapPanel();
	this.pnlMapEditor = new MUI.Panel({
	    id: 'pnlMapEditor',
	    title: new Element('div',{
		'class' : 'Pointer',
		html : 'Map Tools',
		events : {
		    click : function(event) {
			this.pnlMapEditor.collapseToggleEl.collapseClick();
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

			}.bind(this)
		    }
		})
		),
	    content : new Element('div'),
	    column: 'leftColumn',
	    isCollapsed : false
	});
    },


    getMapTreeEvents : function() {
	return {
	    'click:relay(a.treeTile)' : function(event) {
		if (!event || !event.target) return;

		if (event.target.hasClass('treeNewTile') || event.target.hasClass('selectedTile')) {
		    this.tileWindow({
			path : event.target.retrieve('tilePath'),
			cache : event.target.retrieve('cache')
		    });
		} else {
		    ($$('.selectedTile')||[]).each(function(elm){
			elm && elm.removeClass('selectedTile');
		    });
		    event.target.addClass('selectedTile');
		}
		event.stopPropagation();
	    }.bind(this)
	};
    },

    refreshMapTree : function(addToExpand) {
	var reexpand = [addToExpand];
	$$('#mapEditorTree .f-open').each(function(elm){
	    reexpand.push(elm.id);
	});

	if (this.mapTreeEl && this.mapTreeEl.destroy) {
	    this.mapTreeEl.getElements('b').destroy();
	    this.mapTreeEl.getElements('img').destroy();
	    this.mapTreeEl.getElements('a').destroy();
	    this.mapTreeEl.getElements('div').destroy();
	    this.mapTreeEl.getElements('li').destroy();
	    this.mapTreeEl.getElements('ul').destroy();
	    this.mapTreeEl.getElements('span').destroy();
	    this.mapTreeEl.destroy();
	}

	this.mapTreeEl = new Element('ul', {
	    id : 'mapEditorTree',
	    'class' : 'tree',
	    events : {
		'click:relay(a.editUniverse)' : function(event) {
		    this.editUniverseWindow();
		}.bind(this),
		'click:relay(a.BrowseTilesets)' : function(event) {
		    this.listTilesetsWindow();
		}.bind(this)
	    }
	});
	var pUl = null;//holds the subtree ul
	this.mapTreeEl.addEvents(this.getMapTreeEvents());

	this.mapTreeEl.adopt(new Element('li',{
	    'class' : 'folder',
	    id : 'tilesets'
	}).adopt(new Element('span',{
	    html : 'Tilesets <a class="BrowseTilesets">Browse</a>'
	}),
	pUl = new Element('ul')
	    ));
	Object.each(this.tilesets,function(content, key) {
	    if (key == 'options') return;
	    var ul = null;
	    var li = new Element('li',{
		'class' : 'folder',
		id : 'tilesets__'+key
	    }).adopt(new Element('span',{
		html : key//category
	    }));
	    li.adopt(ul = new Element('ul'));
	    pUl.adopt(li);
	    Object.each(content,function(c,k){
		var a = null;
		ul.adopt(
		    new Element('li',{
			'class' : 'doc',
			id : 'tilesets__'+key+'__'+k
		    }).adopt(new Element('span').adopt(a = new Element('a',{
			'class' : (c.cache == this.currentTileCache?'selectedTileset':''),
			html : k,
			events : {
			    click : function(event){
				if (!a.hasClass('selectedTileset')) {
				    this.changeTileset(key,k);
				} else {
				    this.editTilesetWindow();
				}
				a = null;
			    }.bind(this),
			    mousedown : function(event) {
				this.draggingTileset = true;
				event.stopPropagation();
				event.preventDefault();

			    }.bind(this),
			    mouseleave : function(event) {
				if (this.draggingTileset) {
				    this.showTilesetDragger(event);
				}
				event.preventDefault();
			    }.bind(this),
			    mouseup : function(event) {
				this.draggingTileset = false;
				this.hideTilesetDragger();
				event.stopPropagation();
				event.preventDefault();
			    }.bind(this)
			}
		    }).store('category',key).store('name',k)))
		    );
	    }.bind(this));
	}.bind(this));

	if (!this.currentUniverse) {
	    this.mapTreeEl.adopt(new Element('li',{
		'class' : 'folder',
		id : 'currentUniverse'
	    }).adopt(new Element('span',{
		html : '[Universe] '
	    }).adopt(new Element('a',{
		'class' : 'NewUniverse textCenter',
		html : 'Start New',
		events : {
		    click : function(event) {
			this.newUniverseWindow();
		    }.bind(this)
		}
	    }))));
	} else {
	    this.mapTreeEl.adopt(new Element('li',{
		'class' : 'folder',
		id : 'currentUniverse'
	    }).adopt(new Element('span',{
		html : '[Universe] '
	    }).adopt(new Element('a',{
		'class' : 'editUniverse',
		html : '<b>' + this.currentUniverse.options.property.universeName.capitalize() +'</b>'
	    })),pUl = new Element('ul')
		));

	    Object.each(this.currentUniverse.maps,function(content, key) {
		if (!content || key == 'options') return;
		var ul = null;
		var map = null;
		var li = new Element('li',{
		    'class' : 'doc',
		    id : 'currentUniverse__maps__'+key
		}).adopt(new Element('span').adopt(map = new Element('a',{
		    'class' : 'selectMap'+(content.cache == this.currentTileCache?' selectedMap':''),
		    html : '[Map] <b>'+key + '</b> <small>(' + this.getTileCount(content.tiles) + ' <small>tiles</small></small>)',
		    events : {
			'click' : function(event) {
			    if (map.hasClass('selectedMap')) {
				this.editMapWindow();
			    } else {
				this.changeMap(key);
			    }
			}.bind(this)
		    }
		})));
		//	    li.adopt(ul = new Element('ul'));
		pUl.adopt(li);
	    //	    Object.each(content, function(c,k) {
	    //		this.objToTree(ul,c,k,[key],this.currentTileCache);
	    //	    }.bind(this));
	    //	    li = null;
	    //	    ul = null;
	    }.bind(this));
	}

	this.mapTreeEl.adopt(new Element('li',{
	    'class' : 'folder',
	    id : 'currentTileCache'
	}).adopt(new Element('span',{
	    html : 'Current Map'
	}),pUl = new Element('ul')
	    ));

	Object.each(this.currentTileCache,function(content, key) {
	    if (key == 'options') return;
	    var ul = null;
	    var li = new Element('li',{
		'class' : 'folder',
		id : 'currentTileCache__'+key
	    }).adopt(new Element('span',{
		html : key.capitalize()
	    }));
	    li.adopt(ul = new Element('ul'));
	    pUl.adopt(li);
	    Object.each(content, function(c,k) {
		this.objToTree(ul,c,k,[key],this.currentTileCache);
	    }.bind(this));
	    li = null;
	    ul = null;
	}.bind(this));

	this.mapTreeEl.adopt(new Element('li',{
	    'class' : 'folder',
	    id : 'mapCache'
	}).adopt(new Element('span',{
	    html : 'Create Tile'
	}),
	pUl = new Element('ul')
	    ));
	Object.each(RPG.Tiles,function(content, key) {
	    if (key == 'options') return;
	    var ul = null;
	    var li = new Element('li',{
		'class' : 'folder',
		id :  'mapCache__'+key
	    }).adopt(new Element('span',{
		html : key.capitalize()
	    }));
	    li.adopt(ul = new Element('ul'));
	    pUl.adopt(li);
	    Object.each(content, function(c,k) {
		this.objToTree(ul,c,k,[key],RPG.Tiles);
	    }.bind(this));
	    li = null;
	    ul = null;
	}.bind(this));

	pUl = null;

	MUI.updateContent({
	    element : $('pnlMapEditor'),
	    content : this.mapTreeEl,
	    loadMethod : 'html',
	    onContentLoaded : function() {
		if (buildTree) {
		    buildTree('mapEditorTree');
		    this.expandTree(reexpand);
		}
		reexpand = null;
	    }.bind(this)
	});
    },
    objToTree : function navbarTiles(parentUl,content,key,path,cache) {
	if (key == 'options' || key == 'images') return;
	//if (!content) return;
	var li = null;
	var span = null;
	path.push(key);
	parentUl.adopt(li = new Element('li',{
	    id : (cache == RPG.Tiles?'mapCache':(cache == this.favoritesCache?'favoritesCache':'currentTileCache')) +'__'+ path.join('__')
	}).adopt(span = new Element('span').set('html',key.capitalize())));
	if (content && Object.getLength(content) > (content.options || content.images?(content.images && content.options?2:1):0)) {
	    var subUl = new Element('ul');
	    Object.each(content,function(c,k){
		if (typeOf(c) == 'object') {
		    li.adopt(subUl);
		    li.addClass('folder');
		    this.objToTree(subUl,c,k,path,cache);
		}
	    }.bind(this));
	    subUl = null;
	} else {
	    var a = null;
	    li.addClass(content && content.options && content.options.property && content.options.property.image && typeOf(content.options.property.image.name) != 'array'?'':'add');
	    span.empty().adopt(
		(content && content.options &&  content.options.property && content.options.property.image && typeOf(content.options.property.image.name) == 'string'?
		    new Element('img',{
			id : 'imageCache__'+path.join('__'),
			src : '/common/Map/Tiles/'+path.slice(1,path.length-1).join('/')+'/'+content.options.property.image.name,
			styles : {
			    width : '16px',
			    height : '16px'
			}
		    })
		    :
		    null
		    ),
		a = new Element('a',{
		    html : (content.options && content.options.property && content.options.property.tileName?content.options.property.tileName:key.capitalize()),
		    'class' : 'treeTile'
		}));
	    a.store('tilePath',Array.clone(path));
	    a.store('cache',cache);
	    if (content.options && content.options.property && content.options.property.tileName) {
		a.store('tileOptions',content.options);
	    } else {
		a.addClass('treeNewTile');
	    }
	    a = null;
	}
	li = null;
	span = null;
	path.pop();
    },
    expandTree : function(expandOptions) {
	if (!expandOptions) return;
	expandOptions.each(function(expand){
	    var path = expand.split('__');
	    var cPath = '';
	    path.each(function(p){
		cPath = (cPath?cPath+'__':'')+p;
		var elm = $(cPath);
		if (elm && elm.retrieve && elm.retrieve('toggleFunc') && !elm.hasClass('f-open')) {
		    elm.retrieve('toggleFunc')();
		}
		elm = null;
	    })
	});
    },

    getTileCount : function(mapTiles) {
	var count = 0;
	Object.each(mapTiles,function(col,key) {
	    if (!col) return;
	    Object.each(col,function(tiles){
		if (!tiles) return;
		count += tiles.length;
	    });
	});
	return count;
    },

    newUniverseWindow : function() {
	if ($('newUniverseWindow')) {
	    MUI.closeWindow($('newUniverseWindow'));
	}
	new MUI.Window({
	    id : 'newUniverseWindow',
	    title : 'New Universe',
	    type : 'window',
	    loadMethod : 'html',
	    content : new HtmlTable({
		zebra : false,
		sortable : false,
		useKeyboard : false,
		properties : {
		    cellpadding : 2,
		    styles : {
			width : '100%'
		    }
		},
		rows : [
		[
		{
		    properties : {
			'class' : 'panel-header largeText'
		    },
		    content : 'Universe:'
		}
		],
		[
		{
		    content : RPG.optionCreator.getOptionTable(RPG.universe_options,null,[],null,'newUniverse')
		}
		],
		[
		{
		    properties : {
			'class' : 'panel-header largeText'
		    },
		    content : 'Start Map:'
		}
		],
		[
		{
		    content : RPG.optionCreator.getOptionTable(RPG.map_options,null,[],null,'newMap')
		}
		]
		]
	    }).toElement(),
	    collapsible : false,
	    storeOnClose : false,
	    resizable : true,
	    maximizable : false,
	    closable : true,
	    width : 400,
	    height : 400,
	    onContentLoaded : function() {
		$('newUniverseWindow').adopt(
		    RPG.elementFactory.buttons.actionButton({
			'class' : 'WinFootRight',
			'html' : 'Start New Universe',
			events : {
			    click : function(event) {
				this.startNewUniverse();
			    }.bind(this)
			}
		    }),
		    RPG.elementFactory.buttons.cancelButton({
			'class' : 'WinFootLeft',
			events : {
			    click : function(event) {
				MUI.closeWindow($('newUniverseWindow'));
			    }
			}
		    })
		    );
	    }.bind(this),
	    onClose : function() {

	    }.bind(this)
	});
    },

    startNewUniverse: function() {
	//@todo check existing and warn to save

	/**
	 * Validate the options
	 */
	var universeOptions = RPG.optionCreator.getOptionsFromTable('newUniverseWindow','newUniverse');
	var mapOptions = RPG.optionCreator.getOptionsFromTable('newUniverseWindow','newMap');
	var uniErrors = RPG.optionValidator.validate(universeOptions,RPG.universe_options);
	uniErrors.append(RPG.optionValidator.validate(mapOptions,RPG.map_options));

	if (uniErrors && uniErrors.length > 0) {
	    RPG.Error.show(uniErrors);
	    return;
	}

	new Request.JSON({
	    url : '/index.njs?xhr=true&a=MapEditor&m=checkDupeUniverseName&universeName='+($('property__universeName') && $('property__universeName').value),
	    onFailure : function(error) {
		RPG.Error.show(error);
		universeOptions = null;
		uniErrors = null;
	    }.bind(this),
	    onSuccess : function() {
		Object.erase(this,'currentUniverse');
		Object.erase(this,'currentTiles');

		this.currentUniverse = Object.clone(RPG.universe);
		this.currentUniverse.options = universeOptions;
		var map = Object.clone(RPG.map);
		map.options = mapOptions;
		universeOptions.property.startMap = map.options.property.mapName;
		map.cache = this.currentTileCache = {};
		map.tiles = this.currentTiles = {};
		this.currentUniverse.maps[map.options.property.mapName] = map;

		MUI.closeWindow($('newUniverseWindow'));

		this.refreshMapTree('currentUniverse__maps__'+map.options.property.mapName);
		this.changeMap(map.options.property.mapName);

		MUI.notification('Universe Created Successfully.');
		universeOptions = null;
		uniErrors = null;
	    }.bind(this)
	}).get();
    },

    openUniverse : function(universe) {


	var options = {
	    universeID : universe.options.database.universeID,
	    cols :  this.calcCols(),
	    rows :  this.calcRows()
	};
	/**
	 * Retrieve universe from server
	 */
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=MapEditor&m=openUserUniverse&'+Object.toQueryString(options),
	    onFailure : function(error) {
		RPG.Error.show(error);
	    }.bind(this),
	    onSuccess : function(results) {
		universe.maps = results;
		this.loadUniverse(universe);
		if ($('listUniverseWindow')) {
		    MUI.closeWindow($('listUniverseWindow'));
		}
	    }.bind(this)
	}).get();
    },

    loadUniverse : function(universe) {
	this.currentUniverse = universe;
	if (universe.options.settings && universe.options.settings.activeMap){
	    this.changeMap(universe.options.settings.activeMap);
	} else {
	    this.changeMap(universe.options.property.startMap);
	}
    },

    editUniverseWindow : function() {
	if ($('editUniverseWindow')) {
	    MUI.closeWindow($('editUniverseWindow'));
	}
	if (!this.currentUniverse) {
	    Error.show('No Universe is currently open.');
	    return;
	}

	new MUI.Window({
	    id : 'editUniverseWindow',
	    title : 'Update Universe Options',
	    type : 'window',
	    loadMethod : 'html',
	    content :  RPG.optionCreator.getOptionTable(Object.merge(Object.clone(RPG.universe_options),{
		property : {
		    startMap : Object.keys(this.currentUniverse.maps).erase('options')
		}
	    }),null,[],this.currentUniverse.options,'editUniverse'),

	    collapsible : false,
	    storeOnClose : false,
	    resizable : true,
	    maximizable : false,
	    closable : true,
	    width : 300,
	    height : 200,
	    onContentLoaded : function() {
		$('editUniverseWindow').adopt(
		    RPG.elementFactory.buttons.actionButton({
			'class' : 'WinFootRight',
			'html' : 'Update Universe Options',
			events : {
			    click : function(event) {
				this.editUniverse(RPG.optionCreator.getOptionsFromTable('editUniverseWindow','editUniverse'));
			    }.bind(this)
			}
		    }),
		    RPG.elementFactory.buttons.cancelButton({
			'class' : 'WinFootLeft',
			events : {
			    click : function(event) {
				MUI.closeWindow($('editUniverseWindow'));
			    }
			}
		    })
		    );
	    }.bind(this)
	});

    },

    editUniverse : function(options) {
	var errors = RPG.optionValidator.validate(options,Object.merge(Object.clone(RPG.universe_options),{
	    property : {
		startMap : Object.keys(this.currentUniverse.maps).erase('options')
	    }
	}));
	if (errors && errors.length > 0) {
	    RPG.Error.show(errors);
	    errors = null;
	    return;
	}
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=MapEditor&m=checkDupeUniverseName&universeName='+options.property.universeName+'&universeID='+(this.currentUniverse.options.database && this.currentUniverse.options.database.universeID?this.currentUniverse.options.database.universeID:0),
	    onFailure : function(error) {
		RPG.Error.show(error);
	    }.bind(this),
	    onSuccess : function(result) {
		Object.merge(this.currentUniverse.options,options);
		this.refreshMapTree('');
		if ($('editUniverseWindow')) {
		    MUI.closeWindow($('editUniverseWindow'));
		}
	    }.bind(this)
	}).get();
    },

    closeUniverse : function() {
	Object.erase(this,'currentUniverse');
	Object.erase(this,'currentTiles');
	Object.erase(this,'currentTileCache');
	this.rows = 1;
	this.cols = 1;

	this.refreshMapTree('');
	this.refreshMap();
    },

    newMapWindow : function() {
	if (!this.currentUniverse) {
	    RPG.Error.show('No active universe found.')
	    return;
	}
	new MUI.Window({
	    id : 'newMapWindow',
	    title : 'New Map for Universe <b>'+this.currentUniverse.options.property.universeName+'</b>',
	    type : 'window',
	    loadMethod : 'html',
	    content : RPG.optionCreator.getOptionTable(RPG.map_options,null,[],null,'newMap'),
	    collapsible : false,
	    storeOnClose : false,
	    resizable : true,
	    maximizable : false,
	    closable : true,
	    width : 400,
	    height : 300,
	    onContentLoaded : function() {
		$('newMapWindow').adopt(
		    RPG.elementFactory.buttons.actionButton({
			'class' : 'Add WinFootRight',
			'html' : 'Add Map',
			events : {
			    click : function(event) {
				this.addNewMap();
			    }.bind(this)
			}
		    }),
		    RPG.elementFactory.buttons.cancelButton({
			'class' : 'WinFootLeft',
			events : {
			    click : function(event) {
				MUI.closeWindow($('newMapWindow'));
			    }
			}
		    })
		    );
	    }.bind(this),
	    onClose : function() {

	    }.bind(this)
	});
    },
    addNewMap : function() {
	var options = RPG.optionCreator.getOptionsFromTable('newMapWindow','newMap');
	var errors = RPG.optionValidator.validate(options,RPG.map_options);
	if (options && this.currentUniverse.maps[options.property.mapName]) {
	    errors.push('The map "'+options.property.mapName+'" already exists.');
	}
	if (errors && errors.length > 0) {
	    RPG.Error.show(errors);
	    return;
	}


	var map = Object.clone(RPG.map);
	Object.merge(map.options,options);
	map.cache = this.currentTileCache = {};
	map.tiles = this.currentTiles = {};
	this.currentUniverse.maps[options.property.mapName] = map;

	this.changeMap(options.property.mapName);

	MUI.closeWindow($('newMapWindow'));

	MUI.notification('Map Added Successfully.');

    },

    changeMap : function(mapName) {
	if (!mapName || !this.currentUniverse) return;

	if (this.currentUniverse.maps[mapName]) {
	    if (!this.currentUniverse.options.settings) {
		this.currentUniverse.options.settings = {};
	    }
	    this.currentUniverse.options.settings.activeMap = mapName;
	    this.activeTileset = null;

	    this.currentTiles = this.currentUniverse.maps[mapName].tiles;
	    this.currentTileCache = this.currentUniverse.maps[mapName].cache;
	    this.refreshMapTree('currentUniverse__maps__'+mapName);
	    this.refreshMap();
	}
    },

    editMapWindow : function() {
	if ($('editMapWindow')) {
	    MUI.closeWindow($('editMapWindow'));
	}
	if (!this.currentUniverse) {
	    Error.show('No Universe is currently open.');
	    return;
	}

	new MUI.Window({
	    id : 'editMapWindow',
	    title : 'Update Map Options',
	    type : 'window',
	    loadMethod : 'html',
	    content :  RPG.optionCreator.getOptionTable(Object.erase(Object.clone(RPG.map_options),'generators'),null,[],this.currentUniverse.maps[this.currentUniverse.options.settings.activeMap].options,'editMap'),

	    collapsible : false,
	    storeOnClose : false,
	    resizable : true,
	    maximizable : false,
	    closable : true,
	    width : 400,
	    height : 300,
	    onContentLoaded : function() {
		$('editMapWindow').adopt(
		    RPG.elementFactory.buttons.actionButton({
			'class' : 'WinFootRight',
			'html' : 'Update Map Options',
			events : {
			    click : function(event) {
				this.editMap(RPG.optionCreator.getOptionsFromTable('editMapWindow','editMap'));
			    }.bind(this)
			}
		    }),
		    RPG.elementFactory.buttons.cancelButton({
			'class' : 'WinFootLeft',
			events : {
			    click : function(event) {
				MUI.closeWindow($('editMapWindow'));
			    }
			}
		    })
		    );
	    }.bind(this)
	});

    },

    editMap : function(options) {
	var errors = RPG.optionValidator.validate(options,Object.erase(Object.clone(RPG.map_options),'generators'));
	if (options && this.currentUniverse.maps[options.property.mapName]) {
	    errors.push('The map "'+options.property.mapName+'" already exists.');
	}
	if (errors && errors.length > 0) {
	    RPG.Error.show(errors);
	    errors = null;
	    return;
	}

	//renamed map:
	if (options.property.mapName != this.currentUniverse.options.settings.activeMap) {
	    var prevActive = this.currentUniverse.options.settings.activeMap;
	    if (this.currentUniverse.options.property.startMap == prevActive) {
		this.currentUniverse.options.property.startMap = options.property.mapName;
	    }
	    this.currentUniverse.options.settings.activeMap = options.property.mapName;
	    this.currentUniverse.maps[options.property.mapName] = this.currentUniverse.maps[prevActive];
	    Object.erase(this.currentUniverse.maps,prevActive);
	}

	//merge options
	Object.merge(this.currentUniverse.maps[this.currentUniverse.options.settings.activeMap].options,options);
	this.refreshMapTree('');
	if ($('editMapWindow')) {
	    MUI.closeWindow($('editMapWindow'));
	}
    },


    generatorWindow : function(generator) {
	var map = null;
	if ($('generatorWindow')) {
	    MUI.closeWindow($('generatorWindow'));
	}

	if ($$('.selectedMap').length == 0 && $$('.selectedTileset').length == 0) {
	    RPG.Error.show('No active tileset/map.');
	    return;
	} else {
	    if ($$('.selectedMap').length >0) {
		map = this.currentUniverse.maps[this.currentUniverse.options.settings.activeMap];
	    } else if ($$('.selectedTileset').length > 0 && this.activeTileset) {
		map = this.activeTileset;
	    }
	    if (!map.options.generator || (map.options.generator && !map.options.generator[generator])) {
		map.options.generator = {};
		map.options.generator[generator] = {
		    options:{}
		}
	    }
	}
	if (!map) return;

	new MUI.Window({
	    id : 'generatorWindow',
	    title : generator + ' Generator',
	    type : 'window',
	    loadMethod : 'html',
	    content : new Element('div',{
		id : 'generatorDiv'
	    }),
	    collapsible : false,
	    storeOnClose : false,
	    resizable : true,
	    maximizable : false,
	    closable : true,
	    width : 350,
	    height : 320,
	    require : {
		js : RPG.Generators[generator].require.js,
		onloaded : function() {
		    $('generatorDiv').empty().adopt(RPG.optionCreator.getOptionTabs(RPG.Generator[generator].constraints,null,[],map.options.generator[generator].options,'generator'));
		    MUI.initializeTabs('generator_mapTileConfigTabs');
		}.bind(this)
	    },
	    onContentLoaded : function() {
		$('generatorWindow').adopt(
		    RPG.elementFactory.buttons.actionButton({
			'class' : 'Update WinFootRight',
			'html' : 'Generate Now',
			events : {
			    click : function(event) {
				var options = RPG.optionCreator.getOptionsFromTable('generatorWindow','generator');
				var errors = RPG.optionValidator.validate(options,RPG.Generator[generator].constraints);
				if (errors && errors.length > 0) {
				    RPG.Error.show(errors);
				    errors = null;
				    return;
				}
				var generated = RPG.Generator[generator].generate(options);
				if (generated.tiles && generated.cache) {
				    Object.merge(map.tiles,generated.tiles);
				    Object.merge(map.cache,generated.cache);
				    Object.merge(map.options.generator[generator].options,options);
				    this.refreshMapTree('');
				    this.refreshMap();

				} else if (typeOf(generated) == 'string') {
				    RPG.Success.show('Generated: <b>'+generated+'</b>');
				}
				if ($('generatorWindow')) {
			    //MUI.closeWindow($('generatorWindow'));
			    }
			    }.bind(this)
			}
		    }),
		    RPG.elementFactory.buttons.cancelButton({
			'class' : 'WinFootLeft',
			events : {
			    click : function(event) {
				MUI.closeWindow($('generatorWindow'));
			    }.bind(this)
			}
		    })
		    );

	    }.bind(this),
	    onClose : function() {

	    }.bind(this)
	});

    },
    tileWindow : function(options) {
	if ($('mapEditorTileWindow')) {
	    MUI.closeWindow($('mapEditorTileWindow'));
	}
	this.mapEditorTileWindow = new MUI.Window({
	    id : 'mapEditorTileWindow',
	    title : (options.path.join(' > ')).capitalize(),
	    type : 'window',
	    loadMethod : 'html',
	    content : this.populateTileWindow(options),
	    collapsible : false,
	    storeOnClose : false,
	    resizable : true,
	    maximizable : false,
	    closable : true,
	    width : 470,
	    height : 400,
	    onContentLoaded : function() {
		options.parentID = 'mapEditorTileWindow';
		this.mapEditorTileWindowSaveButton = RPG.elementFactory.buttons.actionButton({
		    'class' : 'WinFootRight',
		    html : (options.cache == RPG.Tiles?'<span class="Update textMedium">Save to Current Map</span>':(options.cache == this.favoritesCache?'<span class="Clone textMedium">Clone to Current Map</span>':'<span class="Clone textMedium">Update</span>')),
		    events : {
			click : function(event) {
			    this.saveTileToCurrentMap(options);
			    this.refreshMap();
			}.bind(this)
		    }
		});
		this.mapEditorTileWindowCancelButton = RPG.elementFactory.buttons.cancelButton({
		    'class' : 'WinFootLeft',
		    events : {
			click : function(event) {
			    MUI.closeWindow($('mapEditorTileWindow'));
			}.bind(this)
		    }
		});
		$('mapEditorTileWindow').adopt(this.mapEditorTileWindowSaveButton,this.mapEditorTileWindowCancelButton);

		this.buildTileImages(options);
		this.showTileConfig(options);
	    }.bind(this),
	    onClose : function() {
		this.hideTileConfig();
	    }.bind(this)
	});

    },

    populateTileWindow : function(options){
	if (!this.tileWindowTable) {
	    this.tileWindowTable = new HtmlTable({
		zebra : false,
		selectable : false,
		useKeyboard : false,
		properties : {
		    cellpadding : 2
		},
		rows : [
		[
		{
		    properties : {
			'class' : 'vTop',
			styles : {
			    'max-width' : 168
			}
		    },
		    content : this.tileWindowImagesDiv = new Element('div')
		},
		{
		    properties : {
			'class' : 'vTop'
		    },
		    content : this.tabBodyDiv = new Element('div')
		}
		]
		]
	    })
	}
	return this.tileWindowTable.toElement();
    },

    buildTileImages : function(options) {
	var path = options.path;
	if (options.cache != RPG.Tiles) {
	    path = options.path.slice(1,path.length-1);
	}
	var pathObj = Object.getFromPath(RPG.Tiles,path);
	var selectedImage = null;
	if (options.cache != RPG.Tiles) {
	    selectedImage = Object.getFromPath(options.cache,options.path).options.property.image.name;
	    $$('#property__image__name').each(function(elm){
		elm.value = selectedImage;
	    });
	}
	this.tileWindowImagesDiv.empty();
	pathObj && pathObj.options && pathObj.options.property && pathObj.options.property.image && pathObj.options.property.image.name && pathObj.options.property.image.name.each(function(img){
	    var image = new Element('div',{
		'class' : 'mapTileImage' + (selectedImage == img?' mapTileImageSelected':''),
		html :'&nbsp;',
		styles : {
		    'background-image': 'url(/common/Map/Tiles/'+path.join('/')+'/'+escape(img)+')'
		},
		events : {
		    click : function(event) {
			var select = true;
			if (image.hasClass('mapTileImageSelected')){
			    select = false;
			}
			$$('.mapTileImage').each(function(elm){
			    elm.removeClass('mapTileImageSelected');
			});
			if (select) {
			    image.addClass('mapTileImageSelected');
			    $$('#property__image__name').each(function(elm){
				elm.value = img;
			    });
			}
			select = null;
			event.stopPropagation();
		    }.bind(this)
		}
	    }).store('imageName',img);
	    this.tileWindowImagesDiv.adopt(image);
	}.bind(this));

    },

    hideTileConfig : function() {
	$$('.mapTileImage').each(function(elm){
	    if (elm && elm.removeClass) {
		elm.removeClass('selected');
	    }
	})
    },
    showTileConfig : function(options) {
	var path = options.path;
	if (options.cache != RPG.Tiles) {
	    path = options.path.slice(1,path.length-1);
	}
	var constraint_options = RPG.optionValidator.getConstraintOptions(path,RPG.Tiles);
	var loadOptions = null;
	if (options.cache != RPG.Tiles) {
	    loadOptions = Object.getFromPath(options.cache,options.path).options;
	}
	if (constraint_options.teleportTo) {
	    constraint_options.teleportTo.mapName = [''].append(Object.keys(this.currentUniverse.maps));
	}

	this.tabBodyDiv.empty().adopt(RPG.optionCreator.getOptionTabs(constraint_options,null,[],loadOptions,'tile'));

	MUI.initializeTabs('tile_mapTileConfigTabs');
    },

    saveTileToCurrentMap : function(options) {
	var path = options.path;
	if (options.cache != RPG.Tiles) {
	    path = options.path.slice(1,path.length-1);
	}
	var tileOptions = RPG.optionCreator.getOptionsFromTable(options.parentID,'tile');

	$$('.mapTileImageSelected').each(function(elm){
	    var img = null;
	    if ((img = elm.retrieve('imageName'))) {
		tileOptions.property.image.name = img;
	    }
	    img = null;
	});

	/**
	 * Validate New Tile
	 */
	var errors = RPG.optionValidator.validate(tileOptions,RPG.optionValidator.getConstraintOptions(path,RPG.Tiles));
	if (errors && errors.length > 0) {
	    RPG.Error.show(errors);
	} else {
	    RPG.createTile(Array.clone(path),this.currentTileCache,tileOptions);
	    this.refreshMapTree('currentTileCache__'+tileOptions.property.folderName+'__'+path.join('__'));
	    MUI.notification('Tile Added Successfully.');
	}
	errors = path = null;

    },

    calcCols : function() {
	return Math.floor(($('pnlMainContent').getSize().x - 120) / this.mapZoom);
    },
    calcRows : function() {
	return Math.floor(($('pnlMainContent').getSize().y - 40 - 80) / this.mapZoom);
    },

    refreshMap : function() {
	if (this.refreshingMap) return;
	this.refreshingMap = true;
	var c = 0;
	var r = 0;
	/**
	 * calculate the max columns and rows based on the this.mapZoom and panel size
	 */
	if (this.mapZoom < 8) {
	    this.mapZoom = 8;
	}
	var newCols = this.calcCols();
	var newRows = this.calcRows();

	if (newCols == this.cols && newRows == this.rows) {
	    var offRow = this.rowOffset || 0;
	    var offCol = this.colOffset || 0;
	    //this.mapEditorTable.toElement().hide();
	    for (c = 0; c<this.cols; c++) {
		[$('topColumn'+c),$('bottomColumn'+c)].each(function(elm){
		    elm && elm.set('title',c+offCol).set('html',c+offCol);
		});
	    }
	    for (r = 0; r<this.rows; r++) {
		[$('leftRow'+r),$('rightRow'+r)].each(function(elm){
		    elm && elm.set('title',r+offRow).set('html',r+offRow);
		});
	    }
	    var tileHolders = $$('#mapEditor .M_tileHolder');
	    var len = tileHolders.length;
	    for(var x=0;x<len;x++) {
		var holder = tileHolders[x];
		var rowcol = this.getTileHolderRowCol({
		    target : holder
		});
		var mR = rowcol.row - (this.prevRowOffset - offRow);
		var mC = rowcol.col - (this.prevColOffset - offCol);
		holder.id = 'mR'+mR+'mC'+mC;
		var styles = this.getMapTileStyles({
		    row : mR,
		    col : mC
		});
		if (styles['background-image'] != 'none') {
		    if (!holder.className != 'M_tileHolder-empty') {
			holder.removeClass('M_tileHolder-empty');
		    }
		    holder.style.backgroundImage = styles['background-image'];
		    holder.style.backgroundPosition = styles['background-position'];
		    holder.style.backgroundSize = styles['background-size'];
		    holder.style.backgroundRepeat = styles['background-repeat'];

		} else {
		    holder.style.backgroundImage = 'none';
		    if (!holder.className != 'M_tileHolder-empty') {
			holder.addClass('M_tileHolder-empty');
		    }
		}
		holder.swapClass('mR'+rowcol.row,'mR'+mR).swapClass('mC'+rowcol.col,'mC'+mC);//@todo find way around using classes for row/col painting.. this is slow when dragging

		rowcol = mR = mC = styles = null;
	    }

	    //this.mapEditorTable.toElement().show();
	    c = r = newCols = newRows = null;
	    this.prevRowOffset = this.rowOffset;
	    this.prevColOffset = this.colOffset;
	    this.loadTiles();
	    this.refreshingMap = false;
	    return;
	} else {
	    this.cols = newCols;
	    this.rows = newRows;
	}
	this.prevRowOffset = this.rowOffset;
	this.prevColOffset = this.colOffset;

	r=0;
	c=0;

	if (this.mapEditorTable) {
	    this.mapEditorTable.toElement().getElements('div').destroy();
	    this.mapEditorTable.toElement().getElements('td').destroy();
	    this.mapEditorTable.toElement().getElements('tr').destroy();
	    this.mapEditorTable.toElement().getElements('span').destroy();
	    this.mapEditorTable.toElement().getElements('tbody').destroy();
	    this.mapEditorTable.toElement().destroy();
	    this.mapEditorTable.dispose();
	    Object.erase(this,'mapEditorTable');
	}

	if (!this.currentUniverse && (!this.tilesets || (this.tilesets && Object.keys(this.tilesets).length < 1))) {
	    c = r = newCols = newRows = null;
	    this.refreshingMap = false;
	    return;
	}

	if (this.currentUniverse && !this.currentUniverse.options.settings) {
	    this.currentUniverse.options.settings = {};
	}
	if (this.currentUniverse) {
	    this.currentUniverse.options.settings.rowOffset = this.rowOffset;
	    this.currentUniverse.options.settings.colOffset = this.colOffset;
	}

	this.mapEditorTable = new HtmlTable({
	    zebra : false,
	    selectable : false,
	    useKeyboard : false,
	    properties : {
		cellpadding : 0,
		cellspacing : 0,
		align : 'center',
		'class' : 'M_mapTable'
	    }
	});
	var row = [];


	/**
	 * Location controls
	 * top
	 */
	this.mapEditorTable.push([
	{
	    properties : {
		colspan :2,
		rowspan :2,
		'class' : 'floodFill'
	    },
	    content : 'Flood<br>Fill'
	},
	{
	    properties : {
		colspan : this.cols,
		'class' : 'panUp'
	    },
	    content : '^^^^'
	},{
	    properties : {
		colspan :2,
		rowspan :2,
		'class' : 'floodDelete'
	    },
	    content : 'Flood<br>Delete'
	}]);

	//top column controls
	row = [];
	for (c = 0; c<this.cols; c++) {
	    row.push({
		properties : {
		    'class' : 'fillColumn topColumn'+c,
		    styles : {
			width : this.mapZoom
		    }
		},
		content : new Element('div',{
		    'id' : 'topColumn'+c,
		    'class' : 'topColumn'+c,
		    html : c+this.colOffset,
		    title : c+this.colOffset,
		    styles : {
			overflow : 'hidden',
			width : this.mapZoom
		    }
		})
	    });
	}
	this.mapEditorTable.push(row);


	for (r = 0; r<this.rows; r++) {
	    row = [];
	    if (r==0) {
		//left side arrows
		row.push({
		    properties : {
			rowspan : this.rows,
			'class' : 'panLeft'
		    },
		    content : '&lt;<br>&lt;<br>&lt;<br>&lt;<br>'
		});
	    }
	    //left side row controls
	    row.push({
		properties : {
		    'class' : 'fillRow leftRow'+r,
		    styles : {
			height : this.mapZoom
		    }
		},
		content : new Element('div',{
		    'id' : 'leftRow'+r,
		    'class' : 'leftRow'+r,
		    html : r+this.rowOffset,
		    title : r+this.rowOffset,
		    styles : {
			overflow : 'hidden',
			height : this.mapZoom
		    }
		})
	    });

	    for (c = 0; c<this.cols; c++) {
		row.push(this.getMapCell({
		    row : r+this.rowOffset,
		    col : c+this.colOffset
		}));
	    }

	    //right side row controls
	    row.push({
		properties : {
		    'class' : 'fillRow rightRow'+r,
		    styles : {
			height : this.mapZoom
		    }
		},
		content : new Element('div',{
		    'id' : 'rightRow'+r,
		    'class' : 'rightRow'+r,
		    html : r+this.rowOffset,
		    title : r+this.rowOffset,
		    styles : {
			overflow : 'hidden',
			height : this.mapZoom
		    }
		})
	    });

	    if (r==0) {
		//right side arrows
		row.push({
		    properties : {
			rowspan : this.rows,
			'class' : 'panRight'
		    },
		    content : '&gt;<br>&gt;<br>&gt;<br>&gt;<br>'
		});
	    }
	    this.mapEditorTable.push(row);
	}

	row = [];
	for (c = 0; c<this.cols; c++) {
	    if (c == 0) {
		//bottomleft
		row.push({
		    properties : {
			colspan :2,
			rowspan :2,
			'class' : 'Pointer ActionButton textCenter'
		    },
		    content : 'BL'
		});
	    }
	    //bottom column buttons
	    row.push({
		properties : {
		    'class' : 'fillColumn bottomColumn'+c,
		    styles : {
			width : this.mapZoom
		    }
		},
		content : new Element('div',{
		    'id' : 'bottomColumn'+c,
		    'class' : 'bottomColumn'+c,
		    html : c+this.colOffset,
		    title : c+this.colOffset,
		    styles : {
			overflow : 'hidden',
			width : this.mapZoom
		    }
		})
	    });
	}
	//bottomright
	row.push({
	    properties : {
		colspan :2,
		rowspan :2,
		'class' : 'Pointer ActionButton textCenter'
	    },
	    content : 'BR'
	});
	this.mapEditorTable.push(row);
	//bottom arrows
	this.mapEditorTable.push([
	{
	    properties : {
		colspan : this.cols,
		'class' : 'panDown'
	    },
	    content : 'v v v v v'
	}]);
	this.mapEditorDiv.adopt(this.mapEditorTable.toElement());
	c = r = newCols = newRows = row = null;
	this.refreshingMap = false;
	this.loadTiles();
    },

    getFillColumn : function(event) {
	var col = null;
	var classes = event.target.className.split(' ');
	for (var x=0; x<classes.length; x++) {
	    var cls = classes[x];
	    if (/^(top|bottom)Column[\d]+$/.test(cls)){
		col = Number.from(cls.replace('topColumn','').replace('bottomColumn',''));
	    }
	    cls = null;
	}
	return col;
    },
    getFillRow : function(event) {
	var row = null;
	var classes = event.target.className.split(' ');
	for (var x=0; x<classes.length; x++) {
	    var cls = classes[x];
	    if (/^(left|right)Row[\d]+$/.test(cls)){
		row = Number.from(cls.replace('leftRow','').replace('rightRow',''));
	    }
	    cls = null
	}
	return row;
    },
    getTileHolderRowCol : function(event) {
	if (event && event.target) {
	    var row = null;
	    var col = null;
	    var rowcol = event.target.id.split('mC');
	    row = rowcol[0].replace('mR','') * 1;
	    col = rowcol[1] * 1;
	    if (row != null && col != null) {
		return {
		    row : row,
		    col : col
		};
	    }
	}
	return null;
    },

    getMapCell : function(options) {
	var styles = this.getMapTileStyles(options);
	var cell = {
	    properties : {
		id : (options.tileset?'tileset_':'')+'mR'+(options.row)+'mC'+(options.col),
		'class' : 'M_tileHolder '+(styles['background-image']=='none'?'M_tileHolder-empty ':'') +'mR'+(options.row)+' mC'+(options.col),
		styles : styles
	    },
	    content : '&nbsp;'
	};
	styles = null;
	return cell;
    },

    placeSelectedTile : function(options,onBottom) {
	options.selectedTile = null;
	$$('.selectedTile').each(function(elm){
	    options.selectedTile = elm;
	});
	if (!options.selectedTile) {
	    return;
	}

	if (onBottom) {
	    RPG.unshiftTile(this.currentTiles,[options.row,options.col],options.selectedTile.retrieve('tilePath'));
	} else {
	    RPG.pushTile(this.currentTiles,[options.row,options.col],options.selectedTile.retrieve('tilePath'));
	}
	$('mR'+(options.row)+'mC'+(options.col)).removeClass('M_tileHolder-empty').setStyles(this.getMapTileStyles(options));

	Object.erase(options,'tileArr');
	Object.erase(options,'selectedTile');
    },

    deleteSelectedTile : function(options) {
	if (!options.selectedTile) {
	    options.selectedTile = null;
	    $$('.selectedTile').each(function(elm){
		options.selectedTile = elm;
	    });
	    if (!options.selectedTile && !options.selectedTilePath) {
		return;
	    }
	}
	var selectedTilePath = (options.selectedTile && options.selectedTile.retrieve('tilePath').join('.')) || options.selectedTilePath;
	var remove = RPG.removeTile(this.currentTiles,selectedTilePath,[options.row,options.col]);
	if (remove) {
	    var addClass = '';
	    if (this.currentTiles[options.row][options.col].length == 0) {
		addClass = 'M_tileHolder-empty';
		this.currentTiles[options.row][options.col] = null;
		/**
		 * Since there are no more tiles in this cell, add the tile to be deleted if this map has been saved to the database
		 */
		if (this.currentUniverse && this.currentUniverse.options.settings && this.currentUniverse.options.settings.activeMap && this.currentUniverse.maps[this.currentUniverse.options.settings.activeMap].options.database) {
		    if (!this.currentUniverse.maps[this.currentUniverse.options.settings.activeMap].options.database.tileDelete) {
			this.currentUniverse.maps[this.currentUniverse.options.settings.activeMap].options.database.tileDelete = [];
		    }
		    this.currentUniverse.maps[this.currentUniverse.options.settings.activeMap].options.database.tileDelete.push(options.row+','+options.col);
		}
	    }
	    $('mR'+(options.row)+'mC'+(options.col)).addClass(addClass).setStyles(this.getMapTileStyles(options));
	    addClass= null;
	}
	Object.erase(options,'selectedTile');
	selectedTilePath = null;
	remove = null;
    },

    loadTiles : function() {
	if (this.currentUniverse && this.currentUniverse.options.database && this.currentUniverse.options.database.universeID && this.currentUniverse.options.settings.activeMap) {
	    /**
	     * Loop through all the tile holder cells that are empty
	     */
	    var getTiles = [];
	    var currenMapDatabaseOpts = this.currentUniverse.maps[this.currentUniverse.options.settings.activeMap].options.database;

	    if (!currenMapDatabaseOpts || currenMapDatabaseOpts.minRow == null || currenMapDatabaseOpts.maxRow  == null || currenMapDatabaseOpts.minCol == null || currenMapDatabaseOpts.maxCol == null) return;

	    $$('.M_tileHolder').each(function(tileHolder){
		if (!tileHolder || tileHolder.style.backgroundImage != 'none') return;
		var rowcol = tileHolder.id.replace('mR','').split('mC');
		//exclude tiles outside the range of the saved database tiles
		if (rowcol[0] >= currenMapDatabaseOpts.minRow && rowcol[0] <= currenMapDatabaseOpts.maxRow && rowcol[1] >= currenMapDatabaseOpts.minCol && rowcol[1] <= currenMapDatabaseOpts.maxCol) {
		    //exclude user ui deteled tiles
		    if (!currenMapDatabaseOpts.tileDelete || (currenMapDatabaseOpts.tileDelete && !currenMapDatabaseOpts.tileDelete.contains(rowcol[0]+','+rowcol[1]))) {
			getTiles.push(rowcol);
		    }
		}
	    });
	    if (getTiles.length < 1) return;

	    new Request.JSON({
		url : '/index.njs?xhr=true&a=MapEditor&m=loadTiles&mapID='+currenMapDatabaseOpts.mapID+'&minRow='+currenMapDatabaseOpts.minRow+'&maxRow='+currenMapDatabaseOpts.maxRow+'&minCol='+currenMapDatabaseOpts.minCol+'&maxCol='+currenMapDatabaseOpts.maxCol,
		onFailure : function(error) {
		//ignore errors
		//RPG.Error.notify(error);
		}.bind(this),
		onSuccess : function(tiles) {
		    Object.each(tiles,function(row,rowNum){
			Object.each(row,function(col,colNum){
			    if (!this.currentTiles[rowNum]) {
				this.currentTiles[rowNum] ={};
			    }
			    this.currentTiles[rowNum][colNum] = col;
			    $('mR'+rowNum+'mC'+colNum).removeClass('M_tileHolder-empty').setStyles(this.getMapTileStyles({
				tileArr : col
			    }));
			}.bind(this));
		    }.bind(this));
		}.bind(this)
	    }).post(JSON.encode(getTiles));
	}
    },

    getMapTileStyles : function(options) {
	var styles = {
	    width : this.mapZoom,
	    height : this.mapZoom
	};
	if (options.tileArr || (this.currentTiles[options.row] && this.currentTiles[options.row][options.col])) {
	    var tileArr = options.tileArr || this.currentTiles[options.row][options.col];

	    if (Object.keys(options).contains('tileArr') && !options.tileArr) {
		styles['background-image'] = 'none';
		return styles;
	    }

	    var cache = options.cache || this.currentTileCache;
	    styles['background-image'] = '';
	    styles['background-position'] = '';
	    styles['background-size'] = '';
	    styles['background-repeat'] = '';

	    var len = tileArr.length;
	    for (var x=0; x<len;x++) {
		var t = tileArr[x];
		var theTile = Object.getFromPath(cache,t);
		if (!theTile) {
		    //console.log('Tile missing: ' + JSON.encode(options)+' ' + t + '\n');
		    continue;
		}
		styles['background-image'] = 'url("/common/Map/Tiles/'+t.slice(1,t.length-1).join('/')+'/'+escape(theTile.options.property.image.name)+'"),' + styles['background-image'];
		styles['background-position'] = (theTile.options.property.image.left?theTile.options.property.image.left+'% ':'0% ') + (theTile.options.property.image.top?theTile.options.property.image.top+'%,':'0%,') + styles['background-position'];
		styles['background-size'] = (theTile.options.property.image.size?theTile.options.property.image.size+'%,':'100%,') + styles['background-size'];
		styles['background-repeat'] = (theTile.options.property.image.repeat?theTile.options.property.image.repeat+',':'no-repeat,') + styles['background-repeat'];
		theTile = null;

	    }
	    cache = null;

	    styles['background-image'] = styles['background-image'].substr(0, styles['background-image'].length-1);
	    styles['background-position'] = styles['background-position'].substr(0, styles['background-position'].length-1);
	    styles['background-size'] = styles['background-size'].substr(0, styles['background-size'].length-1);
	    styles['background-repeat'] = styles['background-repeat'].substr(0, styles['background-repeat'].length-1);

	    options.tileArr = null;
	    tileArr = null;
	    return styles;
	} else {
	    styles['background-image'] = 'none'
	}

	return styles;

    },

    editTileOrder : function(options) {
	if ($('editTileOrderWindow')) {
	    MUI.closeWindow($('editTileOrderWindow'));
	}

	if (!this.currentTiles[options.row]) {
	    return;
	}
	if (!this.currentTiles[options.row][options.col]) {
	    return;
	}
	var sortedList = null;
	this.editTileOrderWindow = new MUI.Window({
	    id : 'editTileOrderWindow',
	    title : 'Editing Row: '+(options.row) + ' Column: '+(options.col),
	    type : 'window',
	    loadMethod : 'html',
	    content : this.populateTileOrderWindow(options),
	    collapsible : false,
	    storeOnClose : false,
	    resizable : true,
	    maximizable : false,
	    closable : true,
	    width : 385,
	    height : 300,
	    require : {
		js : ['/client/mootools/FancySortable.js'],
		onloaded : function() {
		    new FancySortable('tileOrderWrap', '.tileListItem',{
			'handleSelector':'.tileOrderHandle',
			onSort : function(list, item, i, ind) {
			    sortedList = list;
			    var tiles = [];
			    list.each(function(listitem){
				tiles.push(listitem.retrieve('tilePath'));
			    });
			    $('tileOrderAfter').setStyles(Object.merge(this.getMapTileStyles({
				tileArr : tiles
			    }),{
				width : '48px',
				height:'48px'
			    }));
			    tiles = null;
			}.bind(this)
		    });
		}.bind(this)
	    },
	    onContentLoaded : function() {
		this.editTileOrderWindowSaveButton = RPG.elementFactory.buttons.actionButton({
		    'class' : 'Update WinFootRight',
		    html : 'Update Order',
		    events : {
			click : function(event) {
			    if (sortedList) {
				var arr = [];
				sortedList.each(function(listitem){
				    arr.push(listitem.retrieve('tilePath'));
				});
				this.currentTiles[options.row][options.col] = arr;
				arr = null;
				sortedList = null;
				MUI.closeWindow($('editTileOrderWindow'));
				$('mR'+(options.row)+'mC'+(options.col)).setStyles(this.getMapTileStyles(options));
			    }
			}.bind(this)
		    }
		});
		this.editTileOrderWindowCancelButton = RPG.elementFactory.buttons.cancelButton({
		    'class' : 'WinFootLeft',
		    events : {
			click : function(event) {
			    sortedList = null;
			    MUI.closeWindow($('editTileOrderWindow'));
			}.bind(this)
		    }
		});
		if ($('editTileOrderWindow')) {
		    $('editTileOrderWindow').adopt(this.editTileOrderWindowCancelButton,this.editTileOrderWindowSaveButton);
		}
	    }.bind(this),
	    onClose : function() {

	    }.bind(this)
	});
    },
    populateTileOrderWindow : function(options) {
	if (!this.currentTiles[options.row]) {
	    return null;
	}
	var tiles = this.currentTiles[options.row][options.col];
	if (this.tileOrderTable) {
	    this.tileOrderTable.toElement().destroy();
	    delete this.tileOrderTable;
	}
	if (!tiles) {
	    MUI.closeWindow($('editTileOrderWindow'));
	    return null;
	}

	this.tileOrderTable = new HtmlTable({
	    zebra : false,
	    selectable : false,
	    useKeyboard : false,
	    properties : {
		align : 'center',
		cellpadding : 2
	    }
	});

	var listWrap = new Element('div',{
	    id : 'tileOrderWrap'
	});

	//var row = [];
	tiles.each(function(t){
	    var theTile = Object.getFromPath(this.currentTileCache,t);
	    var div = null;
	    listWrap.adopt(div = new Element('div',{
		'class' : 'tileListItem'
	    }).adopt(
		new HtmlTable({
		    zebra : false,
		    selectable : false,
		    useKeyboard : false,
		    properties : {
			cellpadding : 2,
			width : '100%'
		    },
		    rows : [
		    [
		    {
			properties : {
			    'class' : 'tileOrderHandle vTop',
			    styles : {
				cursor : 'move',
				'width' : '32px',
				'height' : '32px',
				'background-image' : 'url(/common/Map/Tiles/'+t.slice(1,t.length-1).join('/')+'/'+escape(theTile.options.property.image.name)+')'
			    }
			},
			content : '&nbsp;'
		    },
		    {
			properties : {

			},
			content : new Element('a',{
			    html : t.join(' > ').capitalize(),
			    events : {
				click : function(event) {
				    this.tileWindow({
					path : t,
					cache : this.currentTileCache
				    });
				    event.stopPropagation();
				}.bind(this)
			    }
			})
		    },
		    {
			properties : {

			},
			content : new Element('a',{
			    'class' : 'Close',
			    html : '&nbsp;',
			    events : {
				click : function(event) {
				    this.deleteSelectedTile({
					selectedTile : div,
					row : options.row,
					col : options.col
				    });
				    MUI.updateContent({
					element : $('editTileOrderWindow'),
					content : this.populateTileOrderWindow(options),
					loadMethod : 'html'
				    });
				    event.stopPropagation();
				}.bind(this)
			    }
			})
		    }
		    ]
		    ]
		})
		).store('tilePath',t)
		);
	    theTile = null;
	}.bind(this));

	this.tileOrderTable.push([{
	    properties : {
		colspan : 3
	    },
	    content : listWrap
	}]);
	this.tileOrderTable.pushMany([
	    [
	    {

		properties : {
		    'class' : 'textCenter textMedium'
		},
		content : 'Before'
	    },
	    {

		properties : {

		},
		content : '&nbsp;'
	    },
	    {
		properties : {
		    'class' : 'textCenter textMedium'
		},
		content : 'After'
	    }
	    ],
	    [
	    {

		properties : {
		    id : 'tileOrderBefore',
		    'class' : 'M_tileHolder',
		    styles : Object.merge(this.getMapTileStyles(options),{
			width : '48px',
			height:'48px'
		    })
		},
		content : '&nbsp;'
	    },
	    {

		properties : {

		},
		content : '&nbsp;'
	    },
	    {
		properties : {
		    id : 'tileOrderAfter',
		    'class' : 'M_tileHolder',
		    styles : Object.merge(this.getMapTileStyles(options),{
			width : '48px',
			height:'48px'
		    })
		},
		content : '&nbsp;'
	    }
	    ]
	    ]);

	tiles = null;
	return this.tileOrderTable.toElement();
    },

    tilePicker : function(options) {
	this.tilePickerDiv.empty().hide();
	if (!this.currentTiles[options.row]) {
	    return;
	}
	var tiles = this.currentTiles[options.row][options.col];
	if (!tiles) {
	    return;
	}
	var imgs = [];
	var zoom = this.mapZoom;
	var currentTileCache = this.currentTileCache;
	tiles.each(function(tp) {
	    imgs.push(new Element('img',{
		'class' : 'tilePicker',
		src : '/common/Map/Tiles/'+tp.slice(1,tp.length-1).join('/')+'/'+Object.getFromPath(currentTileCache,tp.join('.')+'.options.property.image.name'),
		styles : {
		    width : zoom,
		    height : zoom
		},
		title : 'Click to select, ctrl + click to delete'
	    }).store('options',options).store('tilePath',tp));
	});


	this.tilePickerDiv.adopt(imgs);

	var td = $('mR'+options.row+'mC'+options.col);
	this.tilePickerDiv.setPosition({
	    x: td.getPosition($('pnlMainContent')).x + zoom + 2,
	    y: td.getPosition($('pnlMainContent')).y - 4
	});
	td = null;
	this.tilePickerDiv.show();
	currentTileCache = null;
	imgs = null;
	zoom = null;
    },

    positionMinimap : function() {
	this.miniMap.show();
	if (!$('mR'+this.rowOffset+'mC'+(this.cols+this.colOffset-1))) {
	    this.miniMap.hide();
	    return;
	}

	this.miniMap.setPosition({
	    x : $('mR'+this.rowOffset+'mC'+(this.cols+this.colOffset-1)).getPosition(this.toElement()).x + $('mR'+this.rowOffset+'mC'+(this.cols+this.colOffset-1)).getSize().x - Number.from(this.miniMap.getStyle('width')) - 10,
	    y : $('mR'+this.rowOffset+'mC'+(this.cols+this.colOffset-1)).getPosition(this.toElement()).y
	});
    },

    generateMinimap : function() {
	if (this.miniMapZoom <= 0) {
	    this.miniMapZoom = 0.85;
	}
	var maxRows = Object.keys(this.currentTiles).max();
	var maxCols = 0;
	Object.each(this.currentTiles,function(content,key){
	    if (maxCols < Object.keys(content).max()) {
		maxCols = Object.keys(content).max();
	    }
	});

	this.miniMapCanvas.setStyles({
	    width : maxCols*this.miniMapZoom,
	    height : maxRows*this.miniMapZoom
	});
	this.miniMapCanvas.set('width',maxCols*this.miniMapZoom);
	this.miniMapCanvas.set('height',maxRows*this.miniMapZoom);

	var context = this.miniMapCanvas.getContext('2d');
	for(var r=0; r<maxRows;r++) {
	    for(var c=0; c<maxCols;c++) {
		if (this.currentTiles[r] && this.currentTiles[r][c]) {
		    var zoom = this.miniMapZoom;
		    var imgs = {};
		    this.currentTiles[r][c].each(function(tilePath){
			var p = tilePath.join('__');
			if (!imgs['imageCache__'+p]) {
			    imgs['imageCache__'+p] = $('imageCache__'+p);
			}
			context.drawImage(imgs['imageCache__'+p],c*zoom,r*zoom,zoom,zoom);
			p = null;
		    });
		    zoom = null;
		    delete imgs;
		    imgs = null;

		}
	    }
	}
	//this.positionMinimap();
	maxRows = maxCols = r = c = null;

    },






    saveUniverse : function() {
	if (!this.currentUniverse) {
	    RPG.Error.show({
		error : 'No universe currently selected.'
	    });
	    return;
	}
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=MapEditor&m=checkDupeUniverseName&universeName='+this.currentUniverse.options.property.universeName+'&universeID='+(this.currentUniverse.options.database && this.currentUniverse.options.database.universeID?this.currentUniverse.options.database.universeID:0),
	    onFailure : function(error) {
		RPG.Error.show(error);
	    }.bind(this),
	    onSuccess : function(result) {
		/**
		 * save a picture of the minimap
		 * @todo needs major fixing
		 */
		if (this.miniMapZoom != 1) {
		    var prevZoom = this.miniMapZoom;
		    this.miniMapZoom = 1;
		    //this.generateMinimap();
		    this.miniMapZoom = prevZoom;
		}
		if (!this.currentUniverse.options.minimap) {
		//this.currentUniverse.options.minimap = {};
		}
		//this.currentUniverse.options.minimap.dataUrl = this.miniMapCanvas.toDataURL("image/png");

		new MUI.Require({
		    js : ['/common/zip/jszip.js'/*,'/common/zip/jszip-deflate.js'*/],
		    onloaded : function() {
			//var zip = new JSZip('DEFLATE');
			//zip.add(this.currentUniverse.options.property.universeName+'.uni',JSON.stringify(this.currentUniverse));
			new Request.JSON({
			    url : '/index.njs?xhr=true&a=MapEditor&m=save&universeName='+this.currentUniverse.options.property.universeName,
			    onFailure : function(error) {
				RPG.Error.show(error);
			    }.bind(this),
			    onSuccess : function(result) {
				Object.merge(this.currentUniverse,result);
				RPG.Success.show('Universe Saved Successfully');
			    }.bind(this)
			}).post(/*zip.generate()*/ JSON.encode(this.currentUniverse));
		    //zip = null;
		    }.bind(this)
		});

	    }.bind(this)
	}).get();

    },

    listUniverseWindow : function() {
	if ($('listUniverseWindow')) {
	    $('listUniverseWindow').getElements('img').destroy();
	    $('listUniverseWindow').getElements('td').destroy();
	    $('listUniverseWindow').getElements('tr').destroy();
	    $('listUniverseWindow').getElements('th').destroy();
	    $('listUniverseWindow').getElements('table').destroy();
	    $('listUniverseWindow').getElements('div').destroy();
	    $('listUniverseWindow').getElements('a').destroy();
	    MUI.closeWindow($('listUniverseWindow'));
	}

	new MUI.Window({
	    id : 'listUniverseWindow',
	    title : 'Universe Listing',
	    type : 'window',
	    loadMethod : 'html',
	    content : this.populateListUniverseWindow(),
	    collapsible : false,
	    storeOnClose : false,
	    resizable : true,
	    maximizable : false,
	    closable : true,
	    width : 620,
	    height : 300,
	    onContentLoaded : function() {
		$('listUniverseWindow').adopt(
		    RPG.elementFactory.buttons.actionButton({
			'class' : 'Update WinFootRight',
			html : 'Open Universe',
			events : {
			    click : function(event) {
				if ($('buttonOpenUniverse') && $('buttonOpenUniverse').retrieve('universe')) {
				    this.openUniverse($('buttonOpenUniverse').retrieve('universe'));
				}
			    }.bind(this)
			}
		    }).set('id','buttonOpenUniverse'),
		    RPG.elementFactory.buttons.cancelButton({
			'class' : 'WinFootLeft',
			events : {
			    click : function(event) {
				MUI.closeWindow($('listUniverseWindow'));
			    }.bind(this)
			}
		    }));
	    }.bind(this)
	});
    },
    populateListUniverseWindow : function() {
	var div = new Element('div');

	this.listUserUniverses(null,function(universes){
	    if (!div) return;
	    var tbl = null;
	    div.empty().adopt(
		tbl = new HtmlTable({
		    zebra : true,
		    useKeyboard : false,
		    selectable : true,
		    properties : {
			cellpadding : 6,
			styles :{
			    width : '100%'
			}
		    },
		    headers : [
		    //		    {
		    //			properties : {
		    //			    'class' : 'textMedium '
		    //			},
		    //			content : 'Minimap'
		    //		    },
		    {
			properties : {
			    'class' : 'textMedium '
			},
			content : 'Details'
		    },
		    {
			properties : {
			    'class' : 'textMedium '
			},
			content : 'Stats'
		    },
		    {
			properties : {
			    'class' : 'textMedium '
			},
			content : 'Created/Updated'
		    },
		    {
			properties : {
			    'class' : 'textMedium '
			},
			content : 'User'
		    }
		    ],
		    rows : [[]],
		    onRowFocus : function(event) {
			$('buttonOpenUniverse').store('universe',event.retrieve('universe'));
		    }.bind(this)
		})
		);

	    Object.each(universes,(function(universe,name){
		var row = tbl.push([
		//		{
		//		    properties : {},
		//		    content : new Element('image',{
		//			'class' : 'loadUniverse',
		//			src : universe.options.minimap.dataUrl,
		//			styles : {
		//			    'max-width' : '50px',
		//			    'height' : '50px'
		//			}
		//		    })
		//		},
		{
		    properties : {
			'class' : 'NoWrap'
		    },
		    content : 'Universe: <b>'+universe.options.property.universeName + '</b>'+
		    '<br>Author: <b>'+universe.options.property.author + '</b>'+
		    '<br>Start Map: <b>'+universe.options.property.startMap + '</b>'
		},
		{
		    properties : {
			'class' : 'NoWrap'
		    },
		    content : 'Maps: <b>'+universe.options.database.totalMaps + '</b>'+
		    '<br>Objects: <b>'+ universe.options.database.totalObjects.format() + '</b>'+
		    '<br>Area: <b>'+universe.options.database.totalArea.format() + '/m<sup>2</sup></b>'
		},
		{
		    properties : {
			'class' : 'NoWrap'
		    },
		    content : 'C: <b>'+Date.parse(universe.options.database.created).format('%Y-%m-%d') +'</b>' +
		    '<br>U: <b>'+Date.parse(universe.options.database.updated).format('%Y-%m-%d') +'</b>'
		},
		{
		    properties : {
			'class' : 'NoWrap'
		    },
		    content : universe.options.database.userName
		}
		]);
		row.tr.store('universe',universe);
		row = null;
	    }));
	    div = null;
	    tbl = null;
	});

	return div;
    },

    listUserUniverses : function(options,callback) {
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=MapEditor&m=listUserUniverses',
	    onFailure : function(error) {
		if ($('listUniverseWindow')) {
		    MUI.closeWindow($('listUniverseWindow'));
		}
		RPG.Error.show(error);
	    }.bind(this),
	    onSuccess : function(universeList) {
		callback(universeList);
	    }.bind(this)
	}).get();
    },


    newTilesetWindow : function() {
	if ($('newTilesetWindow')) {
	    MUI.closeWindow($('newTilesetWindow'));
	}

	new MUI.Window({
	    id : 'newTilesetWindow',
	    title : 'New Tileset',
	    type : 'window',
	    loadMethod : 'html',
	    content : RPG.optionCreator.getOptionTable(RPG.tileset_options,null,[],null,'newTileset'),
	    collapsible : false,
	    storeOnClose : false,
	    resizable : true,
	    maximizable : false,
	    closable : true,
	    width : 250,
	    height : 200,
	    onContentLoaded : function() {
		$('newTilesetWindow').adopt(
		    RPG.elementFactory.buttons.actionButton({
			'class' : 'Add WinFootRight',
			'html' : 'Add Tileset',
			events : {
			    click : function(event) {
				this.addNewTileset();
			    }.bind(this)
			}
		    }),
		    RPG.elementFactory.buttons.cancelButton({
			'class' : 'WinFootLeft',
			events : {
			    click : function(event) {
				MUI.closeWindow($('newTilesetWindow'));
			    }
			}
		    })
		    );
	    }.bind(this),
	    onClose : function() {

	    }.bind(this)
	});
    },
    addNewTileset : function() {
	var options = RPG.optionCreator.getOptionsFromTable('newTilesetWindow','newTileset');
	var errors = RPG.optionValidator.validate(options,RPG.tileset_options);

	if (errors && errors.length > 0) {
	    RPG.Error.show(errors);
	    return;
	}
	this.tilesets[options.property.category] = {};
	this.tilesets[options.property.category][options.property.name] = {};
	this.tilesets[options.property.category][options.property.name].options = options;
	this.tilesets[options.property.category][options.property.name].cache = {};
	this.tilesets[options.property.category][options.property.name].tiles = {};

	this.changeTileset(options.property.category,options.property.name);

	MUI.closeWindow($('newTilesetWindow'));

    },

    changeTileset : function(category,name) {
	if (!this.tilesets[category] || (this.tilesets[category] &&!this.tilesets[category][name])) {
	    return;
	}
	if (this.currentUniverse) {
	    this.currentUniverse.options.settings.activeMap = null;
	}

	this.currentTileCache = this.tilesets[category][name].cache;
	this.currentTiles = this.tilesets[category][name].tiles;
	this.activeTileset = this.tilesets[category][name];

	this.refreshMapTree('tilesets__'+category+'__'+name);
	this.refreshMap();
    },

    saveTileset : function() {
	if (!this.activeTileset) {
	    RPG.Error.show({
		error : 'No tileset currently selected.'
	    });
	    return;
	}
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=MapEditor&m=checkDupeTilesetName&name='+this.activeTileset.options.property.name+'&category='+this.activeTileset.options.property.category+'&tilesetID='+(this.activeTileset.options.database && this.activeTileset.options.database.tilesetID?this.activeTileset.options.database.tilesetID:0),
	    onFailure : function(error) {
		RPG.Error.show(error);
	    }.bind(this),
	    onSuccess : function(result) {

		new MUI.Require({
		    js : ['/common/zip/jszip.js'/*,'/common/zip/jszip-deflate.js'*/],
		    onloaded : function() {
			//var zip = new JSZip('DEFLATE');
			//zip.add(this.currentUniverse.options.property.universeName+'.uni',JSON.stringify(this.currentUniverse));
			new Request.JSON({
			    url : '/index.njs?xhr=true&a=MapEditor&m=saveTileset',
			    onFailure : function(error) {
				RPG.Error.show(error);
			    }.bind(this),
			    onSuccess : function(result) {
				Object.merge(this.activeTileset,result);
				RPG.Success.show('Saved Tileset Successfully');
			    }.bind(this)
			}).post(/*zip.generate()*/ JSON.encode(this.activeTileset));
		    //zip = null;
		    }.bind(this)
		});

	    }.bind(this)
	}).get();
    },

    showTilesetDragger : function(event) {
	this.hideTilesetDragger();

	document.body.adopt(this.draggingTilesetTable = new HtmlTable({
	    zebra : false,
	    useKeyboard : false,
	    sortable : false,
	    selectable : false,
	    properties : {
		id : 'tilesetDragger',
		cellpadding : 0,
		cellspacing : 0,
		styles : {
		    position : 'absolute',
		    'opacity' : '0.8'
		}
	    },
	    rows : [
	    [
	    {
		properties : {
		    'class' : 'AsyncWait'
		},
		content : 'Loading Tileset Please Wait'
	    }
	    ]
	    ]
	}));

	if (Object.keys(this.tilesets[event.target.retrieve('category')][event.target.retrieve('name')].tiles).length > 0) {
	    $('tilesetDragger').store('tilesetDragged',this.tilesets[event.target.retrieve('category')][event.target.retrieve('name')]);
	    if (!this.tilesets[event.target.retrieve('category')][event.target.retrieve('name')].options.database) {
		this.tilesets[event.target.retrieve('category')][event.target.retrieve('name')].options.database = {};
	    }
	    Object.merge(this.tilesets[event.target.retrieve('category')][event.target.retrieve('name')].options.database,this.calcMinMaxTileset(this.tilesets[event.target.retrieve('category')][event.target.retrieve('name')].tiles));

	    var row = 0;
	    var col = 0;
	    var minCol = this.tilesets[event.target.retrieve('category')][event.target.retrieve('name')].options.database.minCol;
	    var minRow = this.tilesets[event.target.retrieve('category')][event.target.retrieve('name')].options.database.minRow;
	    var maxCol = this.tilesets[event.target.retrieve('category')][event.target.retrieve('name')].options.database.maxCol;
	    var maxRow = this.tilesets[event.target.retrieve('category')][event.target.retrieve('name')].options.database.maxRow;
	    this.draggingTilesetTable.empty();
	    var rows = 0;
	    var cols = 0;
	    for (row = minRow; row<=maxRow; row++) {
		rows++;
		cols = 0;
		var tblRow = [];
		for (col = minCol; col<=maxCol; col++) {
		    cols ++;
		    tblRow.push(this.getMapCell({
			row : row,
			col : col,
			tileset : true,
			tileArr : this.tilesets[event.target.retrieve('category')][event.target.retrieve('name')].tiles[row][col],
			cache : this.tilesets[event.target.retrieve('category')][event.target.retrieve('name')].cache
		    }));
		    if (col >= this.cols) {
			col = maxCol+1;
		    }
		}
		if (row >= this.rows) {
		    row = maxRow+1;
		}
		this.draggingTilesetTable.push(tblRow);
	    }
	    this.draggingTilesetTable.toElement().setPosition({
		x : event.event.pageX - (this.mapZoom/2),
		y : event.event.pageY - (this.mapZoom/2)
	    });
	} else {

    }

    },
    hideTilesetDragger : function() {
	if ($('tilesetDragger')) {
	    $('tilesetDragger').getElements('td').destroy();
	    $('tilesetDragger').getElements('tr').destroy();
	    $('tilesetDragger').getElements('tbody').destroy();
	    $('tilesetDragger').getElements('table').destroy();
	    $('tilesetDragger').destroy();
	    Object.erase(this,'draggingTilesetTable');
	}
    },

    calcMinMaxTileset : function(tiles) {
	var maxCol = -999999;
	var minCol = 999999;
	var maxRow = -999999;
	var minRow = 999999;
	Object.each(tiles,function(row,rowNum){
	    Object.cleanValues(row);
	    if (!row || row && Object.keys(row).length == 0) return;
	    rowNum = Number.from(rowNum);
	    if (rowNum > maxRow) {
		maxRow = rowNum;
	    }
	    if (rowNum < minRow) {
		minRow = rowNum;
	    }
	    Object.each(row,function(col,colNum){
		if (!col) return;
		colNum = Number.from(colNum);
		if (colNum > maxCol) {
		    maxCol = colNum;
		}
		if (colNum < minCol) {
		    minCol = colNum;
		}
	    });
	});
	return {
	    minRow : minRow,
	    maxRow : maxRow,
	    minCol : minCol,
	    maxCol : maxCol
	};
    },

    dropTileset : function(event) {
	if (this.draggingTileset && $('tilesetDragger') && $('tilesetDragger').retrieve('tilesetDragged') && event.target.hasClass('M_tileHolder')) {

	    var tileset = $('tilesetDragger').retrieve('tilesetDragged');
	    this.hideTilesetDragger();

	    var tileholder = this.getTileHolderRowCol({
		target : document.elementFromPoint(event.event.clientX, event.event.clientY)
	    });
	    if (!tileholder) return;

	    /**
	     * merge tileset cache into currentTileCache
	     */
	    Object.merge(this.currentTileCache,Object.clone(tileset.cache));

	    /**
	     *
	     */
	    var row = 0;
	    var col = 0;
	    var minCol = tileset.options.database.minCol;
	    var minRow = tileset.options.database.minRow;
	    var maxCol = tileset.options.database.maxCol;
	    var maxRow = tileset.options.database.maxRow;
	    var rOffset = 0;
	    var cOffset = 0;
	    for (row = minRow; row<=maxRow; row++) {
		cOffset = 0;
		for (col = minCol; col<=maxCol; col++) {
		    if (tileset.tiles[row] && tileset.tiles[row][col]) {
			var ctRow = tileholder.row + rOffset;
			var ctCol = tileholder.col + cOffset;
			if (event.alt) {
			    if (!this.currentTiles[ctRow]) {
				this.currentTiles[ctRow] = {};
			    }
			    this.currentTiles[ctRow][ctCol] = Array.clone(tileset.tiles[row][col]);
			} else {
			    tileset.tiles[row][col].each(function(t){
				var dups = null;
				if (event.control) {
				    dups = RPG.tilesContainsPath(this.currentTiles,t,[ctRow,ctCol]);
				    dups && dups.each(function(dupe){
					if (!dupe) return;
					this.deleteSelectedTile({
					    row : ctRow,
					    col : ctCol,
					    selectedTilePath : dupe.join('.')
					});
				    }.bind(this));
				} else if (event.shift) {
				    RPG.unshiftTile(this.currentTiles,[ctRow,ctCol],t);
				} else {
				    RPG.pushTile(this.currentTiles,[ctRow,ctCol],t);
				}
				dups = null;
			    }.bind(this));
			}

			if ($('mR'+ctRow+'mC'+ctCol)) {
			    $('mR'+ctRow+'mC'+ctCol).setStyles(this.getMapTileStyles({
				row : ctRow,
				col : ctCol
			    }));
			    if (this.currentTiles[ctRow] && this.currentTiles[ctRow][ctCol] && this.currentTiles[ctRow][ctCol].length > 0) {
				$('mR'+ctRow+'mC'+ctCol).removeClass('M_tileHolder-empty');
			    } else {
				$('mR'+ctRow+'mC'+ctCol).addClass('M_tileHolder-empty');
			    }
			}
		    }
		    cOffset++;
		}
		rOffset++;
	    }
	    row = col = minRow = maxRow = rOffset = cOffset = null;
	    this.refreshMapTree('');
	}
	tileholder = null;
	tileset = null;
    },

    listTilesetsWindow : function() {
	if ($('listTilesetWindow')) {
	    $('listTilesetWindow').getElements('img').destroy();
	    $('listTilesetWindow').getElements('td').destroy();
	    $('listTilesetWindow').getElements('tr').destroy();
	    $('listTilesetWindow').getElements('th').destroy();
	    $('listTilesetWindow').getElements('table').destroy();
	    $('listTilesetWindow').getElements('div').destroy();
	    $('listTilesetWindow').getElements('a').destroy();
	    MUI.closeWindow($('listTilesetWindow'));
	}

	new MUI.Window({
	    id : 'listTilesetWindow',
	    title : 'Tileset Listing',
	    type : 'window',
	    loadMethod : 'html',
	    content : this.populateListTilesetWindow(),
	    collapsible : false,
	    storeOnClose : false,
	    resizable : true,
	    maximizable : false,
	    closable : true,
	    width : 620,
	    height : 300,
	    onContentLoaded : function() {
		$('listTilesetWindow').adopt(
		    RPG.elementFactory.buttons.actionButton({
			'class' : 'Update WinFootRight',
			html : 'Open Tileset',
			events : {
			    click : function(event) {
				if ($('buttonOpenTileset') && $('buttonOpenTileset').retrieve('tileset')) {
				    this.openTileset($('buttonOpenTileset').retrieve('tileset'));
				}
			    }.bind(this)
			}
		    }).set('id','buttonOpenTileset'),
		    RPG.elementFactory.buttons.cancelButton({
			'class' : 'WinFootLeft',
			events : {
			    click : function(event) {
				MUI.closeWindow($('listTilesetWindow'));
			    }.bind(this)
			}
		    }));
	    }.bind(this)
	});
    },
    populateListTilesetWindow : function() {
	var div = new Element('div');

	this.listTilesets(null,function(tilesets){
	    if (!div) return;
	    var tbl = null;
	    div.empty();

	    var tabBody = null;
	    var tabMenu = null;
	    div.adopt(
		new HtmlTable({
		    zebra : false,
		    selectable : false,
		    useKeyboard : false,
		    properties : {
			cellpadding : 2
		    },
		    rows : [
		    [
		    {
			properties : {
			    'class' : 'textCenter textMedium'
			},
			content : new Element('div',{
			    'class' : 'toolBarTabs'
			}).adopt(
			    tabMenu = new Element('ul',{
				'class' : 'tab-menu NoWrap',
				id : 'tilesetTabs'
			    }),
			    new Element('div',{
				'class' : 'clear'
			    })
			    )
		    }
		    ],
		    [
		    {
			properties : {
			    'class' : 'vTop'
			},
			content : tabBody = new Element('div')
		    }
		    ]
		    ]
		})
		);

	    Object.each(tilesets,function(contents,category){

		tabMenu.adopt(new Element('li').adopt(
		    new Element('a',{
			html:category,
			events : {
			    click : function(event) {
				$$('.tilesetTabContent').each(function(elm){
				    elm.hide();
				});
				$('tilesetTabBody_'+category.toMD5()).show();
			    }.bind(this)
			}
		    })
		    ));

		Object.each(contents,(function(tileset,name){
		    tabBody.adopt(
			tbl = new HtmlTable({
			    zebra : true,
			    useKeyboard : false,
			    selectable : true,
			    properties : {
				id : 'tilesetTabBody_'+category.toMD5(),
				'class' : 'tilesetTabContent',
				cellpadding : 6,
				styles :{
				    width : '100%'
				}
			    },
			    headers : [
			    {
				properties : {
				    'class' : 'textMedium '
				},
				content : 'Minimap'
			    },
			    {
				properties : {
				    'class' : 'textMedium '
				},
				content : 'Name / Desc'
			    },
			    {
				properties : {
				    'class' : 'textMedium '
				},
				content : 'Stats'
			    },
			    {
				properties : {
				    'class' : 'textMedium '
				},
				content : 'User'
			    }
			    ],
			    rows : [[]],
			    onRowFocus : function(event) {
				$('buttonOpenTileset').store('tileset',event.retrieve('tileset'));
			    }.bind(this)
			}));

		    var row = tbl.push([
		    {
			properties : {},
			content : new Element('image',{
			    'class' : 'loadTileset',
			    src : tileset.options.minimap && tileset.options.minimap.dataUrl || '',
			    styles : {
				'max-width' : '50px',
				'height' : '50px'
			    }
			})
		    },
		    {
			properties : {
			    'class' : 'NoWrap'
			},
			content : 'Name: <b>'+tileset.options.property.name + '</b>'+
			'<br>Description: <b>'+tileset.options.property.description + '</b>'
		    },
		    {
			properties : {
			    'class' : 'NoWrap'
			},
			content : '<br>Objects: <b>'+ tileset.options.database.totalObjects.format() + '</b>'+
			'<br>Area: <b>'+tileset.options.database.totalArea.format() + '/m<sup>2</sup></b>'
		    },
		    {
			properties : {
			    'class' : 'NoWrap'
			},
			content : tileset.options.database.userName
		    }
		    ]);
		    row.tr.store('tileset',tileset);
		    row = null;
		}));
	    }.bind(this));
	    div = null;
	    tbl = null;
	    MUI.initializeTabs('tilesetTabs');
	});

	return div;
    },

    listTilesets : function(options,callback) {
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=MapEditor&m=listTilesets',
	    onFailure : function(error) {
		if ($('listTilesetWindow')) {
		    MUI.closeWindow($('listTilesetWindow'));
		}
		RPG.Error.show(error);
	    }.bind(this),
	    onSuccess : function(tilesetList) {
		callback(tilesetList);
	    }.bind(this)
	}).get();
    },

    openTileset : function(tileset) {
	if (tileset && tileset.options && tileset.options.database && tileset.options.database.tilesetID) {
	    new Request.JSON({
		url : '/index.njs?xhr=true&a=MapEditor&m=openTileset&tilesetID='+tileset.options.database.tilesetID,
		onFailure : function(error) {
		    if ($('listTilesetWindow')) {
			MUI.closeWindow($('listTilesetWindow'));
		    }
		    RPG.Error.show(error);
		}.bind(this),
		onSuccess : function(opendTileset) {
		    this.loadTileset(opendTileset);
		}.bind(this)
	    }).get();
	}
    },
    loadTileset : function(tileset) {
	if (!this.tilesets[tileset.options.property.category]) {
	    this.tilesets[tileset.options.property.category] = {};
	}
	this.tilesets[tileset.options.property.category][tileset.options.property.name] = tileset;
	this.changeTileset(tileset.options.property.category,tileset.options.property.name);
    }

});