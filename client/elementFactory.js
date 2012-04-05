/*

Each object in here should not be modified by the app.
Clone each object then use it.

 */

RPG.tipFactory = {
    attach : function(element,options) {
	/**
	 * Looks in options for:
	 * {
	 *	tipText : string/element
	 *	tipTitle : string/element
	 *	tips : Tips object to attach the element to
	 * }
	 */
	if (element && options && options.tipTitle && options.tipText && options.tips) {
	    element.store('tip:title',(options?options.tipTitle:null)).store('tip:text',(options?options.tipText:null));
	    options.tips.attach(element);

	}
	return element;
    }
};

RPG.elementFactory = {
    menu : {
	pageLink : function(options) {
	    var link = new Element('a',{
		'class' : (options.icon || 'ICONMissing') + ' pageLink page'+options.hashTag.toMD5(),
		html : options.display || 'HTMLMissing',
		href : options.hashTag || 'HREFMissing'
	    });
	    RPG.tipFactory.attach(link,options);
	    return link;
	}
    },
    headerToolBox : {
	refresh : function(options) {
	    /*
	     * Uses options:
	     * {
	     *    events : {
	     *        click : function
	     *    }
	     * }
	     * Also Accepts options from RPG.tipFactory.attach
	     */
	    var ref = new Element('div',{
		'class' : 'Pointer Refresh NoPadding',
		title : 'Refresh',
		styles : {
		    height : '100%',
		    width : '16px'
		},
		'html' : '&nbsp;',
		events : {
		    click : (options && options.events) ? options.events.click : null
		}
	    });
	    RPG.tipFactory.attach(ref,options);
	    return ref;
	},
	print : function(options) {
	    /*
	     * Uses options:
	     * {
	     *    events : {
	     *        click : function
	     *    }
	     * }
	     * Also Accepts options from RPG.tipFactory.attach
	     */
	    var ref = new Element('div',{
		'class' : 'Pointer Print NoPadding',
		title : 'Print',
		styles : {
		    height : '100%',
		    width : '16px'
		},
		'html' : '&nbsp;',
		events : {
		    click : (options && options.events) ? options.events.click : null
		}
	    });
	    RPG.tipFactory.attach(ref,options);
	    return ref;
	},
	help : function(options) {
	    /*
	     * Uses options:
	     * {
	     *    events : {
	     *        click : function
	     *    }
	     * }
	     * Also Accepts options from RPG.tipFactory.attach
	     */
	    var ref = new Element('div',{
		'class' : 'Pointer Question NoPadding',
		title : 'Help',
		styles : {
		    height : '100%',
		    width : '16px'
		},
		'html' : '&nbsp;',
		events : {
		    click : (options && options.events) ? options.events.click : null
		}
	    });
	    RPG.tipFactory.attach(ref,options);
	    return ref;
	}
    },
    buttons : {
	navButton : function(options) {
	    /*
	     * Uses options:
	     * {
	     *    class : additional classes
	     *    html : string,
	     *    events : {
	     *        click : function
	     *    }
	     * }
	     * Also Accepts options from RPG.tipFactory.attach
	     */
	    var nav = new Element('div',{
		'class' : 'Button NavButton textCenter '+(options['class'] || ''),
		html : options.html,
		events : {
		    click : (options.events && options.events.click) || function(){},
		    mouseenter : function(event) {
			nav.addClass('NavButton-hover');
		    },
		    mouseleave : function(event) {
			nav.removeClass('NavButton-hover');
		    }
		}
	    }).store('tip:title',(options?options.tipTitle:null)).store('tip:text',(options?options.tipText:null));
	    if (options && options.tipTitle && options.tipText && options.tips) {
		options.tips.attach(nav);
	    }
	    return nav;
	},
	newButton : function(options) {
	    /*
	     * Uses options:
	     * {
	     *    class : additional classes
	     *    html : string,
	     *    events : {
	     *        click : function
	     *    }
	     * }
	     * Also Accepts options from RPG.tipFactory.attach
	     */
	    var newb = new Element('div',{
		'class' : 'Button NewButton textCenter '+(options['class'] || ''),
		html : options.html,
		events : {
		    click : (options.events && options.events.click) || function(){},
		    mouseenter : function(event) {
			newb.addClass('NewButton-hover');
		    },
		    mouseleave : function(event) {
			newb.removeClass('NewButton-hover');
		    }
		}
	    }).store('tip:title',(options?options.tipTitle:null)).store('tip:text',(options?options.tipText:null));
	    if (options && options.tipTitle && options.tipText && options.tips) {
		options.tips.attach(newb);
	    }
	    return newb;
	},
	actionButton : function(options) {
	    /*
	     * Uses options:
	     * {
	     *    class : additional classes
	     *    html : string,
	     *    events : {
	     *        click : function
	     *    }
	     * }
	     * Also Accepts options from RPG.tipFactory.attach
	     */
	    var action = new Element('div',{
		'class' : 'Button ActionButton textCenter '+(options['class'] || ''),
		html : options.html,
		events : {
		    click : (options.events && options.events.click) || function(){},
		    mouseenter : function(event) {
			action.addClass('ActionButton-hover');
		    },
		    mouseleave : function(event) {
			action.removeClass('ActionButton-hover');
		    }
		}
	    }).store('tip:title',(options?options.tipTitle:null)).store('tip:text',(options?options.tipText:null));
	    if (options && options.tipTitle && options.tipText && options.tips) {
		options.tips.attach(action);
	    }
	    return action;
	},
	closeButton : function(options) {
	    /*
	     * Uses options:
	     * {
	     *    class : additional classes
	     *    html : string,
	     *    events : {
	     *        click : function
	     *    }
	     * }
	     * Also Accepts options from RPG.tipFactory.attach
	     */
	    var close = new Element('div',{
		'class' : 'Button CloseButton textCenter '+(options['class'] || ''),
		html : options.html || '<span class="Close textMedium">Close</span>',
		events : {
		    click : (options.events && options.events.click) || function(){},
		    mouseenter : function(event) {
			close.addClass('CloseButton-hover');
		    },
		    mouseleave : function(event) {
			close.removeClass('CloseButton-hover');
		    }
		}
	    }).store('tip:title',(options?options.tipTitle:null)).store('tip:text',(options?options.tipText:null));
	    if (options && options.tipTitle && options.tipText && options.tips) {
		options.tips.attach(close);
	    }
	    return close;
	},
	cancelButton : function(options) {
	    /*
	     * Uses options:
	     * {
	     *    class : additional classes
	     *    html : string,
	     *    events : {
	     *        click : function
	     *    }
	     * }
	     * Also Accepts options from RPG.tipFactory.attach
	     */
	    var cancel = new Element('div',{
		'class' : 'Button CancelButton textCenter '+(options['class'] || ''),
		html : options.html || '<span class="Close textMedium">Cancel</span>',
		events : {
		    click : (options.events && options.events.click) || function(){},
		    mouseenter : function(event) {
			cancel.addClass('CancelButton-hover');
		    },
		    mouseleave : function(event) {
			cancel.removeClass('CancelButton-hover');
		    }
		}
	    }).store('tip:title',(options?options.tipTitle:null)).store('tip:text',(options?options.tipText:null));
	    if (options && options.tipTitle && options.tipText && options.tips) {
		options.tips.attach(cancel);
	    }
	    return cancel;
	},
	deleteButton : function(options) {
	    /*
	     * Uses options:
	     * {
	     *    class : additional classes
	     *    html : string,
	     *    events : {
	     *        click : function
	     *    }
	     * }
	     * Also Accepts options from RPG.tipFactory.attach
	     */
	    var deleteBut = new Element('div',{
		'class' : 'Button DeleteButton textCenter '+(options['class'] || ''),
		html : options.html || '<span class="Delete textMedium">Delete</span>',
		events : {
		    click : (options.events && options.events.click) || function(){},
		    mouseenter : function(event) {
			deleteBut.addClass('DeleteButton-hover');
		    },
		    mouseleave : function(event) {
			deleteBut.removeClass('DeleteButton-hover');
		    }
		}
	    }).store('tip:title',(options?options.tipTitle:null)).store('tip:text',(options?options.tipText:null));
	    if (options && options.tipTitle && options.tipText && options.tips) {
		options.tips.attach(deleteBut);
	    }
	    return deleteBut;
	}
    },
    page : {
	/**
	 * Takes an content Object (compatible with new Element('',content)
	 * uses the Key to determine Element type and ID:
	 * Key syntax: <type>#<id>
	 */
	createElement : function(content,key) {
	    if (key.contains('#')) {
		var clone = Object.clone(content);
		var k = Object.keys(clone);
		var len = k.length;
		var x = 0;
		//remove sub elements to get just this elemetns options
		for(x=0;x<len;x++) {
		    if (k[x].contains('#')){
			Object.erase(clone,k[x]);
		    }
		}
		var tag = key.split('#')[0];
		var id = key.split('#')[1];
		var elm = new Element(tag,Object.merge({
		    id : id
		},clone));
		return elm;
	    }
	    return null;
	},
	createElementRecurse : function (parentElm, objTree) {
	    var len = 0;
	    var k = 0;
	    var i = 0;
	    var elm = null;
	    if (typeOf(objTree) == 'object') {
		k = Object.keys(objTree);
		len = k.length;
		for(i=0;i<len;i++){
		    elm = RPG.elementFactory.page.createElement(objTree[k[i]],k[i]);
		    if (elm) {
			RPG.elementFactory.page.createElementRecurse(elm,objTree[k[i]]);
			parentElm.adopt(elm);
		    }
		}
	    }
	}
    },
    character : {
	/*
	 * Uses options:
	 * {
	 *    id : the id
	 *    class : additional classes
	 *    html : string,
	 *    events : {

	 *    }
	 * }
	 * Also Accepts options from RPG.tipFactory.attach
	 */
	characterSlot : function(options) {
	    var className = (/Growth/.test(options.id)?'GrowthSlot':'ItemSlot');
	    var slot = new Element('div',{
		id : options.id,
		'class' : className + ' ' + className+'-empty textCenter '+(options['class'] || ''),
		html : options.html || '&nbsp;',
		events : {
		    mouseenter : function(event) {
			slot.addClass(className+'-hover');
		    },
		    mouseleave : function(event) {
			slot.removeClass(className+'-hover');
		    }
		}
	    });
	    if (options && options.tipTitle && options.tipText && options.tips) {
		slot.tipTitleDiv = new Element('div',{
		    'class' : className + 'TipTitle'
		});
		if (typeOf(options.tipTitle) == 'string') {
		    slot.tipTitleDiv.set('html',options.tipTitle);
		} else if (typeOf(options.tipTitle) == 'element') {
		    slot.tipTitleDiv.adopt(options.tipTitle);
		}
		slot.tipTextDiv = new Element('div',{
		    'class' : className + 'TipText'
		});
		if (typeOf(options.tipText) == 'string') {
		    slot.tipTextDiv.set('html',options.tipText);
		} else if (typeOf(options.tipText) == 'element') {
		    slot.tipTextDiv.adopt(options.tipText);
		}

		slot.store('tip:title',slot.tipTitleDiv);
		slot.store('tip:text',slot.tipTextDiv);
		options.tips.attach(slot);
	    }
	    return slot;
	}
    }
}