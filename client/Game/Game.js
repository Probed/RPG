define([
    '../mootools/mcl-min',//canvas
    '../Character/Character',
    '../../common/Character/Portraits',
    '../../common/Character/Character',
    './Item',
    './Map',
    '../../common/Game/Generators/Generators',
    '../../common/Game/Generators/Utilities',
    '../../common/Constraints',

    '../../common/Game/Tiles/Tiles',

    '../../common/Game/TileTypes/property',//@todo dynamicize this
    '../../common/Game/TileTypes/traverse',//@todo dynamicize this
    '../../common/Game/TileTypes/teleportTo',//@todo dynamicize this
    '../../common/Game/TileTypes/lockable',//@todo dynamicize this
    '../../common/Game/TileTypes/trap',//@todo dynamicize this\
    '../../common/Game/TileTypes/switch',//@todo dynamicize this
    '../../common/Game/TileTypes/container',//@todo dynamicize this
    '../../common/Game/TileTypes/item',//@todo dynamicize this


    '../Character/CharacterEquipment.js',
    '../../common/Game/Tiles/Utilities.js',
    '../../common/Game/inventory.js',
    '../../common/Random.js'

    ],function(){

	RPG.Game = new (new Class({
	    Implements : [Events,Options],
	    games : {},
	    game : {},

	    initialize : function(){
		this.gameDiv = new Element('div');
	    },

	    load : function(game,callback) {

		if (this.games[game.character.database.characterID]) {
		    this.game = this.games[game.character.database.characterID];
		    $('pnlMainContent').empty().adopt(this.gameDiv);
		    this.gameDiv.empty().adopt(this.games[game.character.database.characterID].Map.toElement());
		    RPG.CharacterEquipment.refresh(this.game);
		    this.game.Map.refreshMap();
		    if (!this.game.Map.keyUpEvents.isActive()) {
			this.game.Map.keyUpEvents.activate();
		    }
		    callback(this.game);
		} else {
		    if (!game.universe) {
			new Request.JSON({
			    url : '/index.njs?xhr=true&a=Play&m=PlayCharacter&characterID='+game.character.database.characterID,
			    onFailure : function(error) {
				RPG.Dialog.error(error);
			    }.bind(this),
			    onSuccess : function(game) {
				$('pnlMainContent').empty().adopt(this.gameDiv);
				this.game = game;
				this.game.Character = new RPG.Character(this.game);
				this.game.Map = new RPG.Map(this.game);
				this.gameDiv.empty().adopt(this.game.Map.toElement());
				this.games[game.character.database.characterID] = game;
				RPG.CharacterEquipment.refresh(this.game);
				this.game.Map.refreshMap();
				if (!this.game.Map.keyUpEvents.isActive()) {
				    this.game.Map.keyUpEvents.activate();
				}
				callback(this.game);
			    }.bind(this)
			}).get();
		    } else {
			$('pnlMainContent').empty().adopt(this.gameDiv);
			this.game = game;
			this.game.Character = new RPG.Character(this.game);
			this.game.Map = new RPG.Map(this.game);
			this.gameDiv.empty().adopt(this.game.Map.toElement());
			this.games[game.character.database.characterID] = game;
			RPG.CharacterEquipment.refresh(this.game);
			this.game.Map.refreshMap();
			if (!this.game.Map.keyUpEvents.isActive()) {
			    this.game.Map.keyUpEvents.activate();
			}
			callback(this.game);
		    }
		}
	    },

	    toElement : function() {
		return this.gameDiv;
	    }
	}))();
    });