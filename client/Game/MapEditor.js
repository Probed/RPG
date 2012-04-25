/*
 * MapEditor.js
 *
 * Cient MapEditor Class
 *
 *
 */

define([
    '../Character/Character',
    '../../common/Character/Portraits',
    '../../common/Character/Character',
    './Item',
    './Map',
    '../../common/Game/Generators/Generators',
    '../../common/Game/Generators/Words',
    '../../common/Game/Generators/Utilities',
    '../../common/Constraints',

    '../../common/Game/Tiles/Tiles',
    '../../common/Game/universe',

    '../Character/CharacterEquipment',
    '../../common/Game/Tiles/Utilities',
    '../../common/Random',
    '../mootools/FancySortable'
    ], function () {

	RPG.MapEditor = new (new Class({
	    Implements : [Events,Options],
	    favoritesCache : null,
	    tilesets : null,
	    currentUniverse : null,
	    universes : {},
	    currentMap : null,
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

		this.createMap = {
		    label: 'Create new map',
		    image: '/client/jx/themes/dark/images/plus.png',
		    onClick : function() {
			this.newMapDialog();
		    }.bind(this)
		};
		this.editToolbar = new Jx.Toolbar({
		    align : 'center',
		    height : 28,
		    items : [
		    this.uniList = new Jx.Field.Combo({
			fieldClass : 'uniCombo',
			items: [
			{
			    label: 'Select a universe...'
			},
			{
			    label: 'Create New Universe',
			    image: '/client/jx/themes/dark/images/plus.png',
			    onClick : function() {
				this.newUniverseDialog();
			    }.bind(this)
			},
			{
			    label: 'Retrieve Universe Listing',
			    image: '/client/jx/themes/dark/images/folder-open.png',
			    onClick : function() {
				this.listUniverses();
			    }.bind(this)
			}
			]
		    }),
		    this.mapList = new Jx.Field.Combo({
			fieldClass : 'mapCombo'
		    }),
		    ,
		    new Jx.Button({
			id: 'mapTiles',
			label: 'Map Tiles',
			image: '/client/jx/themes/dark/images/map.png',
			tooltip: 'Listing of current Map Tiles',
			onClick : function() {
			    this.refreshMapTree().open();
			    this.refreshMapTree().resize();
			}.bind(this)
		    }),
		    new Jx.Menu({
			label : 'Generate'
		    }).add((function(){
			var generators = [];
			['Map','Item','NPC'].each(function(gen){
			    var sub = new Jx.Menu.SubMenu({
				label : gen
			    });
			    generators.push(sub);
			    Object.each(RPG.Generators[gen],function(content,key){
				sub.add(new Jx.Menu.Item({
				    label : key,
				    onClick : function() {
					this.generatorDialog([gen,key]);
				    }.bind(this)
				}));
			    }.bind(this));
			}.bind(this));
			return generators;
		    }.bind(this))()),
		    new Jx.Button.Flyout({
			id: 'newTile',
			label: 'New Tile',
			image: '/client/jx/themes/dark/images/plus.png',
			tooltip: 'Create a new Tile.',
			content : new Jx.Tree({
			    onSelect: function(item) {
				Object.getFromPath(item,'options.path') && this.tileDialog({
				    path : item.options.path,
				    cache : RPG.Tiles
				});
			    }.bind(this),
			    items : (function(){
				var arr = [];
				Object.each(RPG.Tiles,function(content,key){
				    if (key == 'options') return;
				    arr.push(this.tileTree(new Jx.Tree.Folder({
					label : key.capitalize()
				    }),content,key,[key]));
				}.bind(this));
				return arr;
			    }.bind(this)())
			})
		    })
		    ]

		});

		this.mapEditorDiv = new Element('div',{
		    'id' : 'mapEditor',
		    'class' : 'jxToolbarAlignCenter'
		}).adopt(

		    this.editToolbar.toElement(),

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
			if ($$('.selectedTile')[0]) {
			    this.paintingTiles = true;
			} else {
			    this.draggingMap = true;
			    this.dragMapStart = {
				x : event.event.pageX,
				y : event.event.pageY
			    };
			}
			event.preventDefault();
		    }.bind(this),
		    'mouseup:relay(td.M_tileHolder)' : function(event) {
			this.paintingTiles = false;
			event.preventDefault();
		    //drag mouse up handled below in document events
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
			    this.toggleSelectedTile('currentMap.cache',event.target.retrieve('tilePath'))
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
			    var newRowOffset = (Math.floor(Math.abs(this.dragMapStart.y - event.event.pageY) / this.mapZoom)*(this.dragMapStart.y < event.event.pageY?-1:1)) + this.rowOffset;
			    var newColOffset = (Math.floor(Math.abs(this.dragMapStart.x - event.event.pageX) / this.mapZoom)*(this.dragMapStart.x < event.event.pageX?-1:1)) + this.colOffset;

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
			'esc' : function(event) {
			    if ($$('.selectedTile')[0]){
				$$('.selectedTile').removeClass('selectedTile');
				$$('.M_mapTable').setStyles({
				    cursor : 'pointer'
				});
			    }
			},
			'alt+n': function(event) {

			}.bind(this),
			'alt+s': function(event){

			}.bind(this),
			'ctrl+c': function(event){

			}.bind(this),
			'ctrl+v': function(event){

			}.bind(this),
			'ctrl+x': function(event){

			}.bind(this),
			'ctrl+z': function(event){

			}.bind(this),
			'ctrl+y': function(event){

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
			Test : this.currentMap = {
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
			    cache : {},
			    tiles : {}
			}
		    }
		};
		/**/

		window.addEvents({
		    'resize' : function(){
			this.refreshMap();
		    //this.positionMinimap();
		    }.bind(this)
		});

	    },
	    toElement : function() {
		return this.mapEditorDiv;
	    },
	    populate : function() {
		this.refreshMap();
		return this;
	    },

	    tileTree : function (parent,content,key,path,folders,items,openPaths) {
		if (key == 'options') return parent;
		if (!folders) folders = [];
		if (!items) items = [];
		if (content && Object.getLength(content) > (content.options?1:0)) {
		    Object.each(content,function(c,k){
			if (k == 'options') return;
			if (typeOf(c) == 'object') {
			    path.push(k);
			    folders.push(new Jx.Tree.Folder({
				label : k,
				folderPath : Array.clone(path),
				open : openPaths && openPaths.contains(path.join())
			    }));
			    parent.add(this.tileTree(folders[folders.length-1],c,k,path,folders,items,openPaths));
			    path.pop();
			}
		    }.bind(this));
		} else {
		    var imgName = null;
		    if (typeOf(Object.getFromPath(content,'options.property.image.name'))  == 'array') {
			imgName = Object.getFromPath(content,'options.property.image.name.0')
		    } else {
			imgName = Object.getFromPath(content,'options.property.image.name')
		    }
		    var p = path.join('/');
		    if (openPaths) {
			p = RPG.trimPathOfNameAndFolder(path).join('/');
		    }
		    items.push(new Jx.Tree.Item({
			label : key,
			image : imgName && '/common/Game/Tiles/' + p + '/'+ imgName,
			imageClass : 'treeImg',
			path : path
		    }));
		    parent.add(items[items.length-1]);
		}
		return parent;
	    },

	    refreshMapTree : function(expand) {
		var mapName = Object.getFromPath(this,'currentUniverse.options.settings.activeMap');
		if (!mapName) {
		    return;
		}
		if (!this.mapTilesTreeDialog) this.mapTilesTreeDialog = {};
		if (!this.mapTilesTreeDialog[mapName]) this.mapTilesTreeDialog[mapName] = {};

		var mttd = this.mapTilesTreeDialog && this.mapTilesTreeDialog[mapName];
		if (!mttd.jxDialog) {
		    mttd.jxDialog = new Jx.Dialog({
			label : mapName + ' Tiles',
			resize : true,
			height : 400,
			modal : false,
			content :  mttd.jxTree = new Jx.Tree({
			    onSelect: function(item) {
				Object.getFromPath(item,'options.path') && this.tileDialog({
				    path : item.options.path,
				    cache : this.currentMap.cache
				});
			    }.bind(this)
			})
		    });
		}
		//check existing folders to record their open status
		var openPaths = [];
		if (mttd.jxTreeFolders) {
		    mttd.jxTreeFolders.each(function(folder) {
			if (folder.options.open) {
			    openPaths.push(folder.options.folderPath.join());
			}
		    });
		    mttd.jxTree.empty();
		}
		mttd.jxTreeFolders = [];
		mttd.jxTreeItems = [];
		var arr = [];
		Object.each(this.currentMap.cache,function(content,key){
		    if (key == 'options') return;
		    arr.push(this.tileTree(new Jx.Tree.Folder({
			label : key,
			open : true
		    }),content,key,[key],mttd.jxTreeFolders,mttd.jxTreeItems,openPaths));
		}.bind(this));
		mttd.jxTree.add(arr);
		return mttd.jxDialog;
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

	    newUniverseDialog : function() {
		if (this.newUniDialog && this.newUniDialog.close) {
		    this.newUniDialog.close();
		    delete this.newUniDialog;
		}
		this.newUniDialog = RPG.Dialog.form({
		    id : 'newUniverseDialog',
		    label : 'New Universe',
		    image: '/client/jx/themes/dark/images/plus.png',
		    width : 400,
		    height : 300,
		    destroyOnClose : true,
		    validate : this.validateNewUniverse.bind(this),
		    onClose : function(dialog,value) {
			if (value) {
			    this.startNewUniverse();
			}
			dialog.toElement().destroy();
		    }.bind(this),
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
			rows : [[
			{
			    properties : {
				'class' : 'textLeft largeText'
			    },
			    content : 'Universe:'
			}
			],
			[
			{
			    content : RPG.Constraints.getTable(RPG.universe_options,null,[],null,'newUniverse')
			}
			],
			[
			{
			    properties : {
				'class' : 'textLeft largeText'
			    },
			    content : 'Start Map:'
			}
			],
			[
			{
			    content : RPG.Constraints.getTable(RPG.map_options,null,[],null,'newMap')
			}
			]]
		    }).toElement()
		});
	    },

	    validateNewUniverse : function() {
		var universeOptions = RPG.Constraints.getFromInput('newUniverseDialog','newUniverse');
		var mapOptions = RPG.Constraints.getFromInput('newUniverseDialog','newMap');
		var uniErrors = RPG.Constraints.validate(universeOptions,RPG.universe_options);
		uniErrors.append(RPG.Constraints.validate(mapOptions,RPG.map_options));

		if (uniErrors && uniErrors.length > 0) {
		    RPG.Dialog.error(uniErrors);
		    return false;
		}
		return true;
	    },

	    startNewUniverse: function() {
		var universeOptions = RPG.Constraints.getFromInput('newUniverseDialog','newUniverse');
		var mapOptions = RPG.Constraints.getFromInput('newUniverseDialog','newMap');

		new Request.JSON({
		    url : '/index.njs?xhr=true&a=MapEditor&m=checkDupeUniverseName&universeName='+($('property__universeName') && $('property__universeName').value),
		    onFailure : function(error) {
			RPG.Dialog.error(error);
			universeOptions = null;
		    }.bind(this),
		    onSuccess : function() {
			Object.erase(this,'currentUniverse');
			Object.erase(this,'currentTiles');

			var universe = this.currentUniverse = Object.clone(RPG.universe);
			this.currentUniverse.options = universeOptions;
			var map = this.currentMap = Object.clone(RPG.map);
			map.options = mapOptions;
			universeOptions.property.startMap = map.options.property.mapName;
			universeOptions.settings = {
			    activeMap : map.options.property.mapName
			};
			universe.maps[map.options.property.mapName] = map;

			this.uniList.add({
			    label: universe.options.property.universeName,
			    image: '/client/jx/themes/dark/images/maps-stack.png',
			    onClick : function() {
				this.openUniverse(universe,function(){
				    this.listMaps(universe);
				}.bind(this));
			    }.bind(this)
			});
			this.uniList.setValue(universe.options.property.universeName);
			this.universes[universe.options.property.universeName] = universe;
			this.listMaps(universe);
			this.changeMap(map.options.property.mapName);

			universeOptions = null;
		    }.bind(this)
		}).get();
	    },

	    listUniverses : function() {
		if (this.uniList.isBusy()) return;
		this.uniList.setBusy(true);
		new Request.JSON({
		    url : '/index.njs?xhr=true&a=MapEditor&m=listUserUniverses',
		    onFailure : function(error) {
			this.uniList.setBusy(false);
			RPG.Dialog.error(error);
		    }.bind(this),
		    onSuccess : function(universeList) {
			this.uniList.setBusy(false);
			Object.each(universeList,function(universe,name){
			    if (!this.universes[name]) {
				this.universes[name] = universe;
				this.uniList.add({
				    label: name,
				    image: '/client/jx/themes/dark/images/maps-stack.png',
				    onClick : function() {
					this.openUniverse(universe,function(){
					    this.listMaps(universe);
					}.bind(this));
				    }.bind(this)
				});
			    }
			}.bind(this));
		    }.bind(this)
		}).get();
	    },

	    openUniverse : function(universe,callback) {
		if (!Object.getFromPath(universe,'options.database.id')) {
		    this.changeUniverse(universe);
		    callback();
		    return;
		}
		var options = {
		    universeID : universe.options.database.id,
		    start :  [this.rowOffset,this.colOffset],
		    end :  [this.rowOffset+this.calcRows(),this.colOffset+this.calcCols()]
		};
		/**
		 * Retrieve universe from server
		 */
		new Request.JSON({
		    url : '/index.njs?xhr=true&a=MapEditor&m=openUniverse',
		    onFailure : function(error) {
			RPG.Dialog.error(error);
		    }.bind(this),
		    onSuccess : function(results) {
			this.changeUniverse(Object.merge(universe,results.universe));
			callback();
		    }.bind(this)
		}).post(JSON.encode(options));
	    },

	    changeUniverse : function(universe) {

		this.currentUniverse = universe;
		if (universe.options.settings && universe.options.settings.activeMap){
		    this.changeMap(universe.options.settings.activeMap);
		} else {
		    this.changeMap(universe.options.property.startMap);
		}
	    },

	    editUniverseDialog : function() {
		RPG.Dialog.form({
		    id : 'editUniDialog',
		    label : 'Edit Universe Options',
		    image: '/client/jx/themes/dark/images/maps-stack.png',
		    width : 400,
		    height : 300,
		    destroyOnClose : true,
		    validate : this.validateEditUniverse.bind(this),
		    onClose : function(dialog,value) {
			if (value) {
			    this.editUniverse();
			}
		    }.bind(this),
		    content : (RPG.Constraints.getTable(Object.merge(Object.clone(RPG.universe_options),{
			property : {
			    startMap : Object.keys(this.currentUniverse.maps).erase('options')
			}
		    }),null,[],this.currentUniverse.options,'editUniverse'))
		});
	    },

	    validateEditUniverse : function() {
		var errors = RPG.Constraints.validate(RPG.Constraints.getFromInput('editUniDialog','editUniverse'),Object.merge(Object.clone(RPG.universe_options),{
		    property : {
			startMap : Object.keys(this.currentUniverse.maps).erase('options')
		    }
		}));
		if (errors && errors.length > 0) {
		    RPG.Dialog.error(errors);
		    errors = null;
		    return false;
		}
		return true;
	    },

	    editUniverse : function() {
		var options = RPG.Constraints.getFromInput('editUniDialog','editUniverse');
		new Request.JSON({
		    url : '/index.njs?xhr=true&a=MapEditor&m=checkDupeUniverseName&universeName='+options.property.universeName+'&universeID='+(this.currentUniverse.options.database && this.currentUniverse.options.database.id?this.currentUniverse.options.database.id:0),
		    onFailure : function(error) {
			RPG.Dialog.error(error);
		    }.bind(this),
		    onSuccess : function(result) {
			Object.merge(this.currentUniverse.options,options);
			this.refreshMapTree();
			this.editUniDialog.close();
		    }.bind(this)
		}).get();
	    },

	    closeUniverse : function() {
		Object.erase(this,'currentUniverse');
		Object.erase(this,'currentTiles');
		Object.erase(this,'currentMap.cache');
		this.rows = 1;
		this.cols = 1;

		this.refreshMapTree();
		this.refreshMap();
	    },

	    newMapDialog : function() {
		if (!this.currentUniverse) {
		    RPG.Dialog.error('No active universe found.')
		    return;
		}
		if (this.newMapDlg && this.newMapDlg.close) {
		    this.newMapDlg.close();
		}
		this.newMapDlg = RPG.Dialog.form({
		    id : 'newMapdlg',
		    label : 'New Map',
		    image: '/client/jx/themes/dark/images/plus.png',
		    width : 400,
		    height : 300,
		    destroyOnClose : true,
		    validate : this.validateNewMap.bind(this),
		    onClose : function(dialog,value) {
			if (value) {
			    this.addNewMap();
			}
		    }.bind(this),
		    content :  RPG.Constraints.getTable(RPG.map_options,null,[],null,'newMap')
		}).open();
	    },

	    validateNewMap : function() {
		var options = RPG.Constraints.getFromInput('newMapdlg','newMap');
		var errors = RPG.Constraints.validate(options,RPG.map_options);
		if (options && this.currentUniverse.maps[options.property.mapName]) {
		    errors.push('The map "'+options.property.mapName+'" already exists.');
		}
		if (errors && errors.length > 0) {
		    RPG.Dialog.error(errors);
		    return false;
		}
		return true;
	    },

	    addNewMap : function() {
		var options = RPG.Constraints.getFromInput('newMapdlg','newMap');
		var map = Object.clone(RPG.map);
		Object.merge(map.options,options);
		this.currentMap = this.currentUniverse.maps[options.property.mapName] = map;

		this.mapList.add({
		    label: options.property.mapName,
		    image: '/client/jx/themes/dark/images/map.png',
		    onClick : function() {
			this.changeMap(options.property.mapName);
		    }.bind(this)
		});
		this.mapList.setValue(options.property.mapName);

		this.changeMap(options.property.mapName);
	    },

	    listMaps : function(universe) {
		this.mapList.empty();
		this.mapList.add(this.createMap);
		Object.each(universe.maps,function(map,mapName){
		    this.mapList.add({
			label: mapName,
			image: '/client/jx/themes/dark/images/map.png',
			onClick : function() {
			    this.changeMap(mapName);
			}.bind(this)
		    });
		}.bind(this));
		this.mapList.setValue(universe.options.settings.activeMap);
	    },

	    changeMap : function(mapName) {
		if (!mapName || !this.currentUniverse) return;

		if (this.currentUniverse.maps[mapName]) {
		    if (!this.currentUniverse.options.settings) {
			this.currentUniverse.options.settings = {};
		    }

		    if (this.currentUniverse.options.settings.activeMap != mapName && this.mapTilesTreeDialog && this.mapTilesTreeDialog[this.currentUniverse.options.settings.activeMap] && this.mapTilesTreeDialog[this.currentUniverse.options.settings.activeMap].jxDialog) {
			this.mapTilesTreeDialog[this.currentUniverse.options.settings.activeMap].jxDialog.close();
		    }
		    this.currentUniverse.options.settings.activeMap = mapName;
		    this.activeTileset = null;

		    if (!this.currentUniverse.maps[mapName].tiles) this.currentUniverse.maps[mapName].tiles = {};
		    if (!this.currentUniverse.maps[mapName].cache) this.currentUniverse.maps[mapName].cache = {};

		    this.currentMap = this.currentUniverse.maps[mapName];
		    this.refreshMapTree();
		    var bounds = RPG.getMapBounds(this.currentMap.tiles);
		    this.rowOffset = bounds.minRow==Infinity?0:bounds.minRow;
		    this.colOffset = bounds.minCol==Infinity?0:bounds.minCol;
		    this.refreshMap();
		}
	    },

	    editMapDialog : function() {
		if (!this.currentUniverse) {
		    Error.show('No Universe is currently open.');
		    return;
		}
		RPG.Dialog.form({
		    id : 'editMapDlg',
		    label : 'Edit Map Options',
		    image: '/client/jx/themes/dark/images/map.png',
		    width : 400,
		    height : 300,
		    destroyOnClose : true,
		    validate : this.validateMap.bind(this),
		    onClose : function(dialog,value) {
			if (value) {
			    this.editMap();
			}
		    }.bind(this),
		    question : RPG.Constraints.getTable(Object.erase(Object.clone(RPG.map_options),'generators'),null,[],this.currentUniverse.maps[this.currentUniverse.options.settings.activeMap].options,'editMap')
		}).open();
	    },
	    validateMap : function() {
		var options = RPG.Constraints.getFromInput('editMapDlg','editMap');
		var errors = RPG.Constraints.validate(options,Object.erase(Object.clone(RPG.map_options),'generators'));
		if (options && this.currentUniverse.maps[options.property.mapName]) {
		    errors.push('The map "'+options.property.mapName+'" already exists.');
		}
		if (errors && errors.length > 0) {
		    RPG.Dialog.error(errors);
		    errors = null;
		    return;
		}
	    },
	    editMap : function() {
		var options = RPG.Constraints.getFromInput('editMapDlg','editMap');
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
		this.refreshMapTree();
		this.editMapDialog.close();
	    },


	    generatorDialog : function(generator) {
		var map = null;
		if (!this.currentUniverse && !this.activeTileset) {
		    RPG.Dialog.error('No active tileset/map.');
		    return;
		} else {
		    if (!this.activeTileset) {
			map = this.currentUniverse.maps[this.currentUniverse.options.settings.activeMap];
		    } else if (this.activeTileset) {
			map = this.activeTileset;
		    }
		    if (!map.options.generator || (map.options.generator && !map.options.generator[generator[1]])) {
			map.options.generator = {};
			map.options.generator[generator[1]] = {
			    options:{}
			}
		    }
		}
		if (!map) return;
		if (this.generatorDlg && this.generatorDlg.close) {
		    this.generatorDlg.close();
		    delete this.generatorDlg;
		}
		this.generatorDlg = RPG.Dialog.form({
		    id : 'generateDlg',
		    label : 'Generate ' + generator[1],
		    image: '/client/jx/themes/dark/images/map.png',
		    width : 400,
		    height : 400,
		    destroyOnClose : true,
		    validate : function() {
			var options = RPG.Constraints.getFromInput('generateDlg','generator');
			var errors = RPG.Constraints.validate(options,RPG.Generator[generator[1]].constraints);
			if (errors && errors.length > 0) {
			    RPG.Dialog.error(errors);
			    errors = null;
			    return false;
			}
			return true;
		    },
		    onClose : function(dialog,value) {
			if (value) {
			    var options = RPG.Constraints.getFromInput('generateDlg','generator');
			    RPG.Generator[generator[1]].generate(options,RPG.Random,function(generated){
				if (generated.tiles && generated.cache) {
				    Object.merge(map.tiles,generated.tiles);
				    Object.merge(map.cache,generated.cache);
				    Object.merge(map.options.generator[generator[1]].options,options);
				    this.refreshMapTree();
				    this.refreshMap();

				} else if (typeOf(generated) == 'string') {
				    RPG.Dialog.success('Generated: <b>'+generated+'</b>');
				}
			    }.bind(this));
			}
			dialog.toElement().destroy();
		    }.bind(this),
		    content : 'Loading...'
		});
		this.generatorDlg.open();
		if (!Object.getFromPath(RPG,['Generator',generator[1]])) {
		    require(Object.getFromPath(RPG.Generators,generator).require.js,function(){
			this.generatorDlg.content.empty().adopt(RPG.Constraints.getTabs(RPG.Generator[generator[1]].constraints,null,[],map.options.generator[generator[1]].options,'generator'));
		    }.bind(this));
		} else {
		    this.generatorDlg.content.empty().adopt(RPG.Constraints.getTabs(RPG.Generator[generator[1]].constraints,null,[],map.options.generator[generator[1]].options,'generator'));
		}
	    },
	    tileDialog : function(options) {
		if (this.tileDlg && this.tileDlg.close) {
		    this.tileDlg.close();
		    delete this.tileDlg;
		}
		this.tileDlg = RPG.Dialog.form({
		    id : 'tileDialog',
		    label : (options.path.join(' > ')).capitalize(),
		    image: '/client/jx/themes/dark/images/map.png',
		    width : 470,
		    height : 400,
		    destroyOnClose : true,
		    validate : function() {
			this.validateNewTile(options);
		    }.bind(this),
		    onClose : function(dialog,value) {
			if (value) {
			    this.addNewTile(options);
			    this.refreshMap();
			}
			dialog.toElement().destroy();
		    }.bind(this)
		});
		this.tileDlg.open();
		this.tileDlg.content.empty().adopt(this.showTileConfig(options));
		this.buildTileImages(options);
	    },

	    buildTileImages : function(options) {
		var path = options.path;
		if (options.cache != RPG.Tiles) {
		    path = options.path.slice(1,path.length-1);
		}
		var pathObj = Object.getFromPath(RPG.Tiles,path);
		var select = $$('#property__image__name')[0];
		if (!select) return;
		var newSelect = null;
		(newSelect = new Jx.Field.Combo({
		    id : 'property__image__name',
		    fieldClass : 'imageCombo'
		})).toElement().replaces(select);
		select.destroy()

		Object.getFromPath(pathObj,'options.property.image.name') && Object.getFromPath(pathObj,'options.property.image.name').each(function(img){
		    newSelect.add({
			label : img,
			image : '/common/Game/Tiles/'+path.join('/')+'/'+escape(img),
			imageClass : 'imageComboImg'
		    });
		}.bind(this));
		newSelect.setValue((options.cache != RPG.Tiles) && Object.getFromPath(options.cache,options.path).options.property.image.name);
	    },
	    showTileConfig : function(options) {
		var path = options.path;
		if (options.cache != RPG.Tiles) {
		    path = options.path.slice(1,path.length-1);
		}
		var constraint_options = RPG.Constraints.getConstraints(path,RPG.Tiles);
		var loadOptions = null;
		if (options.cache != RPG.Tiles) {
		    loadOptions = Object.getFromPath(options.cache,options.path).options;
		}
		if (constraint_options.teleportTo) {
		    constraint_options.teleportTo.mapName = [''].append(Object.keys(this.currentUniverse.maps));
		}

		return RPG.Constraints.getTabs(constraint_options,null,[],loadOptions,'tile');
	    },
	    validateNewTile : function(options) {
		var path = options.path;
		if (options.cache != RPG.Tiles) {
		    path = options.path.slice(1,path.length-1);
		}
		var tileOptions = RPG.Constraints.getFromInput(options.parentID,'tile');
		var errors = RPG.Constraints.validate(tileOptions,RPG.Constraints.getConstraints(path,RPG.Tiles));
		if (errors && errors.length > 0) {
		    RPG.Dialog.error(errors);
		    return false;
		}
		return true;
	    },
	    addNewTile : function(options) {
		var path = options.path;
		if (options.cache != RPG.Tiles) {
		    path = options.path.slice(1,path.length-1);
		}
		var tileOptions = RPG.Constraints.getFromInput(options.parentID,'tile');
		RPG.createTile(Array.clone(options.path),this.currentMap.cache,tileOptions);
		this.refreshMap();
	    },
	    calcCols : function() {
		return Math.floor(($('pnlMainContent').getSize().x - 90) / this.mapZoom);
	    },
	    calcRows : function() {
		return Math.floor(($('pnlMainContent').getSize().y - 108) / this.mapZoom);
	    },

	    refreshMap : function() {
		if (this.refreshingMap) return;
		this.refreshingMap = true;
		var c = 0;
		var r = 0;
		/**
		 * calculate the max columns and rows based on the this.mapZoom and panel size
		 */
		if (this.mapZoom < 16) {
		    this.mapZoom = 16;
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
		options.selectedTile = $$('.selectedTile')[0];
		if (!options.selectedTile) {
		    return;
		}

		if (onBottom) {
		    RPG.unshiftTile(this.currentMap.tiles,[options.row,options.col],options.selectedTile.retrieve('tilePath'));
		} else {
		    RPG.pushTile(this.currentMap.tiles,[options.row,options.col],options.selectedTile.retrieve('tilePath'));
		}
		$('mR'+(options.row)+'mC'+(options.col)).removeClass('M_tileHolder-empty').setStyles(this.getMapTileStyles(options));

		Object.erase(options,'tileArr');
		Object.erase(options,'selectedTile');
	    },

	    toggleSelectedTile : function(root,path) {
		var selected = $$('.selectedTile')[0];
		var toSelect = $$('#p'+path.toMD5()+' a')[0];
		if (selected && selected.retrieve('tilePath').join('') == path.join('')) {
		    selected.removeClass('selectedTile');
		    $$('.M_mapTable').setStyles({
			cursor : 'pointer'
		    });
		} else if(toSelect) {
		    $$('.M_mapTable').setStyles(RPG.getMapTileCursor(path,Object.getFromPath(toSelect.retrieve('cache'),path)));
		    $$('.selectedTile').removeClass('selectedTile');
		    this.expandTree('currentMap.cache',path);
		    toSelect.addClass('selectedTile');
		}
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
		var remove = RPG.removeTile(this.currentMap.tiles,selectedTilePath,[options.row,options.col]);
		if (remove) {
		    var addClass = '';
		    if (this.currentMap.tiles[options.row][options.col].length == 0) {
			addClass = 'M_tileHolder-empty';
			this.currentMap.tiles[options.row][options.col] = null;
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
		if (!this.loadingTiles && this.currentUniverse && this.currentUniverse.options.database && this.currentUniverse.options.database.id && this.currentUniverse.options.settings.activeMap) {
		    this.loadingTiles = true;
		    /**
	     * Loop through all the tile holder cells that are empty
	     */
		    var getTiles = [];
		    var currenMapDatabaseOpts = this.currentUniverse.maps[this.currentUniverse.options.settings.activeMap].options.database;

		    if (!currenMapDatabaseOpts || currenMapDatabaseOpts.minRow == null || currenMapDatabaseOpts.maxRow  == null || currenMapDatabaseOpts.minCol == null || currenMapDatabaseOpts.maxCol == null) {
			this.loadingTiles = false;
			return;
		    }

		    $$('.M_tileHolder').each(function(tileHolder){
			if (!tileHolder || tileHolder.style.backgroundImage != 'none') {
			    this.loadingTiles = false;
			    return;
			}
			var rowcol = tileHolder.id.replace('mR','').split('mC');
			//exclude tiles outside the range of the saved database tiles
			if (rowcol[0] >= currenMapDatabaseOpts.minRow && rowcol[0] <= currenMapDatabaseOpts.maxRow && rowcol[1] >= currenMapDatabaseOpts.minCol && rowcol[1] <= currenMapDatabaseOpts.maxCol) {
			    //exclude user ui deteled tiles
			    if (!currenMapDatabaseOpts.tileDelete || (currenMapDatabaseOpts.tileDelete && !currenMapDatabaseOpts.tileDelete.contains(rowcol[0]+','+rowcol[1]))) {
				getTiles.push(rowcol);
			    }
			}
		    });
		    if (getTiles.length < 1) {
			this.loadingTiles = false;
			return;
		    }

		    new Request.JSON({
			url : '/index.njs?xhr=true&a=MapEditor&m=loadTiles&universeID='+this.currentUniverse.options.database.id+'&mapID='+currenMapDatabaseOpts.id+'&minRow='+currenMapDatabaseOpts.minRow+'&maxRow='+currenMapDatabaseOpts.maxRow+'&minCol='+currenMapDatabaseOpts.minCol+'&maxCol='+currenMapDatabaseOpts.maxCol,
			onFailure : function(error) {
			    //ignore errors
			    //RPG.Dialog.notify(error);
			    this.loadingTiles = false;
			}.bind(this),
			onSuccess : function(results) {
			    Object.merge(this.currentUniverse,results.universe);
			    var mapName = this.currentUniverse.options.settings.activeMap;
			    this.currentMap = this.currentUniverse.maps[mapName];
			    this.refreshMap();
			    this.loadingTiles = false;
			}.bind(this)
		    }).post(JSON.encode(getTiles));
		}
	    },

	    getMapTileStyles : function(options) {
		var styles = {
		    width : this.mapZoom,
		    height : this.mapZoom
		};
		if (options.tileArr || (this.currentMap.tiles[options.row] && this.currentMap.tiles[options.row][options.col])) {
		    var tileArr = options.tileArr || this.currentMap.tiles[options.row][options.col];

		    if (Object.keys(options).contains('tileArr') && !options.tileArr) {
			styles['background-image'] = 'none';
			return styles;
		    }

		    var cache = options.cache || this.currentMap.cache;
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
			for (var y=0;y<8;y++){
			    if (theTile.options.property.image['name'+(!y?'':y)]) {
				var imgs = theTile.options.property.image;
				var left = imgs['left'+(!y?'':y)];
				var top = imgs['top'+(!y?'':y)];
				var size = imgs['size'+(!y?'':y)];
				var repeat = imgs['repeat'+(!y?'':y)];
				styles['background-image'] = 'url("'+RPG.getMapTileImage(t,theTile,y)+'"),' + styles['background-image'];
				styles['background-position'] = (left?left+'% ':'0% ') + (top?top+'%,':'0%,') + styles['background-position'];
				styles['background-size'] = (size?size+'%,':'100%,') + styles['background-size'];
				styles['background-repeat'] = (repeat?repeat+',':'no-repeat,') + styles['background-repeat'];
			    }
			}
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
		if (this.editTileOrderDialog && this.editTileOrderDialog.close) {
		    this.editTileOrderDialog.close();
		    delete this.editTileOrderDialog;
		}
		if (!this.currentMap.tiles[options.row]) return;
		if (!this.currentMap.tiles[options.row][options.col]) return;
		var sortedList = null;
		this.editTileOrderDialog = RPG.Dialog.form({
		    id : 'editTileOrderDialog',
		    label : 'Editing Row: '+(options.row) + ' Column: '+(options.col),
		    content : this.populateTileOrderDialog(options),
		    width : 425,
		    height : 300,
		    onClose : function(dialog,value) {
			if (value) {
			    if (sortedList) {
				var arr = [];
				sortedList.each(function(listitem){
				    arr.push(listitem.retrieve('tilePath'));
				});
				this.currentMap.tiles[options.row][options.col] = arr;
				arr = null;
				sortedList = null;
				this.refreshMap();
			    }
			}
		    }.bind(this)
		});
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
	    },
	    populateTileOrderDialog : function(options) {
		if (!this.currentMap.tiles[options.row]) {
		    return null;
		}
		var tiles = this.currentMap.tiles[options.row][options.col];
		if (this.tileOrderTable) {
		    this.tileOrderTable.toElement().destroy();
		    delete this.tileOrderTable;
		}

		this.tileOrderTable = new HtmlTable({
		    zebra : false,
		    selectable : false,
		    useKeyboard : false,
		    properties : {
			'class' : 'tileOderTable',
			align : 'center'
		    }
		});

		var listWrap = new Element('div',{
		    id : 'tileOrderWrap'
		});

		//var row = [];
		tiles.each(function(t){
		    var theTile = Object.getFromPath(this.currentMap.cache,t);
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
				    'class' : 'vTop',
				    styles : {
					'background-size':'100%',
					'width' : '32px',
					'height' : '32px',
					'background-image' : 'url(/common/Game/Tiles/'+t.slice(1,t.length-1).join('/')+'/'+escape(theTile.options.property.image.name)+')'
				    }
				},
				content : new Element('div',{
				    html : '&nbsp;',
				    styles : {
					'cursor'  :'pointer',
					'width' : '32px',
					'height' : '32px'
				    },
				    events : {
					click : function(event) {
					    this.tileDialog({
						path : t,
						cache : this.currentMap.cache
					    });
					    event.event.stopPropagation();
					}.bind(this)
				    }
				})
			    },
			    {
				properties : {
				    'class' : 'tileOrderHandle vTop',
				    styles : {
					cursor : 'move'
				    }
				},
				content : t.join(' > ').capitalize()
			    },
			    {
				properties : {

				},
				content : new Jx.Button({
				    image : '/client/jx/themes/dark/images/cross.png',
				    onClick : function(event) {
					this.deleteSelectedTile({
					    selectedTile : div,
					    row : options.row,
					    col : options.col
					});
					this.editTileOrder(options);
				    }.bind(this)
				}).toElement()
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
		if (!this.currentMap.tiles[options.row]) {
		    return;
		}
		var tiles = this.currentMap.tiles[options.row][options.col];
		if (!tiles) {
		    return;
		}
		var imgs = [];
		var zoom = this.mapZoom;
		var cMap = this.currentMap.cache;
		tiles.each(function(tp) {
		    imgs.push(new Element('img',{
			'class' : 'tilePicker',
			src : '/common/Game/Tiles/'+tp.slice(1,tp.length-1).join('/')+'/'+(Object.getFromPath(cMap,tp).options.property.image.name),
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
		cMap = null;
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
		var maxRows = Object.keys(this.currentMap.tiles).max();
		var maxCols = 0;
		Object.each(this.currentMap.tiles,function(content,key){
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
			if (this.currentMap.tiles[r] && this.currentMap.tiles[r][c]) {
			    var zoom = this.miniMapZoom;
			    var imgs = {};
			    this.currentMap.tiles[r][c].each(function(tilePath){
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
		    RPG.Dialog.error({
			error : 'No universe currently selected.'
		    });
		    return;
		}
		new Request.JSON({
		    url : '/index.njs?xhr=true&a=MapEditor&m=checkDupeUniverseName&universeName='+this.currentUniverse.options.property.universeName+'&universeID='+(this.currentUniverse.options.database && this.currentUniverse.options.database.id?this.currentUniverse.options.database.id:0),
		    onFailure : function(error) {
			RPG.Dialog.error(error);
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

		    //			new MUI.Require({
		    //			    js : ['/common/zip/jszip.js'/*,'/common/zip/jszip-deflate.js'*/],
		    //			    onloaded : function() {
		    //				//var zip = new JSZip('DEFLATE');
		    //				//zip.add(this.currentUniverse.options.property.universeName+'.uni',JSON.stringify(this.currentUniverse));
		    //				new Request.JSON({
		    //				    url : '/index.njs?xhr=true&a=MapEditor&m=save&universeName='+this.currentUniverse.options.property.universeName,
		    //				    onFailure : function(error) {
		    //					RPG.Dialog.error(error);
		    //				    }.bind(this),
		    //				    onSuccess : function(result) {
		    //					Object.merge(this.currentUniverse,result);
		    //					RPG.Dialog.success('Universe Saved Successfully');
		    //				    }.bind(this)
		    //				}).post(/*zip.generate()*/ JSON.encode(this.currentUniverse));
		    //			    //zip = null;
		    //			    }.bind(this)
		    //			});

		    }.bind(this)
		}).get();

	    },

	    newTilesetDialog : function() {
		if (this.newTilesetDlg && this.newTilesetDlg.close) {
		    this.newTilesetDlg.close();
		}
		this.newTilesetDlg = new Jx.Dialog.From({
		    id : 'newTilesetDialog',
		    label : 'New Tileset',
		    content : RPG.Constraints.getTable(RPG.tileset_options,null,[],null,'newTileset'),
		    width : 250,
		    height : 200,
		    validate : this.validateTileset.bind(this),
		    onClose : function(dialog,value) {
			if (value) {
			    this.addNewTileset();
			}
		    }.bind(this)
		});
	    },

	    validateTileset : function() {
		var options = RPG.Constraints.getFromInput('newTilesetDialog','newTileset');
		var errors = RPG.Constraints.validate(options,RPG.tileset_options);

		if (errors && errors.length > 0) {
		    RPG.Dialog.error(errors);
		    return false;
		}
		return true;
	    },

	    addNewTileset : function() {
		var options = RPG.Constraints.getFromInput('newTilesetDialog','newTileset');

		this.tilesets[options.property.category] = {};
		this.tilesets[options.property.category][options.property.name] = {};
		this.tilesets[options.property.category][options.property.name].options = options;
		this.tilesets[options.property.category][options.property.name].cache = {};
		this.tilesets[options.property.category][options.property.name].tiles = {};

		this.changeTileset(options.property.category,options.property.name);

		MUI.closeDialog($('newTilesetDialog'));

	    },

	    changeTileset : function(category,name) {
		if (!this.tilesets[category] || (this.tilesets[category] &&!this.tilesets[category][name])) {
		    return;
		}
		if (this.currentUniverse) {
		    this.currentUniverse.options.settings.activeMap = null;
		}

		this.currentMap.cache = this.tilesets[category][name].cache;
		this.currentMap.tiles = this.tilesets[category][name].tiles;
		this.activeTileset = this.tilesets[category][name];
		this.refreshMapTree([category,name]);

		var bounds = RPG.getMapBounds(this.currentMap.tiles);
		this.rowOffset = bounds.minRow==Infinity?0:bounds.minRow;
		this.colOffset = bounds.minCol==Infinity?0:bounds.minCol;
		this.refreshMap();
	    },

	    saveTileset : function() {
		if (!this.activeTileset) {
		    RPG.Dialog.error({
			error : 'No tileset currently selected.'
		    });
		    return;
		}
		new Request.JSON({
		    url : '/index.njs?xhr=true&a=MapEditor&m=checkDupeTilesetName&name='+this.activeTileset.options.property.name+'&category='+this.activeTileset.options.property.category+'&tilesetID='+(this.activeTileset.options.database && this.activeTileset.options.database.id?this.activeTileset.options.database.id:0),
		    onFailure : function(error) {
			RPG.Dialog.error(error);
		    }.bind(this),
		    onSuccess : function(result) {

		    //			new MUI.Require({
		    //			    js : ['/common/zip/jszip.js'/*,'/common/zip/jszip-deflate.js'*/],
		    //			    onloaded : function() {
		    //				//var zip = new JSZip('DEFLATE');
		    //				//zip.add(this.currentUniverse.options.property.universeName+'.uni',JSON.stringify(this.currentUniverse));
		    //				new Request.JSON({
		    //				    url : '/index.njs?xhr=true&a=MapEditor&m=saveTileset',
		    //				    onFailure : function(error) {
		    //					RPG.Dialog.error(error);
		    //				    }.bind(this),
		    //				    onSuccess : function(result) {
		    //					Object.merge(this.activeTileset,result);
		    //					RPG.Dialog.success('Saved Tileset Successfully');
		    //				    }.bind(this)
		    //				}).post(/*zip.generate()*/ JSON.encode(this.activeTileset));
		    //			    //zip = null;
		    //			    }.bind(this)
		    //			});

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
		     * merge tileset cache into currentMap.cache
		     */
		    Object.merge(this.currentMap.cache,Object.clone(tileset.cache));

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
				    if (!this.currentMap.tiles[ctRow]) {
					this.currentMap.tiles[ctRow] = {};
				    }
				    this.currentMap.tiles[ctRow][ctCol] = Array.clone(tileset.tiles[row][col]);
				} else {
				    tileset.tiles[row][col].each(function(t){
					var dups = null;
					if (event.control) {
					    dups = RPG.tilesContainsPath(this.currentMap.tiles,t,[ctRow,ctCol]);
					    dups && dups.each(function(dupe){
						if (!dupe) return;
						this.deleteSelectedTile({
						    row : ctRow,
						    col : ctCol,
						    selectedTilePath : dupe.join('.')
						});
					    }.bind(this));
					} else if (event.shift) {
					    RPG.unshiftTile(this.currentMap.tiles,[ctRow,ctCol],t);
					} else {
					    RPG.pushTile(this.currentMap.tiles,[ctRow,ctCol],t);
					}
					dups = null;
				    }.bind(this));
				}

				if ($('mR'+ctRow+'mC'+ctCol)) {
				    $('mR'+ctRow+'mC'+ctCol).setStyles(this.getMapTileStyles({
					row : ctRow,
					col : ctCol
				    }));
				    if (this.currentMap.tiles[ctRow] && this.currentMap.tiles[ctRow][ctCol] && this.currentMap.tiles[ctRow][ctCol].length > 0) {
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
		    this.refreshMapTree();
		}
		tileholder = null;
		tileset = null;
	    },

	    listTilesets : function(options,callback) {
		new Request.JSON({
		    url : '/index.njs?xhr=true&a=MapEditor&m=listTilesets',
		    onFailure : function(error) {
			if ($('listTilesetDialog')) {
			    MUI.closeDialog($('listTilesetDialog'));
			}
			RPG.Dialog.error(error);
		    }.bind(this),
		    onSuccess : function(tilesetList) {
			callback(tilesetList);
		    }.bind(this)
		}).get();
	    },

	    openTileset : function(tileset) {
		if (tileset && tileset.options && tileset.options.database && tileset.options.database.id) {
		    new Request.JSON({
			url : '/index.njs?xhr=true&a=MapEditor&m=openTileset&tilesetID='+tileset.options.database.id,
			onFailure : function(error) {
			    if ($('listTilesetDialog')) {
				MUI.closeDialog($('listTilesetDialog'));
			    }
			    RPG.Dialog.error(error);
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

	}))();
    });