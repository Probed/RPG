RPG.ListCharacters = new Class({
    Implements : [Events,Options],
    options : {

    },
    initialize : function(options) {
	this.setOptions(options);

	this.listDiv = new Element('div',{
	    id : 'ListCharacters'
	}).store('instance',this).adopt(
	    this.listTbl = new HtmlTable({
		zebra : true,
		sortable : false,
		useKeyboard : false,
		selectable : true,
		allowMultiSelect : false,
		onRowFocus : function(event) {
		    if (this.noCharacters) return;
		    this.play.show();
		    this.deleteBut.show();
		}.bind(this),
		onRowUnfocus  : function(event) {
		    if (this.noCharacters) return;
		    this.play.hide();
		    this.deleteBut.hide();
		}.bind(this),
		properties : {
		    'class' : 'tblCharacterList'
		},
		headers : [
		{
		    properties : {
			'class' : 'textLarge textCenter',
			colspan : 5
		    },
		    content : '<span class="textMedium Character">Character</span> Listing'
		}
		],
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
		],
		footers : [
		{
		    properties : {
			'class' : 'textLarge textCenter'
		    },
		    content : '&nbsp;'
		},
		{
		    properties : {
			'class' : 'textTiny'
		    },
		    content : this.deleteBut = RPG.elementFactory.buttons.deleteButton({
			html : '<span class="Delete">Delete</span>',
			events : {
			    click : function(event) {
				this.deleteCharacter(this.listTbl.getSelected()[0].retrieve('character'));
			    }.bind(this)
			}
		    }).hide()
		},
		{
		    properties : {
			'class' : 'textLarge textCenter'
		    },
		    content : '&nbsp;'
		},
		{
		    properties : {
			'class' : 'textRight',
			colspan : 2
		    },
		    content : this.play = RPG.elementFactory.buttons.actionButton({
			html : '<span class="textMedium Character">Play</span>',
			events : {
			    click : function(event) {
				this.fireEvent('play',[this.listTbl.getSelected()[0].retrieve('character')]);
			    }.bind(this)
			}
		    }).hide()
		}
		]

	    })
	    );
	this.populate(this.options.characters);

    },
    toElement : function() {
	return this.listDiv;
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
		'class' : 'textMedium'
	    },
	    content : 'C: ' + Date.parse(character.database.created || Date('now')).format('%Y-%m-%d')  + '<br>U: ' + Date.parse(character.database.updated || Date('now')).format('%Y-%m-%d')
	}
	]);
	row.tr.store('character',character);
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
    },

    loadList : function() {
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=Play&m=ListCharacters',
	    onFailure : function(error) {
		this.populate();
	    }.bind(this),
	    onSuccess : function(characters) {
		this.populate(characters);
	    }.bind(this)
	}).get();
    },

    deleteCharacter : function(character) {
	new Request.JSON({
	    url : '/index.njs?xhr=true&a=Play&m=DeleteCharacter&characterID='+character.database.characterID,
	    onFailure : function(error) {
		RPG.Error.show(error);
	    }.bind(this),
	    onSuccess : function(results) {
		var sel = this.listTbl.getSelected()[0];
		this.listTbl.selectNone();
		sel.destroy();
	    }.bind(this)
	}).get();
    }
});