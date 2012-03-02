/*
 * #Template page
 */
var RPG = module.exports = {};
Object.merge(RPG,
    require("../pageBase.njs")
    );

RPG.Template =  new Class({
    Extends : RPG.PageBaseClass,
    pageContents : {}, /*Object to hold all the contents of this page*/
    options : {

    },
    initialize : function(options) {
	this.parent(options);

	/**
	 * Default object that will be modified by each request.
	 * Take care when modifying the default pageContents as it is served to all users.
	 * Instead, clone the object for the current user and modify the clone.
	 */
	this.pageContents = {};
    },
    /**
     * Overrides onRequest
     */
    onRequest : function(request,response) {
	/**
	 * Clone the default pageContents for modification
	 */
	var clone = Object.clone(this.pageContents);

	/**
	 * Modify the Clone
	 */
	

	/**
	 * Finally Call the parent classes onRequest
	 * which wraps the contents in a page object
	 */
	response.onRequestComplete(response,
	    this._onRequest(request,{
		title : 'Template Page',
		populates : 'pnlMainContent',
		requires : {
		    //'css' : ['template.css'],
		    'js' : ['/client/pages/Template/Template.js'],
		    exports :'Template'
		},
		pageContents : clone
	    }));
    }
});