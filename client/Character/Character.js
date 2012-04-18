RPG.Character = new Class({
    topNav : [],

    game : {},

    initialize : function(game) {
	this.game = game;

	this.characterDiv = new Element('div',{
	    'class' : 'M_tileHolder',
	    styles : RPG.getCharacterStyles(this.game.character)
	});

    },
    toElement : function() {
	return this.characterDiv;
    },

    changeDirection : function(dir) {
	this.game.character.location.dir = dir;
	this.characterDiv.setStyles(RPG.getCharacterStyles(this.game.character));
    }

})