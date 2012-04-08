if (!RPG) RPG = {};

RPG.Item = new Class({


    /**
     * Init Character Equipment
     */
    initialize : function(game,cache,path,tips,element) {
	this.game = game;
	this.itemCache = cache;
	this.path = path;
	this.tips = tips;
	this.element = element;
	if (!cache || !path) return;

	this.item = Object.getFromPath(this.itemCache,path)
	if (!this.item) return;
	element.addClass('Pointer');
	element.addEvents({
	    mousedown : function(event){
		if (event && event.rightClick) return;
		event.stop();
		this.from = element.getParent();
		this.resetStyles = {
		    position : null,
		    'z-index' : null,
		    left : null,
		    top : null,
		    width : element.getStyle('height'),
		    height : element.getStyle('height')
		};
		if (!this.drag) {
		    this.drag = new Drag.Move(element,{
			droppables : '.ItemDrop',
			preventDefault : true,
			stopPropagation :true,
			snap : 5,
			onDrop: function(element, droppable, event){
			    if (!droppable || !droppable.getChildren()[0]) {
				element.setStyles(this.resetStyles);
				this.from.adopt(element);
			    } else {

				RPG.TileTypes.item.inventorySwap({
				    game : this.game,
				    clientEvents : {
					toInventory : droppable.get('inventory'),
					toPoint : [Number.from(droppable.get('row')),Number.from(droppable.get('col'))],
					fromInventory : this.from.get('inventory'),
					fromPoint : [Number.from(this.from.get('row')),Number.from(this.from.get('col'))]
				    }
				},function(results) {
				    if (Object.getFromPath(results,'events.inventory')) {
					element.setStyles(this.resetStyles);
					var swap = droppable.getChildren()[0];
					element.setStyle('height',swap.getStyle('height'));
					element.setStyle('width',swap.getStyle('width'));
					swap.setStyle('height',this.resetStyles.height);
					swap.setStyle('width',this.resetStyles.width);
					droppable.empty();
					droppable.adopt(element);
					this.from.adopt(swap);
				    } else {
					if (results && results.error) {
					    RPG.Error.show(results.error);
					}
					element.setStyles(this.resetStyles);
					this.from.adopt(element);
				    }
				}.bind(this));
			    }
			    this.drag.detach();
			    this.tips.attach(element);
			}.bind(this),

			onSnap : function() {
			    this.tips.hide();
			}.bind(this),

			onEnter: function(element, droppable){
			    this.tips.hide();
			}.bind(this),

			onLeave: function(element, droppable){
			    this.tips.hide();
			}.bind(this),

			onComplete : function(element) {

			}.bind(this),

			onCancel : function(element) {
			    element.setStyles(this.resetStyles);
			    this.from.adopt(element);
			    this.drag.detach();
			    this.tips.attach(element);
			}.bind(this)
		    });
		}
		element.setStyles({
		    position : 'absolute',
		    'z-index' : '10000',
		    top : event.page.y + 5,
		    left : event.page.x + 5,
		    width : '64px',
		    height : '64px'
		}).inject(document.body);
		this.drag.attach().start(event);
		this.tips.detach(element);
		this.tips.hide();
	    }.bind(this),

	    mouseup : function() {
		this.tips.attach(element);
	    }.bind(this)
	});
	this.attachToolTip();
    },

    toElement : function() {
	return this.element;
    },

    attachToolTip : function() {
	var item = this.item;
	if (!item) return this.element;

	RPG.tipFactory.attach(this.element,{
	    tips : this.tips,
	    tipTitle : (new HtmlTable({
		zebra : true,
		selectable : false,
		useKeyboard : false,
		properties : {
		    cellpadding : 2,
		    align : 'left',
		    'class' : 'textLarge',
		    styles : {
			'background-color' : 'black',
			color : 'white',
			width : '100%'
		    }
		},
		rows : [
		[
		{
		    properties : {
			styles : Object.merge(RPG.getMapTileStyles({
			    map : {
				cache : this.itemCache,
				tiles : [this.path]
			    },
			    zoom : 48
			}),{
			    'background-size' : '100% 100%',
			    'background-position' : '0% 0%'
			})
		    },
		    content : '&nbsp'
		},
		{
		    properties : {
			'class' : 'vMiddle'
		    },
		    content : this.item.options.property.tileName
		}
		]
		]
	    })).toElement(),
	    tipText : (new HtmlTable({
		zebra : true,
		selectable : false,
		useKeyboard : false,
		properties : {
		    cellpadding : 2,
		    align : 'left',
		    'class' : 'textLarge',
		    styles : {
			'background-color' : 'black',
			color : 'white',
			width : '100%'
		    }
		},
		rows : (function(){
		    var rows = [];
		    Object.each(item.options.item,function(content,key){
			var row = [{
			    content : key.capitalize()
			}];
			var value = '';
			if (typeof content == 'object') {
			    Object.each(content,function(c,k){
				value += k.capitalize() +': '+ c + ', '
			    });
			    row.push({
				content : JSON.stringify(value)
			    });
			} else {
			    row.push({
				content : JSON.stringify(content)
			    });
			}
			rows.push(row);
		    });
		    return rows;
		}())
	    }).toElement())
	});
	item = null;
	return this.element;
    }
});