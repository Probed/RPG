/*
---

script: FancySortable.js

version: 0.1

name: FancySortable

description: Class for creating a fancy drag and drop sorting interface for lists of items.

license: MIT-style license

authors:
- Graham McNicoll (http://www.education.com/)

requires:
- core/1.3.0:Fx.Morph
- core/1.3.0:Fx.Tween
- more/1.3.0:Drag.Move
- more/1.3.0:Element.Delegation

provides: [FancySortable]

...
*/

var FancySortable = new Class({
	
	options: {
		/* Events:
		* onBeforeStart: function(Event, item){}, - On mouse down on an item.
		* onStart: function(Drag, item, clone){}, - Fired when the user clicks on an item or handle, just after Drag.start().
		* onMoved: function(item, i, ind){}, - Fired when the list has been re-ordered by the user. 'i' is the new index (from 0 to length+1) and 'ind' is the old position.
		* onHoverOver: function(dragging, target, i, ind){}, - When an item ('dragging': index 'ind') is dragged over another list item (index i).
		* onHoverOut: function(dragging, target, i, ind){}, - When an item ('dragging': index 'ind') leaves the area of a list item (index i).
		* onSort: function(){}, // Fired when the list is sorted and list items and their indexes are recalculated.

		The following events are roughly analogous to events passed from Drag.Move, and allow one to use other 'droppable' elements besides re-ordering.

		* onDrop: function(dragging, item){}, - The item was dropped on a 'droppable' element, but it wasn't a FancySortable droppable.
		* onMissed: function(dragging, item){}, - The user dropped the item and didn't hit any droppables (dragged item returns to original position).
		* onCancel: function(dragging, item){}, - The drop even was canceled (it wasn't dragged far enough).
		* onEnter: function(dragging, target){}, - The user dragged an item over a droppable.
		* onLeave: function(dragging, target){}, - The user left a droppable element.
		*/
		handleSelector: '', // blank or null will make the whole item draggable
		hoverDuration: 300, // duration for the hover effects
		moveDuration: 700, // duration for the move effects
		betweenEl: null, // element type to make the 'between' elements. If null it will chose the same as the list item.
		droppableClass: 'droppable', 
		hoverClass: 'drag-over',
		betweenClass: 'between-item',
		betweenOpenClass: 'open',
		sortOverlayClass: 'sortoverlay',
		dragOpacity: 0.6, // the opacity of the dragged item
		origOpacity: 0.5, // the opacity for the original item which hasnt moved yet.
		expandHeight: null // height, in px, to make the hover over size between the items.
	},
	
	Implements: [Options, Events],
	
	initialize: function(parentEl, sortableItemSelector, options) {
		this.setOptions(options);
		this.parentEl = document.id(parentEl);
		if(!sortableItemSelector || !this.parentEl) { return; }
		
		
		this.itemSelector = sortableItemSelector;
		this.items = this.parentEl.getElements(this.itemSelector);
		if(!this.items || !this.items.length) { return; }
		
		this.itemSize = [];
		this.sortOverlays = [];
		this.sortHeights = [];
		this.betweens = [];
		
		this.addBetweens();
	
		this.initItems();

		this.addSortableOverlays();
		
		this.itemCoords = [];
		
		this.addSortableItems();
		
		//add event listeners:
		this.addEvent('refresh', this.reset.bind(this));
		
		this.postInit();
	},
	
	initItems: function(){
		this.items.each(function(el, ind){
			this.itemSize[ind] = el.setStyle('overflow','hidden').store('index', ind).getSize();
		}, this);
	},
	
	postInit: function() {
		this.fireEvent('init');
	},
	
	addBetweens: function() {
		if(!this.options.betweenEl) {
			this.options.betweenEl = this.items[0].get('tag');
		}
		if(!this.options.expandHeight) {
			this.options.expandHeight = Math.round(this.items[0].getSize().y / 2);
		}
		var between = new Element(this.options.betweenEl, {'class': this.options.betweenClass, 'styles':{'height':0} });
		// add one for before the list:
		between.clone().inject(this.items[0], 'before');
		// then add one after each:
		this.items.each(function(el, ind){
			between.clone().inject(el, 'after');
		}, this);
		// clean up
		between.destroy();
		// save the betweens for later, and init the effects: (tween is used for hover effects, morph for the moving)
		this.betweens = this.parentEl.getElements('.'+this.options.betweenClass).set('tween', {'link': 'cancel', 'duration': this.options.hoverDuration}).set('morph', {'link':'cancel', 'duration': this.options.moveDuration });
	},
	
	addSortableOverlays: function() {
		
		if(!this.sortOverlayWrap) {
			this.parentEl.setStyle('position', 'relative');
			var offset = this.items[0].getPosition(this.parentEl);
			this.sortOverlayWrap = new Element('div', {'styles':{'position':'absolute', 'top':offset.y, 'left':offset.x, 'display':'none'} }).inject(this.parentEl);
		}
		// insert top: 
		this.sortHeights[0] = this.itemSize[0].y/2;
		this.sortOverlays[0] = new Element('div', {'class':this.options.sortOverlayClass+' '+this.options.droppableClass, 'styles': {'height': this.sortHeights[0], 'width':this.itemSize[0].x} }).set('tween', {'link': 'cancel','duration': this.options.hoverDuration}).store('index', 0);
		this.sortOverlayWrap.adopt(this.sortOverlays[0]);
		// insert each:
		this.items.each(function(el, ind){
			var sortindex = ind+1;
			this.sortHeights[sortindex] = (this.itemSize[ind].y + ((this.items[ind+1])?this.itemSize[ind+1].y:0)) / 2;
			this.sortOverlays[sortindex] = new Element('div', {'class':this.options.sortOverlayClass+' '+this.options.droppableClass, 'styles': {'height': this.sortHeights[sortindex], 'width':this.itemSize[ind].x} })
				.set('tween', {'link': 'cancel', 'duration': this.options.hoverDuration})
				.store('index', sortindex);
			this.sortOverlayWrap.adopt(this.sortOverlays[sortindex]);
		}, this);
	},
	
	addSortableItems: function() {
		//deligate:
		var handleSelect = (this.options.handleSelector ? this.options.handleSelector:this.itemSelector);
		
		var lastHandle = null;
		
		this.parentEl.addEvents({'mousedown': function(e){
				if(e && e.rightClick) { return; }
					var handle = $(e.target);
					if(handle.hasClass(handleSelect.substr(1)) || handle.getParent(handleSelect)) {
						lastHandle = handle;
						var item = handle.getParent(this.itemSelector)||handle;
						this.fireEvent('mousedown', [item, handle]);
						this.doDrag(item, e);
					}
				}.bind(this)
		});
		
	},
	
	doDrag: function(item, e) {
		
		this.fireEvent('beforeStart', [e, item]);
		
		if(!this.windowScroller) {
			this.windowScroller = new Scroller(document.body);
		}
		
		e.stop();
		this.windowScroller.start();
		
		//make the overlays avaliable:
		this.sortOverlayWrap.setStyle('display', '');
		var itemCoords = item.getCoordinates();
		
		// grab the current items index:
		var ind = item.retrieve('index');
		
		item.setStyle('opacity', this.options.origOpacity).set('morph', {'link':'cancel', 'duration': this.options.moveDuration });
		
		var clone = item.clone()
			.setStyles(itemCoords)
			.setStyles({'opacity': this.options.dragOpacity, 'position':'absolute', 'z-index':9000})
			.set('morph', {'link': 'cancel', 'duration': this.options.moveDuration})
			.addClass('dragging')
			.inject(document.body);
		
		var drag = new Drag.Move(clone, {
			droppables: '.'+this.options.droppableClass,
			onDrop: function(dragging, target) {
				this.dropped(dragging, target);
				
				// remove overlays:
				this.sortOverlayWrap.setStyle('display', 'none');
				
				if(target) {
					if(target.hasClass(this.options.sortOverlayClass)) {
						this.reSortDropped(dragging, target, item, ind, itemCoords);
					} else {
						// dropped, but not on one of ours... 
						this.droppedUnknown(dragging, target, item, ind);
					}
				} else {
					// missed: no target
					this.cancelDrag(item, dragging, itemCoords);
					this.fireEvent('missed', [dragging, item]);
				}
			}.bind(this),
			onEnter: function(dragging, target) {
				this.fireEvent('enter', [dragging, target]);
				target.addClass(this.options.hoverClass);
				if(target.hasClass(this.options.sortOverlayClass)) {
					this.hoverOver(dragging, target, ind);
				}
			}.bind(this),
			onLeave: function(dragging, target) { 
				this.fireEvent('leave', [dragging, target]);
				target.removeClass(this.options.hoverClass);
				if(target.hasClass(this.options.sortOverlayClass)) {
					this.hoverOut(dragging, target, ind);
				}
			}.bind(this),
			onCancel: function(dragging) { 
				this.dropped(dragging);
				this.fireEvent('cancel', [dragging, item]);
				this.sortOverlayWrap.setStyle('display', 'none');
				clone.destroy();
				item.setStyle('opacity', 1);
			}.bind(this)
		});
		drag.start(e);
		this.fireEvent('start', [drag, item, clone]);
		
	},
	
	dropped: function(dragging, target) {
		this.windowScroller.stop();
		this.fireEvent('dropped', [dragging, target]);
	},
	
	hoverOver: function(dragging, target, ind ) {
		var i = target.retrieve('index');
		if(ind != i-1 && i != ind) {
			this.betweens[i].tween('height', this.options.expandHeight).addClass(this.options.betweenOpenClass);
			target.tween('height', this.sortHeights[i]+this.options.expandHeight);
			this.fireEvent('hoverOver', [dragging, target, i, ind]);
		}
	},
	
	hoverOut: function(dragging, target, ind){
		var i = target.retrieve('index');
		this.betweens[i].tween('height', 0).removeClass(this.options.betweenOpenClass);
		target.tween('height', this.sortHeights[i]);
		this.fireEvent('hoverOut', [dragging, target, i, ind]);
	},
	
	reSortDropped: function(dragging, target, item, ind, itemCoords) {
		
		// get the new position index:				
		var i = target.retrieve('index');
		// i is the new index (of the mask, wich is N+1), ind is the old
		
		if(ind != i-1 && i != ind) {
			// its a different position:
			item.setStyles({'opacity': 1});
			
			var destinationBetween = this.betweens[i],
				newcoords = destinationBetween.getCoordinates(),		
				newheight = dragging.getSize().y,
				newind = i;

			if(i > ind) {
				// moving down (becauce we are removeing it out of the list, we need to subtract it off to get the right position when the effects run.
				newcoords.top = newcoords.top - newheight;
				newind = i-1;
			}
			// slide out the item (in its original position)
			item.get('morph').start({'height':0, 'opacity': 0}).chain(function(){
				// when done, make visible again and then move
				var betweenpos = 'after';
				if(this.items[i]) {
					item.dispose().setStyles({'margin':0, 'opacity': 1, 'visibility':'visible', 'height': ''}).inject(this.items[i], 'before');
				} else {
					item.dispose().setStyles({'margin':0, 'opacity': 1, 'visibility':'visible', 'height': ''}).inject(this.items[i-1], 'after');
					betweenpos = 'before';
				}
				
				// move the between:
				this.betweens[ind].dispose().inject(item, betweenpos);
				
				// fire the event to inform the users:
				this.fireEvent('moved', [item, newind, i, ind]);
				
				// clean up indexes and what not for next sort:
				this.reset();
				
				this.postSort(item, newind, ind, i);
				
			}.bind(this));

			
			// make the gap the right hight for the new item we are inserting, then move it in
			destinationBetween.get('morph').start({'height': newheight}).chain(function(){
				// close this between, as the item will takes its place
				destinationBetween.setStyle('height', 0).removeClass(this.options.betweenOpenClass);
				
			}.bind(this));
			
					
			// move the dragged element so it looks like its moving into the right position:
			this.moveFadeAndDestroy(dragging, {'top': newcoords.top, 'left': newcoords.left});
			
					
		} else {
			// same position, so just put it back:
			this.cancelDrag(item, dragging, itemCoords);
		}
	
	},
	
	postSort: function(item, replacesInd, ind, i) {
		this.fireEvent('sort', [this.items, item, replacesInd, ind, i]);
	},
	
	droppedUnknown: function(dragging, target) {
		// fire event here and let the client deal with it.
		this.fireEvent('drop', [dragging, target]);
	},
	
	cancelDrag: function(item, dragging, itemCoords) {
		item.setStyle('opacity', 1);
		this.moveFadeAndDestroy(dragging, itemCoords);
	},
	
	moveFadeAndDestroy: function(dragging, coords) {
		dragging.get('morph').start(coords).chain(function(){
			this.start({'opacity':0}).chain(function(){
				this.element.destroy();
			});
		});
	},
	
	reset: function() {
		if(this.sortOverlayWrap) {
			this.sortOverlayWrap.empty();
		}
		
		this.sortHeights = [];
		this.sortOverlays = [];
		
		this.items = this.parentEl.getElements(this.itemSelector);
		
		// update the item's index:
		this.initItems();
		
		this.parentEl.getElements('.'+this.options.betweenClass).destroy();
		this.addBetweens();
		
		this.addSortableOverlays();
	}	
});