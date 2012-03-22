/*
 * Success.js
 *
 * Success display stuff
 *
 *
 */
RPG.Success = new (new Class({
    /**
     * Init Success
     */
    initialize : function() {

    },
    notify : function(suc) {
	var message = '';
	if (suc.responseText) {
	    var rep = JSON.decode(suc.responseText,true);
	    if (rep && rep.error && rep.error.each) {
		rep.error.each(function(err){
		    message += err +'<br>';
		});
	    } else if (rep && typeOf(rep.error) == 'object') {
		message = JSON.stringify(rep.error);
	    } else if (rep) {
		message = rep.error;
	    } else if (typeOf(suc) == 'string') {
		message = suc;
	    } else {
		message = 'No Message :(';
	    }
	} else if (typeOf(suc) == 'array') {
	    suc.each(function(err){
		message += err +'<br>';
	    });
	}else if (typeOf(suc) == 'object') {
	    message = JSON.stringify(suc);
	} else {
	    message = suc;
	}
	MUI.notification(message);
    },

    show : function(suc) {
	var message = '';
	if (suc && suc.success && suc.success.each) {
	    suc.success.each(function(s){
		message += s +'<br>';
	    });
	} else if (suc && suc.success) {
	    message = suc.success;
	} else if (suc) {
	    message = suc;
	} else {
	    message = 'No Message :(';
	}
	new MUI.Window({
	    id : 'successWindow',
	    title : '<span class="Success">Operation Completed Successfully</span>',
	    type : 'window',
	    loadMethod : 'html',
	    content : message,
	    collapsible : false,
	    storeOnClose : false,
	    resizable : true,
	    maximizable : false,
	    closable : true,
	    addClass : 'SuccessWindow'
	});
	$('successWindow').adopt(RPG.elementFactory.buttons.closeButton({
	    'class' : 'WinFootRight',
	    events : {
		click : function() {
		    $('successWindow').retrieve('instance').close();
		}.bind(this)
	    }
	}));

    }
}))();