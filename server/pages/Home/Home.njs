/*
 * #Home page
 */
var RPG = module.exports = {};
Object.merge(RPG,
    require("../pageBase.njs")
    );

RPG.pageHome =  new Class({
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
	this.pageContents = {
	    'h1#homeHeader' : {
		html : 'Home Page!'
	    },
	    'div#p1' : {
		html : 'Home Page Body paragraph1',
		'div#p2' : {
		    html : 'Home Page Body paragraph2'
		}
	    }

	};
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
	if (!request.user.isLoggedIn) {
	    clone['h2#homeHeaderUser'] = {
		html : 'Welcome Guest'
	    };
	} else {
	    clone['h2#homeHeaderUser'] = {
		html : 'Welcome ' + request.user.options.name
	    };
	}


	/**
	 * Finally Call the parent classes onRequest
	 * which wraps the contents in a page object
	 */
	response.onRequestComplete(response,this._onRequest(request,{
	    title : 'Home Page',
	    populates : 'pnlMainContent',
	    requires : {
		//'css' : ['home.css'],
		'js' : ['/client/pages/Home/home.js'],
		exports :'pageHome'
	    },
	    pageContents : clone
	})
	);
    }
});