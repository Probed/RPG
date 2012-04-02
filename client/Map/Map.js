
RPG.Map = new Class({
    Implements : [Events,Options],

    rowOffset : 0,
    colOffset : 0,
    mapZoom : 48,

    rows : 1,
    cols : 1,

    options : {
	Character : null,//the RPG.Character class
	character : null,//the actual character
	universe : null
    },
    initialize : function(options) {
	this.setOptions(options);

	this.mapDiv = new Element('div',{
	    id : 'GameMap',
	    styles : {
		overflow : 'none'
	    },
	    events : {
		'mousewheel:relay(.M_tileHolder)' : function(event) {
		    this.paintingRows = false;
		    this.paintingColumns = false;
		    this.paintingTiles = false;
		    if (event.wheel > 0) {
			this.mapZoom += 8;
			this.refreshMap();
		    } else if (event.wheel < 0) {
			this.mapZoom -= 8;
			this.refreshMap();
		    }
		    event.preventDefault();
		}.bind(this),
		'mousedown:relay(.M_tileHolder)' : function(event) {
		    this.draggingMap = true;
		    this.dragMapStart = {
			x : event.event.pageX,
			y : event.event.pageY
		    };
		    event.preventDefault();
		}.bind(this),
		'mouseup:relay(.M_tileHolder)' : function(event) {
		    event.preventDefault();
		//drag mouse up handled below in document events
		}.bind(this)
	    }
	});
	$('pnlMainContent').setStyle('overflow-x','hidden');
	$('pnlMainContent').setStyle('overflow-y','hidden');

	document.body.addEvents({
	    mouseup : function(event) {
		if (this.draggingMap) {
		    this.draggingMap = false;
		    this.dragMapStart = null;
		}
	    }.bind(this),
	    mousemove : function(event) {
		if (this.draggingMap) {
		    var newRowOffset = (Math.floor(Math.abs(this.dragMapStart.y - event.event.pageY) / (this.mapZoom/1.25))*(this.dragMapStart.y < event.event.pageY?-1:1)) + this.rowOffset;
		    var newColOffset = (Math.floor(Math.abs(this.dragMapStart.x - event.event.pageX) / (this.mapZoom/1.25))*(this.dragMapStart.x < event.event.pageX?-1:1)) + this.colOffset;

		    if (newRowOffset != this.rowOffset || newColOffset != this.colOffset) {
			this.rowOffset = newRowOffset;
			this.colOffset = newColOffset;
			this.refreshMap();
			this.dragMapStart.x = event.event.pageX;
			this.dragMapStart.y = event.event.pageY;
		    }
		    newRowOffset = null;
		    newColOffset = null;

		}
	    }.bind(this)
	});

	this.mapCanvas = new Element('canvas',{
	    styles : {
		position : 'absolute'
	    },
	    events : {
		click : function(event) {
		    if (event && event.event.layerX > 0 && event.event.layerY && !this.miniMapDragging) {
			this.rowOffset = Math.floor((event.event.layerX / this.mapZoom)  - (this.rows/2));
			this.colOffset = Math.floor((event.event.layerY / this.mapZoom) - (this.cols/2));
			this.refreshMap();
		    }
		}.bind(this),
		mousewheel : function(event) {
		    if (event.wheel > 0) {
			this.mapZoom += 1;
		    } else {
			this.mapZoom -= 1;
		    }
		    this.refreshMap();
		}.bind(this)
	    }
	});

	[window,$('leftColumn').retrieve('instance'),$('rightColumn').retrieve('instance')].each(function(elm) {
	    elm.addEvents({
		'resize' : function(){
		    setTimeout(this.refreshMap.bind(this),1);
		}.bind(this)
	    });
	}.bind(this));
	[$('leftColumn').retrieve('instance'),$('rightColumn').retrieve('instance')].each(function(elm) {
	    elm.addEvent('collapse',function(){
		this.refreshMap();
	    }.bind(this));
	    elm.addEvent('expand',function(){
		this.refreshMap();
	    }.bind(this))
	}.bind(this));


	var keyEvents = {};

	//Move North
	keyEvents['keydown:'+RPG.AppUser.options.settings.keyboard.up] = function(event) {
	    this.moveCharacter('n');
	    event.preventDefault();
	}.bind(this);

	//Move South
	keyEvents['keydown:'+RPG.AppUser.options.settings.keyboard.down] = function(event) {
	    this.moveCharacter('s');
	    event.preventDefault();
	}.bind(this);

	//Move West
	keyEvents['keydown:'+RPG.AppUser.options.settings.keyboard.left] = function(event) {
	    this.moveCharacter('w');
	    event.preventDefault();
	}.bind(this);

	//Move East
	keyEvents['keydown:'+RPG.AppUser.options.settings.keyboard.right] = function(event) {
	    this.moveCharacter('e');
	    event.preventDefault();
	}.bind(this);

	//Activate
	keyEvents['keydown:'+RPG.AppUser.options.settings.keyboard.activate] = function(event) {
	    this.activateTile();
	    event.preventDefault();
	}.bind(this);

	this.keyUpEvents = new Keyboard({
	    events: keyEvents
	}).activate();

	this.refreshMap();
    },
    toElement : function() {
	return this.mapDiv;
    },

    calcCols : function() {
	return Math.floor(($('pnlMainContent').getSize().x) / this.mapZoom);
    },
    calcRows : function() {
	return Math.floor(($('pnlMainContent').getSize().y) / this.mapZoom);
    },

    refreshCanvas : function() {
	if (this.refreshingMap) return;
	this.refreshingMap = true;

	var map = this.options.universe.maps[this.options.character.location.mapName];

	var bounds = RPG.getMapBounds(map.tiles);
	var cols = bounds.maxCol - bounds.minCol;
	var rows = bounds.maxRow - bounds.minRow;


	this.mapCanvas.setStyles({
	    width : cols*this.mapZoom,
	    height : rows*this.mapZoom
	});
	this.mapCanvas.set('width',cols*this.mapZoom);
	this.mapCanvas.set('height',rows*this.mapZoom);

	this.mapCanvas.setPosition({
	    x : ($('pnlMainContent').getSize().x/2) - (this.mapCanvas.getSize().x/2),
	    y : ($('pnlMainContent').getSize().y/2) - (this.mapCanvas.getSize().y/2)
	});

	var context = this.mapCanvas.getContext('2d');

	RPG.EachTile(map.tiles,true,function(tileLoc) {
	    if (!tileLoc.tilePaths) return;//empty tile loc

	    tileLoc.tilePaths.each(function(tilePath){
		var tile = Object.getFromPath(map.cache,tilePath);
		if (!tile) return;

		var img = new Image();
		img.onload = function(){
		    context.drawImage(img,tileLoc.colIndex*this.mapZoom,tileLoc.rowIndex*this.mapZoom,this.mapZoom,this.mapZoom);
		    img = null;
		}.bind(this);
		img.src = RPG.getMapTileImage(tilePath,tile);

		if (tileLoc.row == this.options.character.location.point[0] && tileLoc.col == this.options.character.location.point[1]) {
		    var ch = new Image();
		    ch.onload = function(){
			context.drawImage(ch,tileLoc.colIndex*this.mapZoom,tileLoc.rowIndex*this.mapZoom,this.mapZoom,this.mapZoom);
			ch = null;
		    }.bind(this);
		    ch.src = RPG.getCharacterImage(this.options.character);
		}
	    }.bind(this));
	}.bind(this));

	this.mapDiv.adopt(this.mapCanvas);
	this.refreshingMap = false;
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

	this.options.Character.toElement().setStyle('height',this.mapZoom);
	this.options.Character.toElement().setStyle('width',this.mapZoom);
	//Object.merge(this.options.Character.options.character,this.options.character);
	this.options.Character.changeDirection(this.options.character.location.dir);

	var map = this.options.universe.maps[this.options.character.location.mapName];
	$$('#GameMap .teleportToLabel').each(function(elm) {
	    elm.hide();
	});
	if (newCols == this.cols && newRows == this.rows) {

	    if (!this.draggingMap) {
		this.rowOffset = this.options.character.location.point[0] - Math.floor(this.rows/2);
		this.colOffset = this.options.character.location.point[1] - Math.floor(this.cols/2);
	    }

	    var tileHolders = $$('#GameMap td.M_tileHolder');
	    tileHolders.each(function(elm){
		var row = Number.from(elm.get('row'));
		var col = Number.from(elm.get('col'));
		var styles = RPG.getMapTileStyles({
		    map : map,
		    row : row,
		    col : col,
		    rowOffset :  this.rowOffset,
		    colOffset :  this.colOffset,
		    zoom : this.mapZoom
		});

		if (map.tiles[row+this.rowOffset] && map.tiles[row+this.rowOffset][col+this.colOffset]) {
		    map.tiles[row+this.rowOffset][col+this.colOffset].each(function(path){
			var tile = Object.getFromPath(map.cache,path);
			if (!tile) return;
			if (tile.options.teleportTo) {
			    var div = $('teleportTo_'+path.toMD5());
			    if (!div) {
				div = new Element('div',{
				    id : 'teleportTo_'+path.toMD5(),
				    'class' : 'teleportToLabel NoWrap Button CancelButton',
				    html : tile.options.teleportTo.mapName || tile.options.property.tileName,
				    styles : {
					position : 'absolute'
				    }
				});
				this.mapDiv.adopt(div);
			    }
			    div.show();
			    div.setPosition({
				x : elm.getPosition($(this.mapDiv)).x - ($(div).getSize().x/2) + (this.mapZoom/2),
				y : elm.getPosition($(this.mapDiv)).y - $(div).getSize().y
			    });
			}
		    }.bind(this));
		}

		if (styles['background-image'] != 'none') {
		    elm.style.backgroundImage = styles['background-image'];
		    elm.style.backgroundPosition = styles['background-position'];
		    elm.style.backgroundSize = styles['background-size'];
		    elm.style.backgroundRepeat = styles['background-repeat'];
		} else {
		    elm.style.backgroundImage = 'none';
		}
		if (this.options.character.location.point[0] == (row + this.rowOffset) && this.options.character.location.point[1] == (col + this.colOffset)) {
		    elm.empty().adopt(this.options.Character.toElement());
		} else {
		    elm.empty();
		}
	    }.bind(this));

	    this.refreshingMap = false;
	    row = map = c = r = newCols = newRows = null;
	    return;
	} else {
	    this.cols = newCols;
	    this.rows = newRows;
	}

	this.rowOffset = this.options.character.location.point[0] - Math.floor(this.rows/2);
	this.colOffset = this.options.character.location.point[1] - Math.floor(this.cols/2);

	if (this.mapTable) {
	    $(this.mapTable).getElements('div').destroy();
	    $(this.mapTable).getElements('br').destroy();
	    $(this.mapTable).getElements('a').destroy();
	    $(this.mapTable).getElements('td').destroy();
	    $(this.mapTable).getElements('th').destroy();
	    $(this.mapTable).getElements('tbody').destroy();
	    $(this.mapTable).getElements('tfoot').destroy();
	    $(this.mapTable).getElements('thead').destroy();
	    $(this.mapTable).destroy();
	}

	this.mapTable = new HtmlTable({
	    zebra : false,
	    useKeyboard : false,
	    sortable : false,
	    selectable : false,
	    properties : {
		id : 'GameTable',
		cellpadding : 0,
		cellspacing : 0,
		styles : {
		    width : (this.mapZoom * this.cols),
		    height : (this.mapZoom * this.rows)
		}
	    },
	    rows : [[]]
	});

	var row = null;

	for (r = 0; r<this.rows; r++) {
	    row = [];
	    for (c = 0; c<this.cols; c++) {
		row.push(this.getMapCell({
		    map : map,
		    row : r,
		    col : c,
		    rowOffset : this.rowOffset,
		    colOffset : this.colOffset,
		    zoom : this.mapZoom
		}));
	    }
	    this.mapTable.push(row);
	}
	row = map = c = r = newCols = newRows = null;
	this.mapDiv.adopt(this.mapTable);
	this.refreshingMap = false;
    },


    getMapCell : function(options) {
	var styles = RPG.getMapTileStyles(options);
	var cell = {
	    properties : {
		id : 'mR'+(options.row)+'mC'+(options.col),
		'class' : 'M_tileHolder',
		styles : styles,
		row : options.row,
		col : options.col
	    },
	    content : this.options.character.location.point[0] == options.row + options.rowOffset && this.options.character.location.point[1] == options.col + options.colOffset ? this.options.Character.toElement() : '&nbsp;'
	};
	styles = null;

	if (options.map.tiles[options.row+options.rowOffset] && options.map.tiles[options.row+options.rowOffset][options.col+options.colOffset]) {
	    options.map.tiles[options.row+options.rowOffset][options.col+options.colOffset].each(function(path){
		var tile = Object.getFromPath(options.map.cache,path);
		if (!tile) return;
		if (tile.options.teleportTo) {
		    var div = $('teleportTo_'+path.toMD5());
		    if (!div) {
			div = new Element('div',{
			    id : 'teleportTo_'+path.toMD5(),
			    'class' : 'teleportToLabel NoWrap Button CancelButton',
			    html : tile.options.teleportTo.mapName || tile.options.property.tileName,
			    styles : {
				position : 'absolute'
			    }
			});
			this.mapDiv.adopt(div);
		    }
		    div.show();
		    div.setPosition({
			x : (options.col*this.mapZoom) - ($(div).getSize().x/2) + (this.mapZoom/2),
			y : (options.row*this.mapZoom) - $(div).getSize().y
		    });
		}
	    }.bind(this));
	}

	return cell;
    },

    moveCharacter : function(dir) {
	if (this.gameWaiting) return;

	var game = {
	    universe : this.options.universe,
	    character : this.options.character,
	    moveTo : RPG[dir](this.options.character.location.point,1),
	    dir : dir
	};

	this.gameWaiting = true;
	RPG.moveCharacterToTile(game, function(moveEvents){
	    game.events = moveEvents;
	    if (moveEvents.error) {
		RPG.Error.notify(moveEvents.error);
		this.gameWaiting = false;
		return;
	    } else {
		this.getServerEvents(game,'/index.njs?xhr=true&a=Play&m=MoveCharacter&characterID='+game.character.database.characterID+'&dir='+game.dir,function(){
		    this.refreshMap();
		    this.gameWaiting = false;
		}.bind(this));
	    }
	}.bind(this));
    },

    activateTile : function() {
	if (this.gameWaiting) return;

	var game = {
	    universe : this.options.universe,
	    character : this.options.character,
	    moveTo : this.options.character.location.point
	};

	this.gameWaiting = true;
	RPG.activateTile(game, function(activateEvents){
	    game.events = activateEvents;
	    if (activateEvents.error) {
		RPG.Error.notify(activateEvents.error);
		this.gameWaiting = false;
		return;
	    } else {
		if (Object.keys(activateEvents.activate).length == 0 && Object.keys(activateEvents.activateComplete).length == 0) {
		    //no event data to send.. ignore
		    RPG.Error.notify('Nothing Happened.');
		    this.gameWaiting = false;
		    return;
		}

		this.getServerEvents(game,'/index.njs?xhr=true&a=Play&m=ActivateTile&characterID='+game.character.database.characterID,function(){
		    this.refreshMap();
		    this.gameWaiting = false;
		}.bind(this));
	    }
	}.bind(this));
    },

    /**
     * Send a request to the server with the results of the client side execution of events
     * The server will respond with an and updated 'game' object and results of the server side 'events'
     */
    getServerEvents : function(game,url,callback) {
	new Request.JSON({
	    url : url,
	    onFailure : function(results) {
		RPG.Error.notify(results);
		if (results.responseText) {
		    var resp = JSON.decode(results.responseText,true);
		    if (resp.game) {
			Object.merge(game,resp.game);
		    }
		}
		callback();
	    },
	    onSuccess : function(results) {
		results.game && Object.merge(game,results.game);
		callback();
	    }
	}).post(JSON.encode(game.events));//send the results of the clientside events to the server for validation
    }
});