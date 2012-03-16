/**
 * Tumbler Lock Puzzle Generator
 *
 */

if (!RPG) var RPG = {};
if (!RPG.Puzzles) RPG.Puzzles = {};
if (!RPG.Puzzles.lockable) RPG.Puzzles.lockable = {};

RPG.Puzzles.lockable.tumbler = new Class({
    Implements : [Options],
    solution : null,//contains the user completed solution. this is returned to the server for verification
    options : {},
    initialize : function(options) {
	this.setOptions(options);

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
	return true;
    }

});