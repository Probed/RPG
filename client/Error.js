/*
 * Error.js
 *
 * Error display stuff
 *
 *
 */
RPG.Error = new (new Class({
    /**
     * Init Error
     */
    initialize : function() {

    },
    notify : function(error) {
	var message = '';
	if (error.responseText) {
	    var rep = JSON.decode(error.responseText,true);
	    if (rep && rep.error && rep.error.each) {
		rep.error.each(function(err){
		    message += err +'<br>';
		});
	    } else if (rep && typeOf(rep.error) == 'object') {
		message = JSON.stringify(rep.error);
	    } else if (rep) {
		message = rep.error;
	    } else if (typeOf(error) == 'string') {
		message = error;
	    } else {
		message = 'No Message :(';
	    }
	} else if (typeOf(error) == 'array') {
	    error.each(function(err){
		message += err +'<br>';
	    });
	}
	MUI.notification(message);
    },
    show : function(error) {
	var message = '';
	if (error.responseText) {
	    var rep = JSON.decode(error.responseText,true);
	    if (rep && rep.error && rep.error.each) {
		rep.error.each(function(err){
		    message += err +'<br>';
		});
	    } else if (rep && typeOf(rep.error) == 'object') {
		message = JSON.stringify(rep.error);
	    } else if (rep) {
		message = rep.error;
	    } else {
		message = 'No Message :(';
	    }
	} else if (typeOf(error) == 'array') {
	    error.each(function(err){
		message += err +'<br>';
	    });
	} else if (typeOf(error) == 'string') {
	    message = error;
	} else {
	    message += 'No Message :(<br>';
	}
	if ($('errorWindow')) {
	    $('errorWindow').retrieve('instance').close();
	}
	new MUI.Window({
	    id : 'errorWindow',
	    title : '<span class="Error">An error has occured:</span>',
	    type : 'window',
	    loadMethod : 'html',
	    content : message,
	    collapsible : false,
	    storeOnClose : false,
	    resizable : true,
	    maximizable : false,
	    closable : true,
	    addClass : 'ErrorWindow'
	});
	$('errorWindow').adopt(RPG.elementFactory.buttons.closeButton({
	    'class' : 'WinFootRight',
	    events : {
		click : function() {
		    $('errorWindow').retrieve('instance').close();
		}.bind(this)
	    }
	}));


    }
}))();