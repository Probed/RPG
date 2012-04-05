RPG.Play = new Class({
    Implements : [Events,Options],

    gamesCache : {},

    options : {

    },

    initialize : function(options) {
	this.setOptions(options);

	this.gameDiv = new Element('div',{
	    id : 'GameContainer',
	    styles : {
		'text-align' : 'center'
	    }
	}).store('instance',this);

	this.create = new RPG.CreateCharacter({
	    portraits : this.options.portraits,
	    onCreated : function(character) {
		this.list.addCharacter(character);
	    }.bind(this)
	});
	this.list = new RPG.ListCharacters({
	    characters : this.options.characters,
	    onPlay : function(character) {
		this.playCharacter(character);
	    }.bind(this)
	});

	this.gameDiv.adopt(
	    this.characterTbl = new HtmlTable({
		zebra : false,
		sortable : false,
		useKeyboard : false,
		properties : {
		    'class' : 'CharacterSelect',
		    align : 'center'
		},
		rows : [
		[
		{
		    properties : {
			'class' : 'vTop'
		    },
		    content : this.create.toElement()
		},
		{
		    properties : {
			'class' : 'vTop'
		    },
		    content : this.list.toElement()
		}
		]
		]
	    }));

    },
    toElement : function() {
	return this.gameDiv;
    },
    populate : function(page) {

	return this;
    },

    playCharacter : function(character) {
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=Play&m=PlayCharacter&characterID='+character.database.characterID,
	    onFailure : function(error) {
		RPG.Error.show(error);
	    }.bind(this),
	    onSuccess : function(game) {

		new MUI.Require(Object.merge({
		    onloaded:function(){
			this.gameDiv.empty();
			if (this.gamesCache[game.character.database.characterID]) {
			    this.gameDiv.adopt(this.gamesCache[game.character.database.characterID].toElement());
			} else {
			    this.gameDiv.adopt((this.gamesCache[game.character.database.characterID] = new RPG.Game(game)).toElement());
			    this.gamesCache[game.character.database.characterID].update();
			}
		    }.bind(this)
		},game.require));
	    }.bind(this)
	}).get();
    }
});