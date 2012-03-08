/*
 * #Play page
 *
 * initializes the game etc
 */
var RPG = module.exports = {};
Object.merge(RPG,
    require("../pages/pageBase.njs"),
    require('../Character/Character.njs'),
    require('../Game/game.njs')
    );
RPG.Play =  new (RPG.PlayClass = new Class({
    Extends : RPG.PageBaseClass,
    options : {

    },
    initialize : function(options) {
	this.parent(options);
	this.page = {
	    title : 'Adventure Time!',
	    populates : 'pnlMainContent',
	    pageContents : '',
	    requires : {
		css : ['/client/mochaui/themes/charcoal/css/Character/Character.css'],
		js : [
		'/common/Map/Generators/Generators.js',
		'/client/Game/play.js',
		'/common/optionConfig.js',
		'/common/Character/Character.js',

		'/common/Map/Tiles/property.js',//@todo dynamicize this
		'/common/Map/Tiles/traverse.js',//@todo dynamicize this
		'/common/Map/Tiles/teleportTo.js',//@todo dynamicize this

		'/common/Random.js',
		'/common/Map/Generators/Words.js',
		'/client/Character/CreateCharacter.js',
		'/client/Character/ListCharacters.js',
		],
		exports : 'Play',
		populates : 'pnlMainContent'
	    },
	    options : {
		portraits :{
		    Gender : {/*populated below*/}
		}
	    }
	};
	var portraits = require('fs').readdirSync('./client/images/Character/Portrait');
	portraits.each(function(gender){
	    this.page.options.portraits.Gender[gender] = require('fs').readdirSync('./client/images/Character/Portrait/'+gender);
	}.bind(this));
    },

    onRequest : function(request,response) {
	if (!request.user.isLoggedIn) {
	    response.onRequestComplete(response,{
		error : 'Must be <b>logged in</b> to play.<br><br>Signup or Login and try again.'
	    });
	}
	switch (true) {
	    case request.url.query.m == 'CreateCharacter' :
		if (!request.dataReceived) {
		    request.on('end',function(){
			this.onRequest(request,response);
		    }.bind(this));
		    return;
		}
		RPG.Character.create({
		    user : request.user,
		    character : request.data
		}, function(character){
		    response.onRequestComplete(response,character);
		});
		break;

	    case request.url.query.m == 'ListCharacters' :
		RPG.Character.list({
		    user : request.user
		},function(characters){
		    response.onRequestComplete(response,characters);
		});
		break;
	    case request.url.query.m == 'DeleteCharacter' :
		RPG.Character['delete']({
		    user : request.user,
		    characterID : request.url.query.characterID
		}, function(result){
		    response.onRequestComplete(response,result);
		});
		break;

	    case RPG.Game.routeAccepts.contains(request.url.query.m) :
		RPG.Game.onRequest(request,response);
		break;

	    default :
		RPG.Character.list({
		    user : request.user
		},function(characters){
		    var p = Object.clone(this.page);
		    p.options.characters = characters;
		    response.onRequestComplete(response,this._onRequest(request,p));
		}.bind(this));
		break;
	}
    }
}))();