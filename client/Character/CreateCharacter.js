RPG.CreateCharacter = new Class({
    Implements : [Events,Options],
    distributedStats : 0,
    options : {

    },
    initialize : function(options) {
	this.setOptions(options);
	var r = 0;
	this.randFuncs = [];
	this.createDiv = new Element('div',{
	    id : 'CreateCharacter',
	    events : {
		/*
		 * Delegated Events :
		 */
		'click:relay(div.createCharacter)' : function(event) {
		    this.createCharacter();
		}.bind(this),
		'click:relay(div.ResetCharacter)' : function(event) {

		},
		'click:relay(div.PrevPortrait)' : function(event) {
		    this.options.portraitIndex-=1;
		    this.updatePortraits();
		}.bind(this),
		'click:relay(div.NextPortrait)' : function(event) {
		    this.options.portraitIndex+=1;
		    this.updatePortraits();
		}.bind(this),
		'change:relay(#genderSelect)' : function(event) {
		    this.resetStats();
		    this.updatePortraits();
		}.bind(this),
		'change:relay(#raceSelect)' : function(event) {
		    this.resetStats();
		}.bind(this),
		'change:relay(#classSelect)' : function(event) {
		    this.resetStats();
		}.bind(this),
		'change:relay(#diffSelect)' : function(event) {
		    this.resetStats();
		}.bind(this),
		'click:relay(div.RandomDiff)' : this.randFuncs[r++] = function(event) {
		    this.diffSelect.value = Object.getSRandom(RPG.Difficulty).key;
		    this.resetStats();
		}.bind(this),
		'click:relay(div.RandomName)' : this.randFuncs[r++] = function(event) {
		    this.charName.value = RPG.Generator.Name.generate({
			name : {
			    seed : RPG.Random.seed,
			    length:RPG.Random.random(3,10)
			}
		    });
		}.bind(this),
		'click:relay(div.RandomGender)' : this.randFuncs[r++] = function(event) {
		    this.genderSelect.value = Object.getSRandom(RPG.Gender).key;
		    this.updatePortraits();
		    this.resetStats();
		}.bind(this),
		'click:relay(div.RandomPortrait)' : this.randFuncs[r++] = function(event) {
		    this.options.portraitIndex = Math.floor(RPG.Random.random(0,Object.keys(this.options.portraits.Gender[this.genderSelect.value]).length));
		    this.updatePortraits();
		}.bind(this),
		'click:relay(div.RandomRace)' : this.randFuncs[r++] = function(event) {
		    this.raceSelect.value = Object.getSRandom(RPG.Race).key;
		    this.resetStats();
		}.bind(this),
		'click:relay(div.RandomClass)' : this.randFuncs[r++] =function(event) {
		    this.classSelect.value = Object.getSRandom(RPG.Class).key;
		    this.resetStats();
		}.bind(this),
		'click:relay(div.RandomDist)' : this.randFuncs[r++] =function(event) {
		    this.resetStats();
		    var keys = Object.keys(RPG.Stats);
		    //determine how many distributable stats this type of character will get
		    var distributable = RPG.applyModifiers(this.buildCharacter(),0,'Character.Stats.distribute');
		    for(var i=0; i<distributable; i++){
			var rand = Array.getSRandom(keys);
			$(rand).value = Number.from($(rand).value) + 1;
			this.distributedStats++;
		    }
		    this.updateDistributable();
		}.bind(this),
		'click:relay(div.RandomAll)' : function(event) {
		    this.randFuncs.each(function(func){
			func(event);
		    });
		}.bind(this)
	    }
	}).store('instance',this).adopt(
	    new HtmlTable({
		zebra : false,
		sortable : false,
		useKeyboard : false,
		properties : {
		    'class' : 'tblWrapper'
		},
		headers : [
		{
		    properties : {
			'class' : 'textMedium textCenter'
		    },
		    content : 'Portrait'
		},
		{
		    properties : {
			'class' : 'textLarge textCenter'
		    },
		    content : new Element('div').adopt(
			new Element('span',{
			    html : 'New <span class="Character_rev">Character</span> &nbsp;&nbsp;'
			}),
			RPG.elementFactory.buttons.actionButton({
			    'class' : 'RandomAll',
			    html : 'All Random'
			})
			)

		},
		{
		    properties : {
			'class' : 'textMedium textCenter'
		    },
		    content : 'Modifiers'
		}
		],
		rows : [
		[
		{
		    properties : {
			'class' : 'vTop'
		    },
		    content : new Element('div').adopt(
			this.tblPortrait = new HtmlTable({
			    zebra : true,
			    sortable : false,
			    useKeyboard : false,
			    properties : {
				'class' : 'tblPortrait'
			    },
			    headers : [
			    {
				properties : {
				    colspan : 3,
				    'class' : 'textCenter'
				},
				content : this.portrait = new Element('div',{
				    'class' : 'Portrait'
				})
			    }
			    ],
			    rows : [
			    [
			    {
				properties : {
				    colspan : 3,
				    'class' : 'textMedium textCenter'
				},
				content : new Element('div').adopt(
				    (function(){
					var elms = [];
					this.portraitDir = {};
					['n','e','s','w'].each(function(dir){
					    elms.push(this.portraitDir[dir] = new Element('div',{
						id : 'Portrait_'+dir,
						'class' : 'PortraitDir'
					    }));
					    if (elms.length == 2) {
						elms.push(new Element('br'));
					    }
					}.bind(this));
					return elms;
				    }.bind(this)()))
			    }
			    ]
			    ],
			    footers : [
			    {
				properties : {
				    'class' : 'textMedium textLeft'
				},
				content : RPG.elementFactory.buttons.actionButton({
				    'class' : 'PrevPortrait',
				    html : '&lt;'
				})
			    },
			    {
				properties : {
				    'class' : 'textCenter textSmall vMiddle'
				},
				content : RPG.elementFactory.buttons.actionButton({
				    'class' : 'RandomPortrait',
				    html : 'Random'
				})
			    },
			    {
				properties : {
				    'class' : 'textMedium textRight'
				},
				content : RPG.elementFactory.buttons.actionButton({
				    'class' : 'NextPortrait',
				    html : '&gt;'
				})
			    }
			    ]

			}).toElement(),
			new HtmlTable({
			    zebra : true,
			    sortable : false,
			    useKeyboard : false,
			    properties : {
				cellpadding : 2,
				styles : {
				    width : '100%'
				}
			    },
			    rows : [
			    [
			    {
				properties : {
				    colspan : 2
				},
				content : 'Hitpoints:'
			    }
			    ],
			    [
			    {
				properties : {
				    'class' : 'textLarge textCenter',
				    colspan : 2,
				    styles : {
					'background-color' : 'red'
				    }
				},
				content : this.hitpoints = new Element('div',{
				    id : 'hitpoints',
				    html : '0',
				    styles : {
					color : 'white'
				    }
				})
			    }
			    ],
			    [
			    {
				properties : {
				    colspan : 2
				},
				content : 'Mana:'
			    }
			    ],
			    [
			    {
				properties : {
				    'class' : 'textLarge textCenter',
				    colspan : 2,
				    styles : {
					'background-color' : 'blue'
				    }
				},
				content : this.mana = new Element('div',{
				    id : 'mana',
				    html : '0',
				    styles : {
					color : 'white'
				    }
				})
			    }
			    ],
			    [
			    {
				properties : {

				},
				content : 'Lives:'
			    },
			    {
				properties : {
				    'class' : 'textRight textLarge'
				},
				content : this.lives = new Element('div',{
				    html : 'Infinity'
				})
			    }
			    ],
			    [
			    {
				properties : {

				},
				content : 'Level:'
			    },
			    {
				properties : {
				    'class' : 'textRight textLarge'
				},
				content : '1'
			    }
			    ],
			    [
			    {
				properties : {

				},
				content : 'XP:'
			    },
			    {
				properties : {
				    'class' : 'textRight textLarge'
				},
				content : '0'
			    }
			    ]
			    ]
			}).toElement()
			)
		},
		{
		    properties : {
			'class' : 'vTop'
		    },
		    content : new HtmlTable({
			zebra : true,
			sortable : false,
			useKeyboard : false,
			properties : {
			    'class' : 'tblNameGender'
			},

			rows : [
			[
			{
			    properties : {
				'class' : 'textMedium textLeft'
			    },
			    content : 'Difficulty'
			},
			{
			    properties : {
				'class' : 'textMedium textLeft'
			    },
			    content : (function(){
				var sel = this.diffSelect = new Element('select',{
				    id : 'diffSelect'
				});
				//sel.adopt(new Element('option'));
				Object.each(RPG.Difficulty,function(dif,name){
				    sel.adopt(new Element('option',{
					html : name
				    }));
				});
				sel = null;
				return this.diffSelect;
			    }.bind(this)())
			},
			{
			    properties : {
				'class' : 'textLeft textSmall'
			    },
			    content : RPG.elementFactory.buttons.actionButton({
				'class' : 'RandomDiff',
				html : 'Random'
			    })
			}
			],
			[
			{
			    properties : {
				'class' : 'textMedium textLeft'
			    },
			    content : 'Name'
			},
			{
			    properties : {
				'class' : 'vMiddle'
			    },
			    content : this.charName = new Element('input',{
				type : 'text',
				name : 'charName',
				size : '9',
				id : 'charName'
			    })

			},
			{
			    properties : {
				'class' : 'textLeft textSmall'
			    },
			    content : RPG.elementFactory.buttons.actionButton({
				'class' : 'RandomName',
				html : 'Random'
			    })
			}
			],
			[
			{
			    properties : {
				'class' : 'textMedium textLeft'
			    },
			    content : 'Gender'
			},
			{
			    properties : {
				'class' : 'textMedium textLeft vTop'
			    },
			    content : (function(){
				var sel = this.genderSelect = new Element('select',{
				    id : 'genderSelect'
				});
				//sel.adopt(new Element('option'));
				Object.each(RPG.Gender,function(dif,name){
				    sel.adopt(new Element('option',{
					html : name
				    }));
				});
				sel = null;
				return this.genderSelect;
			    }.bind(this)())
			},
			{
			    properties : {
				'class' : 'textLeft textSmall'
			    },
			    content : RPG.elementFactory.buttons.actionButton({
				'class' : 'RandomGender',
				html : 'Random'
			    })
			}
			],
			[
			{
			    properties : {
				'class' : 'textMedium textLeft'
			    },
			    content : 'Race'
			},
			{
			    properties : {
				'class' : 'textMedium textLeft vTop'
			    },
			    content : (function(){
				var sel = this.raceSelect = new Element('select',{
				    id : 'raceSelect'
				});
				//sel.adopt(new Element('option'));
				Object.each(RPG.Race,function(dif,name){
				    sel.adopt(new Element('option',{
					html : name
				    }));
				});
				sel = null;
				return this.raceSelect;
			    }.bind(this)())
			},
			{
			    properties : {
				'class' : 'textLeft textSmall'
			    },
			    content : RPG.elementFactory.buttons.actionButton({
				'class' : 'RandomRace',
				html : 'Random'
			    })
			}
			],
			[
			{
			    properties : {
				'class' : 'textMedium textLeft'
			    },
			    content : 'Class'
			},
			{
			    properties : {
				'class' : 'textMedium textLeft'
			    },
			    content : (function(){
				var sel = this.classSelect = new Element('select',{
				    id : 'classSelect'
				});
				//sel.adopt(new Element('option'));
				Object.each(RPG.Class,function(clas,name){
				    sel.adopt(new Element('option',{
					html : name
				    }));
				});
				sel = null;
				return this.classSelect;
			    }.bind(this)())
			},
			{
			    properties : {
				'class' : 'textLeft textSmall'
			    },
			    content : RPG.elementFactory.buttons.actionButton({
				'class' : 'RandomClass',
				html : 'Random'
			    })
			}
			],
			[
			{
			    properties : {
				'class' : 'textMedium textLeft vTop'
			    },
			    content : 'Stats'
			},
			{
			    properties : {
				'class' : 'textMedium textLeft'
			    },
			    content : (function(){
				var tbl = new HtmlTable({
				    zebra : false,
				    sortable : false,
				    useKeyboard : false,
				    rows : [
				    [
				    {
					properties : {
					    'class' : 'textMedium textLeft vTop'
					},
					content : 'Distributable'
				    },
				    {
					properties : {

					},
					content : '&nbsp;'
				    },
				    {
					properties : {
					    'class' : 'textLarge textCenter vTop'
					},
					content : this.distribute = new Element('div',{
					    id : 'distributableStats',
					    html : 0
					})
				    },
				    {
					properties : {

					},
					content : '&nbsp;'
				    }
				    ]
				    ]
				});
				var s = 0;
				Object.each(RPG.Stats,function(stats,name){
				    tbl.push([
				    {
					properties : {
					    'class' : 'textMedium textLeft'
					},
					content : name
				    },
				    {
					properties : {
					    'class' : 'textCenter vMiddle'
					},
					content : RPG.elementFactory.buttons.actionButton({
					    html : '<span class="textLarge">-</span>',
					    events : {
						click : function(event) {
						    var s = this.distributedStats - 1;
						    var n = Number.from($(name).value);
						    //determine the minimum number this Stat can have.
						    var min = RPG.applyModifiers(this.buildCharacter(),stats.value,'Character.Stats.start.'+name);

						    //determine how many distributable stats this type of character will get
						    var distributable = RPG.applyModifiers(this.buildCharacter(),0,'Character.Stats.distribute');

						    //ensure that there is enough distributable stats left to decrement this stat
						    if ((s >= 0 && s <= distributable) && (n-1 >= min)) {
							$(name).value = n-1;
							this.distributedStats--;
							this.updateDistributable();
						    }
						}.bind(this)
					    }
					})
				    },
				    {
					properties : {

					},
					content : new Element('input',{
					    id : name,
					    'class' : 'textRight',
					    type : 'text',
					    name : name,
					    value : RPG.applyModifiers(this.buildCharacter(),stats.value,'Character.Stats.start.'+name),
					    styles : {
						width : '30px'
					    }
					})
				    },
				    {
					properties : {
					    'class' : 'textCenter vMiddle'
					},
					content : RPG.elementFactory.buttons.actionButton({
					    html : '<span class="textMedium">+</span>',
					    events : {
						click : function(event) {
						    var s = this.distributedStats + 1;
						    var n = Number.from($(name).value);
						    //determine the minimum number this Stat can have.
						    var min = RPG.applyModifiers(this.buildCharacter(),stats.value,'Character.Stats.start.'+name);

						    //determine how many distributable stats this type of character will get
						    var distributable = RPG.applyModifiers(this.buildCharacter(),0,'Character.Stats.distribute');

						    //ensure that there is enough distributable stats left to decrement this stat
						    if ((s >= 0 && s <= distributable) && (n+1 >= min)) {
							$(name).value = n+1;
							this.distributedStats++;
							this.updateDistributable();
						    }
						}.bind(this)
					    }
					})
				    }
				    ]);
				    s++;
				}.bind(this));
				return tbl.toElement();
			    }.bind(this)())
			},
			{
			    properties : {
				'class' : 'textLeft textSmall vMiddle'
			    },
			    content : RPG.elementFactory.buttons.actionButton({
				'class' : 'RandomDist',
				html : 'Random'
			    })
			}
			]
			]
		    }).toElement()
		},
		{
		    properties : {
			'class' : 'vTop'
		    },
		    content : (this.modifierTable = new HtmlTable({
			zebra : false,
			sortable : false,
			useKeyboard : false,
			rows : [[]]
		    })).toElement()
		}
		],
		[
		{
		    properties : {
			'class' : 'textMedium textLeft'
		    },
		    content : RPG.elementFactory.buttons.cancelButton({
			'class' : 'ResetCharacter',
			html : '<span class="Cancel">Reset Options</span>'
		    })
		},
		{
		    properties : {
			'class' : 'textMedium textCenter',
			colspan : 2
		    },
		    content : RPG.elementFactory.buttons.actionButton({
			'class' : 'createCharacter',
			html : '<span class="Add textMedium">Create <span class="Character_rev">Character</span></span>'
		    })
		}
		]
		]
	    })
	    );
	this.updatePortraits();
	this.updateDistributable();
    },
    toElement : function() {
	return this.createDiv;
    },

    updatePortraits : function() {
	var gender = this.genderSelect.value;
	this.options.portraitIndex = this.options.portraitIndex || 0;
	var character = {
	    Gender : gender,
	    portrait :this.options.portraits.Gender[gender][Object.keys(this.options.portraits.Gender[gender])[this.options.portraitIndex]] || this.options.portraits.Gender[gender][0]
	};
	this.portrait.setStyles(RPG.getCharacterStyles(character));
	['n','e','s','w'].each(function(dir){
	    character.location = {
		dir : dir
	    };
	    this.portraitDir[dir].setStyles(RPG.getCharacterStyles(character));
	}.bind(this));
	if (!this.options.portraits.Gender[gender][Object.keys(this.options.portraits.Gender[gender])[this.options.portraitIndex]]) {
	    this.options.portraitIndex = 0;
	}
    },

    createCharacter : function() {
	var character = this.buildCharacter();
	var errors = RPG.Constraints.validate(character,RPG.character_options);
	/**
	 * validate stats
	 */
	var base = 0;
	var total = 0;
	Object.each(RPG.Stats,function(stats,name) {
	    base+=RPG.applyModifiers(character,stats.value,'Character.Stats.start.'+name);
	    total+=Number.from($(name).value);
	});
	var distributable = RPG.applyModifiers(character,0,'Character.Stats.distribute');
	if ((total - base) != distributable) {
	    errors.push('Please distribute the <b>' + (distributable - (total - base)) +'</b> remainig stat(s)');
	}

	if (errors && errors.length > 0) {
	    RPG.Error.show(errors);
	    return;
	}

	new Request.JSON({
	    url : '/index.njs?xhr=true&a=Play&m=CreateCharacter',
	    onFailure : function(error) {
		RPG.Error.show(error);
	    }.bind(this),
	    onSuccess : function(result) {
		RPG.Success.notify('Your character has been sucessfully created.');
		this.fireEvent('created',[result]);
	    }.bind(this)
	}).post(JSON.encode(character));
    },

    resetStats : function() {
	Object.each(RPG.Stats,function(stats,name) {
	    $(name).value = RPG.applyModifiers(this.buildCharacter(),stats.value,'Character.Stats.start.'+name);
	}.bind(this));
	this.distributedStats = 0;
	this.updateDistributable();
	this.updateHPMana();
    },
    updateDistributable : function() {
	this.distribute.set('html',RPG.applyModifiers(this.buildCharacter(),0,'Character.Stats.distribute') - this.distributedStats);
	this.updateHPMana();
	this.updateModifierTable();
    },

    buildCharacter : function() {
	var gender = this.genderSelect.value;
	return {
	    name : this.charName.value,
	    portrait : (this.options.portraits.Gender[gender][Object.keys(this.options.portraits.Gender[gender])[this.options.portraitIndex]] || this.options.portraits.Gender[gender][0]),
	    Gender : gender,
	    Race : this.raceSelect.value,
	    Class : this.classSelect.value,
	    Stats : (function(){
		var stats = {};
		Object.each(RPG.Stats,function(stat,name){
		    if (!$(name)) return;
		    stats[name] = {
			value : $(name).value
		    };
		});
		return stats;
	    }()),
	    Difficulty : this.diffSelect.value,
	    level : "1"
	};
    },

    updateHPMana : function() {
	if (!$('CreateCharacter')) return;
	this.hitpoints.set('html',RPG.calcMaxHP(this.buildCharacter()));
	this.mana.set('html',RPG.calcMaxMana(this.buildCharacter()));
	this.lives.set('html',RPG.applyModifiers(this.buildCharacter(),0,'Character.lives'));
    },

    updateModifierTable : function() {
	if (!this.modifierTable) return;
	this.modifierTable.empty();
	var character = this.buildCharacter();
	var types = {};
	['Difficulty','Gender','Race','Class'].each(function(type){
	    types[type] = {};
	});

	var rows = [];
	RPG.applyModifiers(character,0,'Character.Stats.distribute',function(path,mod,modifier,characterValue){
	    types[mod][path] = {
		charVal : characterValue,
		modifier : (modifier>=0?'+':'')+modifier
	    };
	});

	RPG.applyModifiers(character,0,'Character.lives',function(path,mod,modifier,characterValue){
	    types[mod][path] = {
		charVal : characterValue,
		modifier : (modifier>=0?'+':'')+modifier
	    };
	});
	Object.each(RPG.Stats,function(stat,name) {
	    RPG.applyModifiers(character,stat.value,'Character.Stats.start.'+name,function(path,mod,modifier,characterValue){
		types[mod][path] = {
		    charVal : characterValue,
		    modifier : (modifier>=0?'+':'')+modifier
		};
	    });
	});

	['hp','mana'].each(function(item){
	    RPG.applyModifiers(character,0,'Character.'+item+'.max',function(path,mod,modifier,characterValue){
		types[mod][path] = {
		    charVal : characterValue,
		    modifier :  (modifier>=0?'+':'') + (modifier*100)+'%'
		};
	    });
	});

	Object.each(types,function(type,name){
	    this.modifierTable.push([
	    {
		properties : {
		    'class' : '',
		    colspan : 2
		},
		content : name
	    },
	    {
		properties : {
		    'class' : 'textLarge textRight',
		    colspan : 2
		},
		content : character[name]
	    }
	    ],{

		'class' : 'table-tr-odd'

	    });
	    Object.each(type,function(mod, path){
		this.modifierTable.push([
		{
		    properties : {
		    },
		    content : '&nbsp;&nbsp;&nbsp;&nbsp;'
		},
		{
		    properties : {
		    },
		    content : path.split('.').slice(1).join(' ').capitalize()
		},
		{
		    properties : {
			'class' : 'textLarge textRight'
		    },
		    content : mod.modifier
		}
		]);
	    }.bind(this));
	}.bind(this));

    }

});