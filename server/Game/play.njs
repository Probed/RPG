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

var logger = RPG.Log.getLogger('RPG.Play');

RPG.Play =  new (RPG.PlayClass = new Class({
    Extends : RPG.PageBaseClass,
    options : {},
    initialize : function(options) {
	this.parent(options);
	this.page = {
	    title : 'Adventure Time!',
	    populates : 'pnlMainContent',
	    pageContents : '',
	    requires : {
		css : ['/client/mochaui/themes/charcoal/css/Character/Character.css'],
		js : [
		'/common/Character/Character.js',
		'/client/Game/Item.js',
		'/common/Game/Generators/Generators.js',
		'/common/Game/Generators/Utilities.js',
		'/client/Game/play.js',
		'/common/optionConfig.js',

		'/common/Game/Tiles/Tiles.js',

		'/common/Game/TileTypes/property.js',//@todo dynamicize this
		'/common/Game/TileTypes/traverse.js',//@todo dynamicize this
		'/common/Game/TileTypes/teleportTo.js',//@todo dynamicize this
		'/common/Game/TileTypes/lockable.js',//@todo dynamicize this
		'/common/Game/TileTypes/trap.js',//@todo dynamicize this\
		'/common/Game/TileTypes/switch.js',//@todo dynamicize this
		'/common/Game/TileTypes/container.js',//@todo dynamicize this
		'/common/Game/TileTypes/item.js',//@todo dynamicize this

		'/common/Random.js',
		'/common/Game/Generators/Words.js',
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
	var portraits = require('fs').readdirSync('./client/images/Character/portrait');
	portraits.each(function(gender){
	    this.page.options.portraits.Gender[gender] = require('fs').readdirSync('./client/images/Character/portrait/'+gender);
	}.bind(this));

	logger.info('Initialize');
    },

    onRequest : function(request,response) {
	if (!request.user.isLoggedIn) {
	    response.onRequestComplete(response,{
		error : 'Must be <b>logged in</b> to play.<br><br>Signup or Login and try again.'
	    });
	}
	//Check for incoming data and wait for it if necessary
	if (request.method == 'POST') {
	    if (!request.dataReceived) {
		request.on('end',function(){
		    this.onRequest(request,response);
		}.bind(this));
		return;//exit for now and call onRequest again once all the data has been received
	    }
	}

	request.user.logger.trace('Play: characterID: '+request.url.query.characterID + ' Action: ' + request.url.query.m);

	switch (true) {
	    case request.url.query.m == 'CreateCharacter' :
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