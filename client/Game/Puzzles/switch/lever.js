/**
 * Tumbler Lock Puzzle Generator
 *
 */

if (!RPG) var RPG = {};
if (!RPG.Puzzles) RPG.Puzzles = {};
if (!RPG.Puzzles['switch']) RPG.Puzzles['switch'] = {};

RPG.Puzzles['switch'].lever = new Class({
    solution : '',//contains the user completed solution. this is returned to the server for verification
    initialize : function(options) {
	this.options = options;
	this.startState = options.contents.state;
	this.table = new HtmlTable({
	    zebra : true,
	    useKeyboard : false,
	    selectable : false,
	    properties : {
		cellpadding : 2
	    },
	    rows : [
	    [
	    {
		properties : {
		    colspan : 2,
		    'class' : 'textCenter'
		},
		content : new Element('div',{
		    html : '&nbsp;',
		    styles : RPG.getMapTileStyles({
			map :{
			    tiles : options.tiles,
			    cache : options.game.universe.maps[options.game.character.location.mapName].cache
			},
			zoom : 32
		    })
		}).setStyle('display','inline-block')

	    },
	    {
		properties : {
		    rowspan : 3
		},
		content : new HtmlTable({
		    zebra : true,
		    useKeyboard : false,
		    selectable : false,
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
			    'class' : 'textCenter'
			},
			content : 'Pull this lever'
		    }
		    ],
		    [
		    {
			properties : {
			    'class' : 'textCenter'
			},
			content : new HtmlTable({
			    zebra : false,
			    useKeyboard : false,
			    selectable : false,
			    properties : {
				cellpadding : 2,
				align : 'center'
			    },
			    rows : [
			    [
			    {
				properties : {
				    'class' : 'textCenter'
				},
				content : (function(){
				    var sel = new Element('select',{
					events : {
					    change : function() {
						this.solution = sel.value;
					    }.bind(this)
					}
				    });
				    Object.each(options.contents.states, function(stateOptions,state) {
					var opt = null;
					sel.adopt(opt = new Element('option',{
					    html : state
					}));
					if (state == options.contents.state) {
					    opt.set('selected','true');
					}
				    });
				    return sel;
				}.bind(this)())
			    }
			    ]
			    ]
			}).toElement()
		    }
		    ]
		    ]
		}).toElement()
	    }
	    ],
	    [
	    {
		content : 'Current State'
	    },
	    {
		content : this.options.contents.state
	    }
	    ]
	    ]
	});


    },

    /**
     * Return the HTML Element needed to display this puzzle
     */
    toElement : function() {
	return this.table.toElement();
    },

    /**
    * check to see if the puzzle has been solved.
    *
    * this is a required function. should return true/false
    */
    isSolved : function() {
	if (this.startState != this.solution) {
	    return true;
	} else {
	    return false;
	}
    }

});