
RPG.Map = new Class({
    Implements : [Events,Options],

    rowOffset : 0,
    colOffset : 0,
    mapZoom : 32,

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
	    events : {
		'mousewheel:relay(td.M_tileHolder)' : function(event) {
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


	var kEvents = {};
	kEvents[RPG.AppUser.options.settings.keyboard.up] = function(event) {
	    this.moveCharacter('n',1);
	    event.preventDefault();
	}.bind(this);
	kEvents[RPG.AppUser.options.settings.keyboard.down] = function(event) {
	    this.moveCharacter('s',1);
	    event.preventDefault();
	}.bind(this);
	kEvents[RPG.AppUser.options.settings.keyboard.left] = function(event) {
	    this.moveCharacter('w',1);
	    event.preventDefault();
	}.bind(this);
	kEvents[RPG.AppUser.options.settings.keyboard.right] = function(event) {
	    this.moveCharacter('e',1);
	    event.preventDefault();
	}.bind(this);

	this.keyboardEvents = new Keyboard({
	    defaultEventType: 'keyup',
	    events: kEvents
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
	return Math.floor(($('pnlMainContent').getSize().y-20) / this.mapZoom);
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

	var map = this.options.universe.maps[this.options.character.location.mapName];

	if (newCols == this.cols && newRows == this.rows) {

	    this.rowOffset = this.options.character.location.point[0] - Math.ceil(this.rows/2);
	    this.colOffset = this.options.character.location.point[1] - Math.ceil(this.cols/2);

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
		}
	    }.bind(this));

	    this.refreshingMap = false;
	    row = map = c = r = newCols = newRows = null;
	    return;
	} else {
	    this.cols = newCols;
	    this.rows = newRows;
	}

	this.rowOffset = this.options.character.location.point[0] - Math.ceil(this.rows/2);
	this.colOffset = this.options.character.location.point[1] - Math.ceil(this.cols/2);

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
		cellspacing : 0
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
	return cell;
    },

    moveCharacter : function(dir,amount) {
	if (this.characterMoving) return;
	var i = 0;
	for(i=0;i<amount;i++) {

	    var newLoc = RPG[dir](this.options.character.location.point,1);
	    var move = {
		universe : this.options.universe,
		character : this.options.character,
		point : newLoc
	    };

	    if (RPG.canMoveToTile(move)) {
		this.characterMoving = true;

		new Request.JSON({
		    url : '/index.njs?xhr=true&a=Play&m=MoveCharacter&characterID='+this.options.character.database.characterID+'&dir='+dir,
		    onFailure : function(error) {
			RPG.Error.notify(error);
			this.characterMoving = false;
		    }.bind(this),
		    onSuccess : function(universe) {
			Object.merge(this.options.universe,universe);
			this.characterMoving = false;
		    }.bind(this)
		}).get();

		$('mR'+(this.options.character.location.point[0] - this.rowOffset)+'mC'+(this.options.character.location.point[1]-this.colOffset)).set('html','&nbsp;');

		this.options.character.location.point = newLoc;
		this.options.Character.changeDirection(dir.charAt(0));
		this.refreshMap();

	    } else {
		RPG.Error.notify('Cannot move to that tile.');
	    }
	}
    }

});