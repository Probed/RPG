/**
 *  optionConfig.js is used to traverse option constraint objects recurcivly to provide both input and validation of input
 *		    input received from a constraint object creates an identical object with the input values where the constraints were.
 *
 *  the simplest option constraint object looks like this:
 *  {
 *	optionName : constraint
 *  }
 *  more complex nested:
 *  {
 *	name : {
 *	    name2 : constraint,
 *	    name3 : {
 *		name4 : constraint
 *	    }
 *	}
 *}
 *
 *  optionName : can be any name you desire and will be displayed to the user as the input Label
 *		Special treatment is given for the following name types:
 *		    optionName like on[A-Z]*  are event properties and they are given a textarea within which to define the event stuff
 *
 *  constraint : takes on many forms:
 *	[num,num,num] = Min, Max, Default Number.  Input must fall inclusive between min and max and be a numeric value
 *	[string,num,num[,string]] = regex must be quoted to make it a string since JSON.encode/decode does not do native regex eg "/regex/". Min Length, Max Length, Default Value.
 *	[string[,string]] = Select one from the list (first one is default)
 *	[true/false] = Checkbox yes/no,
 *	number = Must be numeric, but is unconstrained (number specified is default number)
 *	string = Must be string, but is unconstrained (string specified is default string)
 *	object = Traverse into this object for more constraints
 */
if (!RPG) var RPG = {};

if (typeof exports != 'undefined') {
    Object.merge(RPG,require('./Random.js'));
    module.exports = RPG;
}

/**
 * Accepts a string or array path.
 * source is optional if you want to append to existing object
 *
 * returns new nested object from the path
 * example:
 * path = ['p1','p2','p3'] or
 * path = 'p1.p2.p3'
 *
 * root = p1: {
 *	    p2: {
 *		p3 : child = {}
 *	    }
 *	}
 *
 * return {
 *  root : p1
 *  child : p3
 * }
 */
Object.extend({
    pathToObject : function(source,path) {
	if (typeOf(path) == 'string') path = path.split('.');
	var child = source || {};
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
    /**
     * Returns a Div Element Tabbed Input Form for a option constraints object
     *
     * Recursivly traverses an option constrain object an generates tabs for the first level of constraints, the nested tables for all sub level constraints
     */
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
     *	Recursivly traverses an option constrain object and generates nested tables for all constraints
     *
     *  constraint_options : a constrain options object
     *	optionsName : appended to create the optionsPath (can be null to start. used primarily by the recursion)
     *	optionsPath : array or null. gets filled/emptied with the optionsName to get track of the depth
     *	loadOptions : a filled out options object or null,
     *	id : added to the className to uniquely identify this whole set of options
     *
     */
    getOptionTable : function(constraint_options,optionName,optionsPath,loadOptions,id) {
	if (!optionsPath || (optionsPath && typeOf(optionsPath) != 'array')) {
	    optionsPath = [];
	}
	optionName && optionsPath.push(optionName);

	/**
	 * Reached the depth of the config.
	 * use the content of the config to
	 */
	if (typeOf(constraint_options) != 'object') {
	    var elm = null;
	    var value = null;
	    var className = 'mapEditorConfigInput configFor_'+id
	    if (loadOptions) {
		value = Object.getFromPath(loadOptions,optionsPath);
	    }

	    var con0 = (typeOf(constraint_options) == 'array'?constraint_options[0]:constraint_options);
	    var con1 = (typeOf(constraint_options) == 'array' && constraint_options[1]) || null;
	    var con2 = (typeOf(constraint_options) == 'array' && constraint_options[2]) || null;
	    var con3 = (typeOf(constraint_options) == 'array' && constraint_options[3]) || null;

	    var type0 = (typeOf(constraint_options) == 'array' && typeOf(con0)) || null;
	    var type1 = (typeOf(constraint_options) == 'array' && typeOf(con1)) || null;
	    var type2 = (typeOf(constraint_options) == 'array' && typeOf(con2)) || null;

	    switch (true) {

		/**
		 * Array: [min,max,default]
		 */
		case (Number.from(con0)!=null && Number.from(con1)!=null && constraint_options.length <= 3) :
		    con2 = con2 || 0;
		    elm = new Element('div').adopt(
			new Element('input',{
			    type : 'text',
			    id : optionsPath.join('__'),
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
		case (type0 == 'string' && Number.from(con1)!=null && Number.from(con2) !=null  && constraint_options.length <= 4) :
		    elm = new Element('div').adopt(
			new Element('input',{
			    type : 'text',
			    id : optionsPath.join('__'),
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
				    var n = null;
				    if (typeof exports != 'undefined') {
					n = require('./Map/Generators/Words.js').Generator.Name;
				    } else {
					n = RPG.Generator.Name;
				    }
				    this.getParent().getElements('input')[0].value = n.generate({
					name : {
					    seed : RPG.Random.seed,
					    length :  RPG.Random.random(this.retrieve('min'),this.retrieve('max'))
					}
				    });

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
			id : optionsPath.join('__'),
			'class' : className
		    });
		    constraint_options.each(function(opt){
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
			}).store('opts',Array.clone(constraint_options))
			);
		    break;


		/**
		 * Key like /^on[A-Z]/
		 * matches events
		 */
		case (/^on[A-Z]/.test(optionName)):
		    elm = new Element('textarea',{
			cols : 30,
			rows : 3,
			id : optionsPath.join('__'),
			html : (value?value:constraint_options),
			'class' : className
		    });
		    break;

		/**
		 * Boolean Values
		 */
		case (constraint_options && (typeOf(constraint_options[0]) == 'boolean' || constraint_options === 'true' || constraint_options === 'false')) :
		    elm = new Element('input',{
			type : 'checkbox',
			id : optionsPath.join('__'),
			checked : (value?value:typeOf(constraint_options)=='array'?constraint_options[0]:constraint_options),
			'class' : className
		    });
		    break;

		/**
		 * text default
		 */
		default:
		    elm = new Element('input',{
			type : 'text',
			id : optionsPath.join('__'),
			value : (value?value:constraint_options),
			size : (typeOf(constraint_options) == 'number'?3:10),
			'class' : className
		    });
		    break;
	    }
	    optionName && optionsPath.pop();
	    value = null;
	    className = null;
	    return elm; //Return the newly created element to be inserted into the table

	}
	var tbl = new HtmlTable({
	    zebra : optionsPath.length%2 == 1,
	    selectable : false,
	    useKeyboard : false,
	    properties : {
		cellpadding : 2
	    }
	});

	var rows = [];
	Object.each(constraint_options,function(opt,k){
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
		content : RPG.optionCreator.getOptionTable(opt,k,optionsPath,loadOptions,id) //recursively load options
	    }
	    ]
	    );
	});
	tbl.pushMany(rows);
	optionsPath.pop();//pop off the last path name from the optionpath
	return tbl.toElement(); //return the table of options
    },

    /**
     * pID refers to the parent element ID that contains all config elements. can be null
     * id : the id as used in the  RPG.optionCreator.getOptionTable
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
     * uses a option constraints object to generate a random options object
     * ex:
     *	constraint_options : { optionName : [0,5,2] }
     *	returns : { optionName : Random(0,5) }
     *
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
		    var n = null;
		    if (typeof exports != 'undefined') {
			n = require('./Map/Generators/Words.js').Generator.Name
		    } else {
			n = RPG.Generator.Name;
		    }
		    opt.child[optName] = n.generate({
			name : {
			    seed : rand.seed,
			    length : rand.random(Number.from(con1),Number.from(con2))
			}
		    });
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
     * Constraints : nested constraints object
     *
     * exapmle:
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
     * Returns: a recursivly merged object who contains all parent options while allowing child options to override parent options
     *
     * options : {
     *	name : [constraint2],
     *	id : [constraint1]
     * }
     */
    getConstraintOptions : function(path, constraints) {
	var constraing_options = {};
	var cPath = [];
	constraing_options = Object.clone(constraints.options);
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
     * recursivly validate options against a options constraint object
     *
     * returns empty array if all is ok
     *	      or array of errors encountered.
     *
     */
    validate : function(options,option_constraints) {
	var errors = [];
	Object.each(options, function(content,key){
	    RPG.optionValidator._validateRecurse(content,key,option_constraints,[],errors);
	});
	return errors;
    },
    _validateRecurse : function(content,key,option_constraints,path,errors) {
	path.push(key);
	if (typeOf(content) == 'object') {
	    Object.each(content, function(c,k){
		RPG.optionValidator._validateRecurse(c,k,option_constraints,path,errors);
	    });
	} else {
	    var constraint = Object.getFromPath(option_constraints,path);

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
			if (content === 0) {
			    break;
			}
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
		case (typeOf(constraint) == 'array' && typeOf(constraint[0]) == 'boolean') || constraint === 'true' || constraint === 'false' :
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
			errors.push(('<b>'+path.join(' > ').capitalize().hyphenate().split('-').join(' ').capitalize()+'</b>')+' is invalid ('+constraint+'):<br>Must be a string.'+'<br>');
		    }
		    break;

		/**
		 * array Values
		 */
		case typeOf(constraint) == 'number' :
		    if (typeOf(content) != 'number') {
			content = Number.from(content);
		    }
		    if (content === 0) {
			break;
		    }
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