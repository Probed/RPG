
define(['../../common/Character/Character'],function(){

    RPG.ListCharacters = new (new Class({

	Implements : [Events],

	initialize : function() {
	    this.listTbl = new HtmlTable({
		zebra : true,
		sortable : false,
		useKeyboard : false,
		selectable : true,
		allowMultiSelect : false,
		properties : {
		    'class' : 'tblCharacterList',
		    border : 0,
		    align : 'left'
		},
		rows : [
		[
		{
		    properties : {
			'class' : 'textLarge textCenter',
			colspan : 5
		    },
		    content : 'No Characters Found'
		}
		]
		]
	    });
	},
	toElement : function() {
	    return this.listTbl.toElement();
	},

	addCharacter : function(character) {
	    if (this.noCharacters) this.listTbl.empty();
	    var row = this.listTbl.push([
	    {
		properties : {
		    'class' : 'textCenter'
		},
		content : new Element('div',{
		    'class' : 'PortraitDir',
		    styles : RPG.getCharacterStyles(character)
		})
	    },
	    {
		properties : {
		    'class' : 'textMedium'
		},
		content : '<b class="textLarge">' + character.name + '</b><br>Level: <b class="textLarge">' + character.level + '</b><br>XP: <b>'+character.xp +'</b>'
	    },
	    {
		properties : {
		    'class' : 'textMedium'
		},
		content : 'Race: <b class="textLarge">' + character.Race + '</b><br>Gender: <b class="textLarge">' + character.Gender + '</b><br>Class: <b class="textLarge">'+character.Class +'</b>'
	    },
	    {
		properties : {
		    'class' : 'textMedium textCenter'
		},
		content : 'Difficulty<br><b class="textLarge">' + character.Difficulty + '</b>'
	    },
	    {
		properties : {
		    'class' : 'textRight',
		    colspan : 2
		},
		content : this.play = new Jx.Button({
		    label : 'Play',
		    tooltip: 'Play selected character',
		    toggle : false,
		    onClick : function(event) {
			this.fireEvent('play',[character]);
		    }.bind(this)

		}).toElement()
	    }
	    ]);
	    this.noCharacters = false;
	},
	populate : function(characters) {
	    this.listTbl.empty();
	    if (!characters || characters.error) {
		this.noCharacters = true;
		this.listTbl.push([
		{
		    properties : {
			'class' : 'textLarge textCenter',
			colspan : 5
		    },
		    content : 'No Characters Found'
		}
		]);
	    } else {
		Object.each(characters,function(character){
		    this.addCharacter(character);
		}.bind(this));
	    }
	    return this;
	},

	loadList : function(callback) {
	    new Request.JSON({
		url : '/index.njs?xhr=true&a=Play&m=ListCharacters',
		onFailure : function(error) {
		    this.populate();
		    callback && callback(error);
		}.bind(this),
		onSuccess : function(characters) {
		    this.populate(characters);
		    callback && callback(characters);
		}.bind(this)
	    }).get();
	    return this;
	},

	deleteCharacter : function(character) {
	    new Request.JSON({
		url : '/index.njs?xhr=true&a=Play&m=DeleteCharacter&characterID='+character.database.characterID,
		onFailure : function(error) {
		    RPG.Dialog.error(error);
		}.bind(this),
		onSuccess : function(results) {
		    var sel = this.listTbl.getSelected()[0];
		    this.listTbl.selectNone();
		    sel.destroy();
		}.bind(this)
	    }).get();
	}
    }))();

});