/*
 * Error.js
 *
 * Error display stuff
 *
 *
 */
RPG.yesORno = new (RPG.yesORnoClass = new Class({

    /**
     * required options:
     * title : (window title text/element)
     * content : (window contents text/element)
     * yes : callback function upon yes
     * no : callback function upon no
     *
     * optional options:
     * width : window width
     * height : window height
     */
    show : function(options) {
	if ($('questionWindow')) {
	    MUI.closeWindow($('questionWindow'));
	}
	new MUI.Window({
	    id : 'questionWindow',
	    title : options.title,
	    type : 'window',
	    loadMethod : 'html',
	    content : options.content,
	    collapsible : false,
	    storeOnClose : false,
	    resizable : true,
	    maximizable : false,
	    minimizable : false,
	    closable : false,
	    width : options.width || 400,
	    height : options.height || 400,
	    onContentLoaded : function() {
		$('questionWindow').adopt(
		    RPG.elementFactory.buttons.actionButton({
			'class' : 'WinFootRight',
			'html' : '<span class="textLarge Yes">Yes</span>',
			events : {
			    click : function(event) {
				options.yes();
				MUI.closeWindow($('questionWindow'));
			    }.bind(this)
			}
		    }),
		    RPG.elementFactory.buttons.cancelButton({
			'class' : 'textLarge WinFootLeft',
			'html' : '<span class="textLarge No">No</span>',
			events : {
			    click : function(event) {
				options.no();
				MUI.closeWindow($('questionWindow'));
			    }
			}
		    })
		    );
	    }.bind(this)
	});
    }
}))();