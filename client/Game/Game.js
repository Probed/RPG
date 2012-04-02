RPG.Game = new Class({
    Implements : [Events,Options],

    options : {
    /**
     * options received from the erver RPG.Game.loadGame
     */
    },

    initialize : function(options) {
	this.setOptions(options);
	Object.erase(this.options,'require');

	this.options.Character = new RPG.Character(this.options);

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