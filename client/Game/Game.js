RPG.Game = new Class({
    Implements : [Events,Options],

    game : {},

    initialize : function(game) {
	this.game = game;
	Object.erase(this.game,'require');

	this.game.Character = new RPG.Character(this.game);

	this.gameDiv = new Element('div',{
	    id : 'Game'
	}).store('instance',this).adopt(
	    (this.map = new RPG.Map(this.game)).toElement()
	    );
    },
    toElement : function() {
	return this.gameDiv;
    }
});