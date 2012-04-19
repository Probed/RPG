if (!RPG) RPG = {};

RPG.ItemTips = new Tips([],{
    showDelay: 0,
    offset : {
	y : 35,
	x : -20
    }
});

RPG.Item = new Class({
    /**
     * Init Character Equipment
     */
    initialize : function(game,cache,path,element) {
	this.game = game;
	this.itemCache = cache;
	this.path = path;
	this.element = element;
	if (!cache || !path) return;
	element.setStyle('display','inline-block');
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
				    swap : {
					toMap : droppable.get('inventory'),
					toPoint : [Number.from(droppable.get('row')),Number.from(droppable.get('col'))],
					fromMap : this.from.get('inventory'),
					fromPoint : [Number.from(this.from.get('row')),Number.from(this.from.get('col'))]
				    }
				},function(results) {
				    if (Object.getFromPath(results,'events.inventory')) {
					RPG.CharacterEquipment.refreshInfo(game);
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
					    RPG.Dialog.error(results.error);
					}
					element.setStyles(this.resetStyles);
					this.from.adopt(element);
				    }
				}.bind(this));
			    }
			    this.drag.detach();
			    RPG.ItemTips.attach(element);
			    $$('.accept_'+this.item.options.item.type).removeClass('EquipAccepts');
			}.bind(this),

			onSnap : function() {
			    RPG.ItemTips.hide();
			}.bind(this),

			onEnter: function(element, droppable){
			    RPG.ItemTips.hide();
			}.bind(this),

			onLeave: function(element, droppable){
			    RPG.ItemTips.hide();
			}.bind(this),

			onComplete : function(element) {
			    $$('.accept_'+this.item.options.item.type).removeClass('EquipAccepts');
			}.bind(this),

			onCancel : function(element) {
			    element.setStyles(this.resetStyles);
			    this.from.adopt(element);
			    this.drag.detach();
			    RPG.ItemTips.attach(element);
			    $$('.accept_'+this.item.options.item.type).removeClass('EquipAccepts');
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
		RPG.ItemTips.detach(element);
		RPG.ItemTips.hide();
		if (this.item.options.item.identified) {
		    $$('.accept_'+this.item.options.item.type).addClass('EquipAccepts');
		}
	    }.bind(this),

	    mouseup : function() {
		RPG.ItemTips.attach(element);
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

	this.element.store('tip:title',(new HtmlTable({
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
	})).toElement()
	    );
	this.element.store('tip:text',RPG.Constraints.getDisplayTable(this.item.options.item));
	RPG.ItemTips.attach(this.element);
	item = null;
	return this.element;
    }
});