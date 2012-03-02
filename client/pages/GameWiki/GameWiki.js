/*
 *
 * Receives and displays the Object retrieved from /server/pages/GameWiki/GameWiki.js
 *
 */
RPG.pageGameWiki = new Class({
    Implements : [Events,Options],
    options : {

    },
    initialize : function(options) {
	this.setOptions(options);
	this.element = new Element('div',{
	    id : 'pageGameWiki'
	});
	this.element.store('instance',this);
    },
    toElement : function() {
	return this.element;
    },
    populate : function(page) {
	this.element.empty();
	if (page && page.pageContents && page.pageContents.heading) {
	    Object.each(page.pageContents.heading, function(content,key) {
		this.element.adopt(RPG.elementFactory.page.createElement(content,key));
	    },this);
	}
	if (page && page.pageContents && page.pageContents.body) {
	    Object.each(page.pageContents.body, function(content,key) {
		this.element.adopt(RPG.elementFactory.page.createElement(content,key));
	    },this);
	}
	return this;
    }
});