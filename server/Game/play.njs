/*
 * #Play page
 *
 * initializes the game etc
 */
var RPG = module.exports = {};
Object.merge(RPG,
    require('../Character/Character.njs'),
    require('../Game/game.njs')
    );

var logger = RPG.Log.getLogger('RPG.Play');

RPG.Play =  new (RPG.PlayClass = new Class({
    initialize : function() {
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
		    if (character.error) {
			response.onRequestComplete(response,character);
			return;
		    }
		    //upone successful creation of a chater we will start them playing right away
		    request.url.query.characterID = character.database.characterID;
		    RPG.Game.onRequest(request,response);
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
		    response.onRequestComplete(response,characters);
		}.bind(this));
		break;
	}
    }
}))();