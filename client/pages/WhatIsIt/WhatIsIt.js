/*
 *
 * Receives and displays the Object retrieved from /server/pages/WhatIsIt/WhatIsIt.js
 *
 */
RPG.pageWhatIsIt = new Class({
    Implements : [Events,Options],
    options : {

    },
    initialize : function(options) {
	this.setOptions(options);
	this.element = new Element('div',{
	    id : 'pageWhatIsIt'
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