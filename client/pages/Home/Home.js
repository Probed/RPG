/*
 *
 * Receives and displays the Object retrieved from /server/pages/Home/home.js
 *
 */
RPG.pageHome = new Class({
    Implements : [Events,Options],
    options : {

    },
    initialize : function(options) {
	this.setOptions(options);
	this.element = new Element('div',{
	    id : 'pageHome',
	    events : {
		'click:relay(#newCharacter)' : function(event){
		    RPG.App.playNowBtn.clicked(event);
		},
		'click:relay(#inventory)' : function(event){
		    RPG.App.charBtn.clicked(event);
		},
		'click:relay(#loadMaps)' : function(event){
		    RPG.App.mapEditorMenuItem.clicked(event);
		}
	    }
	});
	this.element.store('instance',this);
    },
    toElement : function() {
	return this.element;
    },
    populate : function(page) {
	this.element.empty();
	if (page && page.pageContents) {
	    RPG.App.createElementRecurse(this.element,page.pageContents);
	}
	return this;
    }
});