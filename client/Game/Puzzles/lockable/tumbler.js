/**
 * Tumbler Lock Puzzle Generator
 *
 */

if (!RPG) var RPG = {};
if (!RPG.Puzzles) RPG.Puzzles = {};
if (!RPG.Puzzles.lockable) RPG.Puzzles.lockable = {};

RPG.Puzzles.lockable.tumbler = new Class({
    Implements : [Options],
    solution : '',//contains the user completed solution. this is returned to the server for verification
    options : {},
    initialize : function(options) {
	this.setOptions(options);
	var rand = Object.clone(RPG.Random);
	rand.seed = Number.from(options.contents.seed) || Math.floor((Math.random() * (99999999999 - 1) + 1));
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
		    rowspan : 5
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
			content : 'The password is clearly visible on the post-it note next to the lock.'
		    }
		    ],
		    [
		    {
			properties : {
			    'class' : 'textCenter'
			},
			content : 'It reads: <b class="textLarge">'+Math.floor(rand.random(100,999))+'</b>'
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
			    rows : (function(){
				var rows = [];
				var row = [];
				var x = 1;
				for (x=1;x<12;x++) {
				    if (x==10) {
					row.push({
					    content : '&nbsp;'
					});
				    }
				    row.push({
					content : RPG.elementFactory.buttons.actionButton({
					    'class' : 'textCenter',
					    html : '<span class="textLarge">'+(x==10?0:(x==11?'C':x))+'</span>',
					    events : {
						click : function(event) {
						    var x = event.target.retrieve('x') || event.target.getParent().retrieve('x');
						    if (x < 10) {
							this.solution += ''+x;
						    } else if (x==10) {
							this.solution += '0';
						    } else if (x==11) {
							this.solution = '';
						    }
						}.bind(this)
					    }
					}).store('x',x)
				    });
				    if (x % 3 == 0) {
					rows.push(row);
					row = [];
				    }
				}
				rows.push(row);
				return rows;
			    }.bind(this)())
			}).toElement()
		    }
		    ]
		    ]
		}).toElement()
	    }
	    ],
	    [
	    {
		content : 'Status'
	    },
	    {
		content : this.options.contents.locked?'<b>Locked</b>':'<b>Unlocked</b>'
	    }
	    ],
	    [
	    {
		content : 'Difficulty'
	    },
	    {
		content : this.options.contents.Difficulty
	    }
	    ],
	    [
	    {
		content : 'Level'
	    },
	    {
		content : this.options.contents.level
	    }
	    ],
	    [
	    {
		content : 'Type'
	    },
	    {
		content : this.options.contents.type
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
	if (this.solution) {
	    return true;
	} else {
	    return false;
	}
    }

});