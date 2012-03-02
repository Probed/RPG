RPG.Game = new Class({
    Implements : [Events,Options],

    options : {
    /**
     * options received from the erver RPG.Game.loadGame
     */
    },

    initialize : function(options) {
	this.setOptions(options);

	this.options.Character = new RPG.Character(options);

	this.gameDiv = new Element('div',{
	    id : 'Game'
	}).store('instance',this).adopt(
	    (this.map = new RPG.Map(this.options)).toElement()
	    );



    },
    toElement : function() {
	return this.gameDiv;
    }
});