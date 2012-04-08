/*
 * Base Pages Bases Class
 *
 */
var RPG = module.exports = {};

Object.merge(RPG,require("../Log/Log.njs"));

var logger = RPG.Log.getLogger('PageBase');

RPG.PageBaseClass =  new Class({
    Implements : [Events,Options],
    page : {}, /*Page wrapper Object*/
    pagesServed : 0,
    options : {

    },
    initialize : function(options) {
	this.setOptions(options);

	/**
	 * Default object that wraps all pages
	 */
	this.page = {
	    pagesServed : this.pagesServed
	};
	logger.trace('Initialized');
    },
    /**
     *
     * Options :
     *	    pageContents : the object containing the pages contents to be sent to the user
     */
    _onRequest : function(request,options) {
	/**
	 * Clone the default page wrapper
	 */
	var clone = Object.clone(this.page);
	/**
	 * Modify clone fo user specific settings
	 */
	clone.pagesServed = this.pagesServed++;

	/**
	 * Finally Merge the clone with the incomming options
	 * and return the new page object.
	 */
	logger.trace('Serving Page #'+this.pagesServed);
	return Object.merge(clone,options);
    }
});