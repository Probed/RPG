if (!RPG) var RPG = {};

if (typeof exports != 'undefined') {
    Object.merge(RPG,require('./Random.js'));
    module.exports = RPG;
}

/**
 * Accepts a string or array path.
 * obj is optional if you want to append to existing object
 * returns new nested object from the path
 * eg : ['p1','p2','p3'] or 'p1.p2.p3'  Resulting in->  p1:{p2:{p3:{}}}
 * return {
 *  root : p1
 *  child : p3
 * }
 */
Object.extend({
    pathToObject : function(obj,path) {
	if (typeOf(path) == 'string') path = path.split('.');
	var child = obj || {};
	var root = child;
	path.each(function(p){
	    if (!child[p]) child[p] = {};
	    child = child[p];
	});
	return {
	    root : root,
	    child : child
	};
    }
});


RPG.optionCreator = {

    getOptionTabs : function(content,key,optPath,loadOptions,id) {
	var tabMenu = null;
	var tabBody = new Element('div');
	var tabs = new Element('div',{
	    id : id+'_mapTileConfigTabs'
	}).adopt(
	    new Element('div',{
		'class' : 'toolBarTabs'
	    }).adopt(
		tabMenu = new Element('ul',{
		    'class' : 'tab-menu NoWrap',
		    id : 'mapTileConfigTabs'
		}),
		new Element('div',{
		    'class' : 'clear'
		})
		)
	    );
	var rows = {};
	Object.each(content,function(opt,key) {
	    rows[key] = [];
	    rows[key].push([{
		content : RPG.optionCreator.getOptionTable(opt,key,[],loadOptions,id)
	    }]);
	}.bind(this));

	tabMenu.adopt(
	    new Element('li',{
		'class' : 'selected optionConfigTab'
	    }).adopt(
		new Element('a',{
		    html:'All',
		    events : {
			click : function(event) {
			    tabMenu.getElements('li').addClass('selected');
			    $$('.optionConfigBody').show();
			}
		    }
		})
		));
	Object.each(rows, function(r,k){
	    tabMenu.adopt(
		new Element('li',{
		    id : 'optionConfigTab'+k,
		    'class' : 'selected optionConfigTab'
		}).adopt(
		    new Element('a',{
			html:k.capitalize().hyphenate().split('-').join(' ').capitalize(),
			events : {
			    click : function(event) {
				$$('.optionConfigTab').removeClass('selected');
				$$('.optionConfigBody').hide();
				$('optionConfigTab'+k).addClass('selected');
				$('optionConfigBody'+k).show();
			    }.bind(this)
			}
		    })
		    ));
	    tabBody.adopt(new HtmlTable({
		zebra : false,
		selectable : false,
		useKeyboard : false,
		properties : {
		    id : 'optionConfigBody'+k,
		    'class' : 'optionConfigBody',
		    cellpadding : 0
		},
		rows : r
	    }).toElement());
	});
	return new HtmlTable({
	    zebra : false,
	    selectable : false,
	    useKeyboard : false,
	    rows : [[tabs],[tabBody]]
	});
    },
    /**
     *  content : the object/other from the Object.each(content) recurses the content tree eg {terrain:{grass:{options:{}}}
     *	key : appended to create the optPath
     *	optPath : array or null. gets filled/emptied as creator is recused (looks like eg: ['terrain','grass'] etc
     *	load : object to load values from,
     *	id : added to the className to uniquely identify this whole set of options
     *
     */
    getOptionTable : function(content,key,optPath,loadOptions,id) {
	if (!optPath || (optPath && typeOf(optPath) != 'array')) {
	    optPath = [];
	}
	key && optPath.push(key);

	/**
	 * Reached the depth of the config.
	 * use the content of the config to
	 */
	if (typeOf(content) != 'object') {
	    var elm = null;
	    var value = null;
	    var className = 'mapEditorConfigInput configFor_'+id
	    if (loadOptions) {
		value = Object.getFromPath(loadOptions,optPath);
	    }

	    var con0 = (typeOf(content) == 'array'?content[0]:content);
	    var con1 = (typeOf(content) == 'array' && content[1]) || null;
	    var con2 = (typeOf(content) == 'array' && content[2]) || null;
	    var con3 = (typeOf(content) == 'array' && content[3]) || null;

	    var type0 = (typeOf(content) == 'array' && typeOf(con0)) || null;
	    var type1 = (typeOf(content) == 'array' && typeOf(con1)) || null;
	    var type2 = (typeOf(content) == 'array' && typeOf(con2)) || null;

	    switch (true) {

		/**
		 * Array: [min,max,default]
		 */
		case (Number.from(con0)!=null && Number.from(con1)!=null && content.length <= 3) :
		    con2 = con2 || 0;
		    elm = new Element('div').adopt(
			new Element('input',{
			    type : 'text',
			    id : optPath.join('__'),
			    value : (value?value:''+con2),
			    size : (value?value:''+con2).length > 3?(value?value:''+con2).length:3,
			    title : '(Min:'+con0+' Max:'+con1+')',
			    'class' : className + ' textRight'
			}),
			new Element('span',{
			    html : '&nbsp;&nbsp;'
			}),
			RPG.elementFactory.buttons.actionButton({
			    'class' : 'randomFor_'+id,
			    html : 'Random',
			    events : {
				click : function(event) {
				    this.getParent().getElements('input')[0].value = RPG.Random.random(this.retrieve('min') || 0,this.retrieve('max'));
				}
			    }
			}).store('min',con0).store('max',con1)
			);
		    break;

		/**
		 * Array: [regex,min,max,default]
		 */
		case (type0 == 'string' && Number.from(con1)!=null && Number.from(con2) !=null  && content.length <= 4) :
		    elm = new Element('div').adopt(
			new Element('input',{
			    type : 'text',
			    id : optPath.join('__'),
			    value : (value?value:''+(con3 || '')),
			    size : 10,
			    title : '(Min:'+con1+' Max:'+con2+')',
			    'class' : className
			}),
			new Element('span',{
			    html : '&nbsp;&nbsp;'
			}),
			RPG.elementFactory.buttons.actionButton({
			    'class' : 'randomFor_'+id,
			    html : 'Random',
			    events : {
				click : function(event) {
				    if (typeof exports != 'undefined') {
					this.getParent().getElements('input')[0].value = require('./Map/Generators/Words.js').Generator.Name.generate({
					    length :  RPG.Random.random(this.retrieve('min'),this.retrieve('max'))
					});
				    } else {
					this.getParent().getElements('input')[0].value = RPG.Generator.Name.generate({
					    length :  RPG.Random.random(this.retrieve('min'),this.retrieve('max'))
					});
				    }
				}
			    }
			}).store('min',con1).store('max',con2)
			);
		    break;


		/**
		 * Array: [string[..]]
		 */
		case (type0 == 'string') :
		    var select = new Element('select',{
			id : optPath.join('__'),
			'class' : className
		    });
		    content.each(function(opt){
			select.adopt(new Element('option',{
			    html : ''+opt,
			    selected : (value==opt?true:false)
			}));
		    });
		    elm = new Element('div').adopt(
			select,
			new Element('span',{
			    html : '&nbsp;&nbsp;'
			}),
			RPG.elementFactory.buttons.actionButton({
			    'class' : 'randomFor_'+id,
			    html : 'Random',
			    events : {
				click : function(event) {
				    this.getParent().getElements('select')[0].value = Array.getSRandom(this.retrieve('opts'));
				}
			    }
			}).store('opts',Array.clone(content))
			);
		    break;


		/**
		 * Key like /^on[A-Z]/
		 * matches events
		 */
		case (/^on[A-Z]/.test(key)):
		    elm = new Element('textarea',{
			cols : 30,
			rows : 3,
			id : optPath.join('__'),
			html : (value?value:content),
			'class' : className
		    });
		    break;

		/**
		 * Boolean Values
		 */
		case (typeOf(content[0])) == 'boolean' || content === 'true' || content === 'false' :
		    elm = new Element('input',{
			type : 'checkbox',
			id : optPath.join('__'),
			checked : (value?value:content),
			'class' : className
		    });
		    break;

		/**
		 * text default
		 */
		default:
		    elm = new Element('input',{
			type : 'text',
			id : optPath.join('__'),
			value : (value?value:content),
			size : (typeOf(content) == 'number'?3:10),
			'class' : className
		    });
		    break;
	    }
	    key && optPath.pop();
	    value = null;
	    className = null;
	    return elm; //Return the newly created element to be inserted into the table

	}
	var tbl = new HtmlTable({
	    zebra : optPath.length%2 == 1,
	    selectable : false,
	    useKeyboard : false,
	    properties : {
		cellpadding : 2
	    }
	});

	var rows = [];
	Object.each(content,function(opt,k){
	    rows.push([
	    {
		properties : {
		    'class' : 'vTop textRight NoWrap'
		},
		content : k.capitalize().hyphenate().split('-').join(' ').capitalize() +':'
	    },
	    {
		properties : {
		    'class' : 'NoWrap'
		},
		content : RPG.optionCreator.getOptionTable(opt,k,optPath,loadOptions,id) //recursively load options
	    }
	    ]
	    );
	});
	tbl.pushMany(rows);
	optPath.pop();//pop off the last path name from the optionpath
	return tbl.toElement(); //return the table of options
    },

    /**
     * pID refers to the parent element ID that contains all config elements. can be null
     * id : the id as used in the getOptionTable call
     *
     * returns populated options object
     */
    getOptionsFromTable : function(pID,id) {
	var options = {};
	$$((pID?'#'+pID:'')+' .configFor_'+id).each(function(elm){
	    var opt = options;
	    var p = elm.id.split('__');
	    p.each(function(p) {
		if (!opt[p]) {
		    opt[p] = {};
		}
		opt = opt[p];
	    });
	    var parentObj = Object.getFromPath(options,p.slice(0,p.length-1));
	    var key = p.slice(-1)[0];
	    switch (true) {
		case ['input'].contains(elm.nodeName.toLowerCase()) && elm.type.toLowerCase() == 'checkbox' :
		    parentObj[key] = elm.checked;
		    break
		case ['input','select','textarea'].contains(elm.nodeName.toLowerCase()):
		    parentObj[key] = elm.value;
		    break;

		default:
		    break;
	    }
	    key = null;
	    parentObj = null;
	    p = null;
	    opt = null;
	});
	return options;
    },

    /**
     * random
     *
     * uses the constraints to generate random options
     */
    random : function(constraint_options,rand,options,path,key) {
	if (!options) options = {};
	if (!path) path = [];
	rand = rand || RPG.Random;

	if (typeOf(constraint_options) != 'object') {
	    var content = constraint_options;

	    var con0 = (typeOf(content) == 'array'?content[0]:content);
	    var con1 = (typeOf(content) == 'array' && content[1]) || null;
	    var con2 = (typeOf(content) == 'array' && content[2]) || null;
	    var con3 = (typeOf(content) == 'array' && content[3]) || null;

	    var type0 = (typeOf(content) == 'array' && typeOf(con0)) || null;
	    var optName = path.pop();
	    var opt = Object.pathToObject(options,path);
	    path.push(key);

	    switch (true) {
		/**
		 * Array: [min,max,default]
		 */
		case (Number.from(con0)!=null && Number.from(con1)!=null && content.length <= 3) :
		    opt.child[optName] = rand.random(Number.from(con0),Number.from(con1));
		    break;

		/**
		 * Array: [regex,min,max,default]
		 */
		case (type0 == 'string' && Number.from(con1)!=null && Number.from(con2) !=null  && content.length <= 4) :
		    if (typeof exports != 'undefined') {
			opt.child[optName] = require('./Map/Generators/Words.js').Generator.Name.random(rand);
		    } else {
			opt.child[optName] = RPG.Generator.Name.random(rand);
		    }
		    break;


		/**
		 * Array: [string[..]]
		 */
		case (type0 == 'string') :
		    opt.child[optName] = Array.getSRandom(content,rand);
		    break;


		/**
		 * Key like /^on[A-Z]/
		 * matches events
		 */
		case (/^on[A-Z]/.test(key)):

		    break;

		/**
		 * Boolean Value
		 */
		case (typeOf(content[0])) == 'boolean' || content === 'true' || content === 'false' :
		    opt.child[optName] = rand.random() > 0.5?true:false;
		    break;

		/**
		 * default
		 */
		default:

		    break;
	    }


	} else {
	    Object.each(constraint_options,function(content,key) {
		path.push(key);
		RPG.optionCreator.random(content,rand,options,path,key);
		path.pop();
	    });
	}
	return options;
    }
};

RPG.optionValidator = {
    /**
     * Merge constraint options from the main object (eg: RPG.terrain, RPG.world, RPG.npc etc)
     * Path : eg ['terrain','dirt']
     * Constraints : main object (eg: RPG.terrain, RPG.world, RPG.npc etc)
     *
     * terrain : {
     *	    options : {
     *		name : [constraint1],	    <--- overridden by dirt's options.name
     *		id : [constraint1]	    <---
     *	    },
     *	    dirt : {
     *		options : {
     *		    name: [constraint2]	    <--- overrides parent options.name
     *		}
     *	    }
     *
     Returns: a recursivly merged object who contains all parent options while allowing child options to override parent options
     *
     * options : {
     *	name : [constraint2],
     *	id : [constraint1]
     * }
     */
    getConstraintOptions : function(path, constraints) {
	var constraing_options = {};
	var cPath = [];
	path.each(function(p){
	    cPath.push(p);
	    var opts = Object.getFromPath(constraints,cPath);
	    if (opts && opts.options) {
		Object.merge(constraing_options,opts.options);
	    }
	    opts = null;
	});
	cPath = null;
	return constraing_options;
    },

    /**
     * recursivly validate tile options
     */
    validate : function(tile_options,constraint_options) {
	var errors = [];
	Object.each(tile_options, function(content,key){
	    RPG.optionValidator._validateRecurse(content,key,constraint_options,[],errors);
	});
	return errors;
    },
    _validateRecurse : function(content,key,constraint_options,path,errors) {
	path.push(key);
	if (typeOf(content) == 'object') {
	    Object.each(content, function(c,k){
		RPG.optionValidator._validateRecurse(c,k,constraint_options,path,errors);
	    });
	} else {
	    var constraint = Object.getFromPath(constraint_options,path);

	    var con0 = typeOf(constraint) == 'array' && constraint[0] || constraint;
	    var con1 = typeOf(constraint) == 'array' && constraint[1] || null;
	    var con2 = typeOf(constraint) == 'array' && constraint[2] || null;

	    var type0 = typeOf(constraint) == 'array' && typeOf(con0) || null;

	    switch (true) {

		/**
		 * Array: numbers [min,max,default]
		 */
		case (Number.from(con0) != null && Number.from(con1) != null  && constraint.length <= 3) :
		    if (Number.from(content) === null) {
			errors.push(('<b>'+path.join(' > ').capitalize().hyphenate().split('-').join(' ').capitalize()+'</b>')+' is invalid:<br>'+unescape(Object.toQueryString(Object.values(constraint).associate(['Min','Max','Default']))).replace(/\&/g,', ')+'<br>');
		    } else {
			content = Number.from(content);
			if (content < con0 || content > con1) {
			    errors.push(('<b>'+path.join(' > ').capitalize().hyphenate().split('-').join(' ').capitalize()+'</b>')+' is invalid:<br>'+unescape(Object.toQueryString(Object.values(constraint).associate(['Min','Max','Default']))).replace(/\&/g,', ')+'<br>');
			}
		    }
		    break;

		/**
		 * Array: [(string|regex),min,max[,default]]
		 */
		case (type0 == 'string' && Number.from(con1) !=null && Number.from(con2) !=null  && constraint.length <= 4) :
		    if (content.length < Number.from(con1) || content.length > Number.from(con2) || (/^\//.test(con0) && !new RegExp(con0.substr(1,con0.length-2)).test(content))) {
			errors.push(('<b>'+path.join(' > ').capitalize().hyphenate().split('-').join(' ').capitalize()+'</b>')+' is invalid:<br>'+unescape(Object.toQueryString(Object.values(constraint).associate(['Allowed','Min','Max']))).replace(/\&/g,', ')+'<br>');
		    }
		    break;


		/**
		 * Array of strings: [type0=string[,type1=string,...]]
		 */
		case (type0 == 'string' && con1 == 'string') :
		    if (!content || !constraint.contains(content)) {
			errors.push(('<b>'+path.join(' > ').capitalize().hyphenate().split('-').join(' ').capitalize()+'</b>')+' is invalid:<br>Must be one of: '+JSON.encode(constraint)+'<br>');
		    }
		    break;


		/**
		 * Key like /^on[A-Z]/
		 * matches events
		 */
		case typeOf(constraint) == 'string' && /^on[A-Z]/.test(key):
		    if (typeOf(content) != 'string') {
			errors.push(('<b>'+path.join(' > ').capitalize().hyphenate().split('-').join(' ').capitalize()+'</b>')+' is invalid:<br>Must be a string.'+'<br>');
		    }
		    break;

		/**
		 * Boolean Values
		 */
		case typeOf(con0) == 'boolean' :
		    if (typeOf(content) != 'boolean') {
			errors.push(('<b>'+path.join(' > ').capitalize().hyphenate().split('-').join(' ').capitalize()+'</b>')+' is invalid:<br>Must be <b>true</b> or <b>false</b>.'+'<br>');
		    }
		    break;

		/**
		 * String Values
		 */
		case typeOf(constraint) == 'string' :
		    if (typeOf(content) != 'string') {
			errors.push(('<b>'+path.join(' > ').capitalize().hyphenate().split('-').join(' ').capitalize()+'</b>')+' is invalid:<br>Must be a string.'+'<br>');
		    }
		    break;

		/**
		 * array Values
		 */
		case typeOf(constraint) == 'array' :
		    if (typeOf(content) != 'string') {
			errors.push(('<b>'+path.join(' > ').capitalize().hyphenate().split('-').join(' ').capitalize()+'</b>')+' is invalid:<br>Must be a string.'+'<br>');
		    }
		    break;

		/**
		 * array Values
		 */
		case typeOf(constraint) == 'number' :
		    content = Number.from(content);
		    if (!content) {
			errors.push(('<b>'+path.join(' > ').capitalize().hyphenate().split('-').join(' ').capitalize()+'</b>')+' is invalid:<br>Must be numeric.'+'<br>');
		    }
		    break;

		/**
		 Default
		 */
		default:

		    break;
	    }
	}
	path.pop();
    }
};