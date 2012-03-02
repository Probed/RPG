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