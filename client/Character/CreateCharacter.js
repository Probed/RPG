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
			    length:RPG.Random.random(3,11)
			}
		    });
		}.bind(this),
		'click:relay(div.RandomGender)' : this.randFuncs[r++] = function(event) {
		    this.genderSelect.value = Object.getSRandom(RPG.Gender).key;
		    this.updatePortraits();
		}.bind(this),
		'click:relay(div.RandomPortrait)' : this.randFuncs[r++] = function(event) {
		    this.options.portraitIndex = Math.floor(RPG.Random.random(0,Object.keys(this.options.portraits.Gender[this.genderSelect.value]).length));
		    this.updatePortraits();
		}.bind(this),
		'click:relay(div.RandomRace)' : this.randFuncs[r++] = function(event) {
		    this.raceSelect.value = Object.getSRandom(RPG.Race).key;
		}.bind(this),
		'click:relay(div.RandomClass)' : this.randFuncs[r++] =function(event) {
		    this.classSelect.value = Object.getSRandom(RPG.Class).key;
		    this.resetStats();
		}.bind(this),
		'click:relay(div.RandomDist)' : this.randFuncs[r++] =function(event) {
		    this.resetStats();
		    var keys = Object.keys(RPG.Stats);
		    for(var i=0; i<RPG.difficultyVal(this.diffSelect.value,'Character.Stats.start');i++){
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

		}
		],
		rows : [
		[
		{
		    properties : {
			'class' : 'vTop'
		    },
		    content : this.tblPortrait = new HtmlTable({
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

		    }).toElement()
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
						    var min = RPG.getClassStat(this.classSelect.value,name,'start');
						    if ((s >= 0 && s <= RPG.difficultyVal(this.diffSelect.value,'Character.Stats.start')) &&
							(n-1 >= min)) {
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
					    value : RPG.getClassStat(this.classSelect.value,name,'start'),
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
						    var min = RPG.getClassStat(this.classSelect.value,name,'start');
						    if ((s >= 0 && s <= RPG.difficultyVal(this.diffSelect.value,'Character.Stats.start')) &&
							(n+1 >= min)) {
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
			'class' : 'textMedium textRight'
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
	var gender = this.genderSelect.value
	var character = {
	    name : this.charName.value,
	    portrait : (this.options.portraits.Gender[gender][Object.keys(this.options.portraits.Gender[gender])[this.options.portraitIndex]] || this.options.portraits.Gender[gender][0]),
	    Gender : gender,
	    Race : this.raceSelect.value,
	    Class : this.classSelect.value,
	    Stats : (function(){
		var stats = {};
		Object.each(RPG.Stats,function(stat,name){
		    stats[name] = {
			value : $(name).value
		    };
		});
		return stats;
	    }()),
	    Difficulty : $('diffSelect').value
	};
	var errors = RPG.optionValidator.validate(character,RPG.character_options);

	/**
	 * validate stats
	 */
	var base = 0;
	var total = 0;
	Object.each(RPG.Stats,function(stats,name) {
	    base+=RPG.getClassStat(character.Class,name,'start');
	    total+=Number.from($(name).value);
	});
	if (total - base != RPG.difficultyVal(this.diffSelect.value,'Character.Stats.start')) {
	    errors.push('Please distribute the <b>' + (RPG.difficultyVal(this.diffSelect.value,'Character.Stats.start') - (total - base)) +'</b> remainig stat(s)');
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
		RPG.Success.show('Your character has been sucessfully created.');
		this.fireEvent('created',[result]);
	    }.bind(this)
	}).post(JSON.encode(character));
    },

    resetStats : function() {
	Object.each(RPG.Stats,function(stats,name) {
	    $(name).value = RPG.getClassStat(this.classSelect.value,name,'start');
	});
	this.distributedStats = 0;
	this.updateDistributable();
    },
    updateDistributable : function() {
	this.distribute.set('html',RPG.difficultyVal(this.diffSelect.value,'Character.Stats.start') - this.distributedStats);
    }
});