var RPG = module.exports = {};


Object.merge(RPG,
    require('../common/pages.js'),
    require('./User/Users.njs')
    );

RPG.App = new (RPG.AppClass = new Class({
    Implements:[Options,Events],//mootools events and options
    server : null, //containes the instance of the http.server object
    handlerCache : [],//holds singleton objects
    options : {
	htmlTemplate : './server/index.html',
	serverPort : process.env.PORT, /*issnode needs 'process.env.PORT' otherwise specify actual port number*/
	hostName : undefined /*the hostname of the server. optional.*/
    },
    initialize : function(options) {
	this.setOptions(options);

	/**
	 * Load in the basic html template
	 */
	this.htmlTemplate = require('fs').readFileSync(this.options.htmlTemplate,'utf8');

	/**
	 * Instantiate the user class to handle user sessions
	 */


	RPG.Log('init','RPG.App Initialized.');
    },
    start : function() {
	RPG.Log('info','Starting Server...');
	var http = require('http');
	this.server = http.createServer(this.onRequest.bind(this));
	this.server.on('error', this.serverError.bind(this));
	this.server.on('clientError', this.serverError.bind(this));
	this.server.on('close', this.serverClose.bind(this));
	this.server.listen(this.options.serverPort,this.options.hostName,this.serverBound.bind(this));
	return this;
    },
    stop : function() {
	RPG.Log('info','Server Stopping...');
	this.server.close();
	return this;
    },
    serverBound : function() {
	RPG.Log('info','Server Bound.');
	return this;
    },
    serverError : function(exception) {
	RPG.Log('error',{
	    message : 'Server Error.',
	    exception : JSON.stringify(exception)
	});
	return this;
    },
    serverClose : function() {
	RPG.Log('info','Server Closed.');
	return this;
    },
    onRequest : function onRequest(request, response) {
	if (request.method.toLowerCase() == 'post') {
	    var reqData = '';
	    request.on('data', function(chunk){
		reqData += chunk.toString();
	    });
	    request.on('end',function(){
		request.data = reqData;
		request.dataReceived = true;
		reqData = null;
	    });
	}
	var url = require('url').parse(request.url, true);
	RPG.Log('request','Processing '+request.url);

	/**
	 * First thing we need to do is determine who is making the request
	 * (create/update user requests are handled at this time also)
	 * we attach the user to the request so the user can follow the request wherever it goes
	 */

	RPG.Users.determineUser(request,response, function(user) {
	    request.user = user;
	    if (url && (url.query && !url.query.xhr) || (!url.query)) {
		//No xhr request means we send them the Html Template for the site.
		//afterwards all requests made to the server will be xhr
		//
		//@Todo Test Only:
		//this.htmlTemplate = require('fs').readFileSync(this.options.htmlTemplate,'utf8');
		//@Todo end Test Only^


		this.onRequestComplete(response,this.htmlTemplate.replace('CLIENT_APP_OPTIONS',JSON.stringify(RPG.Users.getApplicationOptions(request.user))));

	    } else if (url && url.query && url.query.a && url.query.xhr) {

		/**
	     * Attach our response handler to the response object
	     * since the response object is passed around everywhere
	     * it makes it easy for routed objects to complete there requeired tasks as they see fit
	     */
		response.onRequestComplete = this.onRequestComplete.bind(this);
		/**
	     * try to Route this request to a
	     */

		this.routeXHR(url,request,response);


	    } else {
		/**
	     * Nothing avaible to handle the request
	     */
		this.onRequestComplete(response,{
		    error : 'Request ['+url.query.a+'] Not Found'
		});
	    }
	}.bind(this));
    },

    routeXHR : function(url,request,response) {
	/**
	 * Look in the pages(common/pages.js) object for any Actions exactly matching the pages hashTag
	 * When a match is found it will route the request off to that pages handler (if it exists) and return the results
	 *
	 * If no handler is found this function continues and switch statement takes over
	 */
	if (!url.query.a) {
	    url.query.a = 'Home';
	}

	/**
	 * Actions (url.query.a) with a '?' in are treated as:
	 *  Action = before '?'
	 *  Query = after '?' (seperated by ::)
	 *  Merge the new action and query parameters with the existing url.query object
	 */
	if (/\?/.test(url.query.a)){
	    var moreQuery = require('querystring').parse(url.query.a.split('?')[1],'::');
	    url.query = Object.merge(url.query,moreQuery,{
		a:url.query.a.split('?')[0]
	    });
	    url.search = Object.toQueryString(url.query);
	    //overwrite the url with the new url object
	    request.url = url;
	} else {
	    //overwrite the url with the parsed object
	    request.url = url;
	}

	/**
	 * Look through the 'pages' object to find a suitable handler for the request.
	 *
	 */
	var handled = false;
	RPG.pages.each(function(page){
	    if (('#'+url.query.a) == page.hashTag && page.requires && page.requires.js && page.requires.exports) {
		var handler = require(page.requires.js)[page.requires.exports];
		if (typeOf(handler) == 'class') {
		    if (page.requires.singleton && this.handlerCache[page.requires.js]) {
			RPG.Log('cached','Routing to: '+page.requires.js);
			this.handlerCache[page.requires.js].onRequest(request,response);
			handled = true;
			return;
		    } else {
			RPG.Log('new','Routing to: '+page.requires.js);
			(handler = new handler(page.options)).onRequest(request,response);
			if (page.requires.singleton) {
			    this.handlerCache[page.requires.js] = handler;
			}
			handled = true;
			return;
		    }
		} else {
		    RPG.Log('static','Routing to: '+page.requires.js);
		    require(page.requires.js)[page.requires.exports].onRequest(request,response);
		    handled = true;
		    return;
		}
	    }
	}.bind(this));

	/**
	 * Handle more requests
	 */
	switch (true) {
	    case url.query.a == 'reloadMainMenu' :
		RPG.Log('info','Reloaded Main Menu')
		response.onRequestComplete(response,{
		    mainMenu : RPG.mainMenu,
		    pages : RPG.pages
		});
		handled = true;
		break;

	    case RPG.Users.routeAccepts.contains(url.query.a) :
		RPG.Users.onRequest(request,response);
		handled = true;
		break;

	    case url.query.a == 'MapEditor' :
		if (!RPG.MapEditor) {
		    Object.merge(RPG,require('./Map/MapEditor.njs'));
		}
		RPG.MapEditor.onRequest(request,response);
		handled = true;
		break;

	    default:
		break;
	}
	if (!handled) {
	    response.onRequestComplete(response,{
		error : 'No suitable route found for: '+request.url.query.a
	    });
	}
    },

    /**
     * This function is attached to the request object (in this.onRequest)
     * it will be called by all application components upon completion of their task
     */
    onRequestComplete : function(response, output) {
	var headers = {};
	var statusCode = 200;
	var error = false;
	if (!output || (output &&  output.error)) {
	    if (!output) {
		output = {
		    error : 'Empty Response... way to go.'
		};
	    }
	    statusCode = 500;
	    headers['reason-phrase'] = 'Application Error';
	    headers['content-type'] = 'text/json';
	    if (output) {
		RPG.Log('error',JSON.stringify(output));
	    }
	    output = JSON.stringify(output);
	    error = true;
	} else {
	    if (typeOf(output) == 'string') {
		headers['content-type'] = 'text/html';
	    } else {
		headers['content-type'] = 'text/json';
		output = JSON.stringify(output);
	    }
	}
	headers['content-length'] = output.length;

	response.writeHead(statusCode,headers);
	response.write(output);
	response.end();
	//RPG.Log('response','Sent: '+JSON.stringify(headers));

	/**
	 * Throw error to cause node to restart
	 */
	if (error) {
	   //throw output;
	}
    }
}))().start();