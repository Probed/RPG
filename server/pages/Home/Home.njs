/*
 * #Home page
 */
var RPG = module.exports = {};
Object.merge(RPG,
    require("../pageBase.njs")
    );

RPG.pageHome =  new Class({
    Extends : RPG.PageBaseClass,
    pageContents : {}, /*Object to hold all the contents of this page*/
    options : {

    },
    initialize : function(options) {
	this.parent(options);

	/**
	 * Default object that will be modified by each request.
	 * Take care when modifying the default pageContents as it is served to all users.
	 * Instead, clone the object for the current user and modify the clone.
	 */
	this.pageContents = {
	    'h1#homeHeader' : {},
	    'div#p1' : {
		html : 'This game is very much under construction and only a few things are actually functional.<br>',
		'div#p2' : {
		    html : 'Current workings:',
		    'ul#currentWorkings' : {
			'li#game' : {
			    html : 'Game',
			    'ul#gameList' : {
				'li#newCharacter' : {
				    html : 'Basic Character Creation'
				},
				'li#gamePlay' : {
				    html : 'Explore world keys: Up, Down, Left, Right. Numpad 0: Pickup item'
				},
				'li#inventory' : {
				    html : '\'Character\' button on top bar while in game opens your equipment/inventory items'
				}
			    }
			},
			'li#mapEditor' : {
			    html : 'Map Editor',
			    'ul#mapEditorList' : {
				'li#loadMaps' : {
				    html : 'Can load and view existing game maps.'
				},
				'li#mapEditorKeys' : {
				    html : 'Mouse/Keyboard commands:',
				    'ul#keyList' : {
					'li#shiftClick' : {
					    html : 'Shift-Click: Reorder tile stacks'
					},
					'li#altClick' : {
					    html : 'Alt->Click: Select a tile from the stack (affected by tile-selection problem below)'
					},
					'li#drag' : {
					    html : 'Drag Map: Scroll map contents'
					}
				    }
				},
				'li#generateMaps' : {
				    html : 'Map Generators: Terrain, Dungeon, House, Maze, Example, Test'
				},
				'li#generateItems' : {
				    html : 'Item Generators: Equipment, Consumable  (currently does not put the item on the map and is affected by the tile-selection problem below)'
				},
				'li#generateNpc' : {
				    html : 'NPC Generator: (currently does not put the npc on the map and is affected by the tile-selection problem beow)'
				},
				'li#buildMaps' : {
				    html : 'Building maps from scratch is currently broken. I have not fixed Tile-Selection. So while you can create tiles you cannot \'Select\' a tile to paint to the map.'
				}
			    }
			}

		    }
		}
	    }

	};
    },
    /**
     * Overrides onRequest
     */
    onRequest : function(request,response) {
	/**
	 * Clone the default pageContents for modification
	 */
	var clone = Object.clone(this.pageContents);

	/**
	 * Modify the Clone
	 */

	clone['h1#homeHeader'] = {
	    html : 'Welcome ' + request.user.options.name,
	    'class' : 'textCenter'
	};

	/**
	 * Finally Call the parent classes onRequest
	 * which wraps the contents in a page object
	 */
	response.onRequestComplete(response,this._onRequest(request,{
	    title : 'Probed.RPG - ' + 'Welcome ' + request.user.options.name,
	    populates : 'pnlMainContent',
	    requires : {
		//'css' : ['home.css'],
		'js' : ['/client/pages/Home/Home.js'],
		exports :'pageHome'
	    },
	    pageContents : clone
	})
	);
    }
});