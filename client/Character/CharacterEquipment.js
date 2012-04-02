/*

The window which displays the characters equippable slots and handles drag-drop
of items
 */
RPG.CharacterEquipment = new Class({
    Implements : [Options, Events],
    options : {
	RightGrowthLeg : false,
	LeftGrowthLeg : false,
	RightGrowthArm : false,
	LeftGrowthArm : false,
	GrowthHead : false,
	character : null//@todo some reason RPG.Character class has a clone which isn't getting updated. it should not be a clone
    },
    /**
     * Init Character Equipment
     */
    initialize : function(options) {
	this.setOptions(options);

	/**
	 * Create MUI window to hold the content
	 */
	this.characterEquipmentWindow = new MUI.Window({
	    id : 'characterEquipmentWindow',
	    title : '<span class="Character">Character Equipment</span>',
	    type : 'window',
	    loadMethod : 'html',
	    content : (this.characterEquipmentTable = new HtmlTable({
		zebra : false,
		selectable : false,
		useKeyboard : false,
		properties : {
		    id : 'CharacterEquipmentTable',
		    cellpadding : 0,
		    cellspacing : 2
		},
		headers : [],
		rows  :[[]],
		footers : []
	    })).toElement(),
	    collapsible : false,
	    storeOnClose : true,
	    resizable : false,
	    maximizable : false,
	    closable : true,
	    height : (25*20),
	    width : 24*30,
	    require : {
		css : ['/client/mochaui/themes/charcoal/css/Character/CharacterEquipment.css'],
		js :['/common/Character/CharacterSlots.js'],
		onloaded : this.refresh.bind(this)
	    }
	});

	this.tips = new Tips([],{
	    showDelay: 100,
	    fixed : true,
	    offset : {
		y : 35,
		x : -20
	    }
	});
    },
    refresh : function() {

	var rows = new Array();
	for(var r=0;r<=19;r++) {
	    rows.push(new Array());
	    for(var c=0;c<=17;c++) {
		if (r==0&&c==2) {
		    rows[r].push({
			properties : {
			    'class' : 'CharacterName vMiddle',
			    colspan : 14
			},
			content : this.characterName = new Element('div', {
			    'class' : 'textCenter textLarge',
			    'html' : 'Level ' + this.options.character.level + ' ' + this.options.character.Race +  ' ' + this.options.character.Class +  ' ' + this.options.character.name
			})
		    });
		    c=15;
		} else {

		    if (r>=8&&r<=11 && c>=1&&c<=7) {
			if (r==8&&c==1) {
			    rows[r].push({
				properties : {
				    id : 'RightInfo',
				    'class' : 'vTop',
				    colspan : 6,
				    rowspan : 4,
				    styles : {

				}
				},
				content : '&nbsp;'
			    });
			}
		    } else if (r>=8&&r<=11 && c>=12&&c<=18) {
			if (r==8&&c==12) {
			    rows[r].push({
				properties : {
				    id : 'LeftInfo',
				    'class' : 'vTop',
				    colspan : 6,
				    rowspan : 4,
				    styles : {

				}
				},
				content : '&nbsp;'
			    });
			}
		    } else {
			rows[r].push({
			    properties : {
				'class' : 'EmptyTD ItemEmpty'
			    },
			    content : '&nbsp;'
			});
		    }
		}
	    }
	}

	Object.each(RPG.CharacterSlots, function(slot, key) {
	    var item = {};
	    var add = null;
	    var colOffset = 0;
	    var colSpan = 1;
	    item.tipText = new Element('div',{
		html : 'Slot Empty'
	    });
	    if (/Growth/.test(key)) {
		if ((slot.partOf && this.options[slot.partOf]) || (this.options[slot.id])) {
		    add = true;
		}
	    } else {
		//fix rows where we need to colspan certain items for astetics
		if (!this.options.GrowthHead && (/Head/.test(slot.partOf) || /Head/.test(key) || /^Neck$/.test(key) || /^LeftArm$/.test(key) || /^LeftHand$/.test(key) || /^LeftFinger3$/.test(key))) {
		    if (/LeftEar/.test(key)) {
			colOffset = 2;
		    } else if (/^LeftArm$/.test(key) || /^LeftHand$/.test(key) || /^LeftFinger3$/.test(key)) {
			colOffset = -1;
		    } else {
			if (/Head/.test(key) || /Neck/.test(key)) {
			    colSpan = 2;
			    delete rows[slot.row][17];
			}
			colOffset = 1;
		    }
		}
		add = true;
	    }

	    if (add) {
		rows[slot.row][slot.col+colOffset] = Object.merge({
		    content : RPG.elementFactory.character.characterSlot({
			id : slot.id,
			tipTitle : slot.title + '<br><span class="textSmall">' + slot.desc + '</span>',
			tipText : item.tipText,
			tips : this.tips

		    })
		},(colSpan==1?{}:{
		    properties : {
			colspan : colSpan,
			'class' : 'textCenter'
		    }
		}));
	    }
	}.bind(this));
	this.characterEquipmentTable.empty();
	rows.each(function(row){
	    this.characterEquipmentTable.push(row);
	}.bind(this));
	var bgUrls = '';
	if (this.options.RightGrowthLeg) {
	    bgUrls+='url(/client/mochaui/themes/charcoal/images/Character/m_bg_character_rlg.png),';
	}
	if (this.options.LeftGrowthLeg) {
	    bgUrls+='url(/client/mochaui/themes/charcoal/images/Character/m_bg_character_llg.png),';
	}
	if (this.options.GrowthHead) {
	    bgUrls+='url(/client/mochaui/themes/charcoal/images/Character/m_bg_character_hg.png),';
	} else {
	    bgUrls+='url(/client/mochaui/themes/charcoal/images/Character/m_bg_character_h.png),';
	}
	if (this.options.LeftGrowthArm) {
	    bgUrls+='url(/client/mochaui/themes/charcoal/images/Character/m_bg_character_lag.png),';
	}
	if (this.options.RightGrowthArm) {
	    bgUrls+='url(/client/mochaui/themes/charcoal/images/Character/m_bg_character_rag.png),';
	}
	bgUrls+='url(/client/mochaui/themes/charcoal/images/Character/m_bg_character.png)'
	this.characterEquipmentTable.toElement().setStyle('background-image',bgUrls);

	this.refreshInfo();
    },
    restore : function() {
	MUI.updateContent({
	    id : $('characterEquipmentWindow'),
	    loadMethod : 'html',
	    content : this.characterEquipmentTable.toElement()
	});
	this.characterEquipmentWindow.minimize();
	this.characterEquipmentWindow.restore();
	this.refreshInfo();
    },

    refreshInfo : function() {
	$('RightInfo').empty();
	$('LeftInfo').empty();
	var rightTable = new HtmlTable({
	    zebra : false,
	    selectable : false,
	    useKeyboard : false,
	    properties : {
		cellpadding : 1,
		styles : {
		    width : '100%'
		}
	    }
	});

	var rows = [];
	['hp','mana','lives'].each(function(stat){
	    var width = this.options.character[stat].max == null?100:Math.round((((Number.from(this.options.character[stat].cur)) /  Number.from(this.options.character[stat].max)) * 100));
	    rows.push([
	    {
		properties : {
		    'class' : 'textRight textLarge',
		    styles : {
			width : '15%'
		    }
		},
		content : stat.capitalize()
	    },
	    {
		properties : {
		    'class' : 'textCenter textLarge'
		},
		content : new Element('div',{
		    styles : {
			width : (width>=0?width:0) + '%',
			'background-color' : width==0?'none':stat=='mana'?'blue':stat=='hp'?'red':'purple'
		    },
		    'class' : 'textLarge NoWrap',
		    html :  this.options.character[stat].max == null?'Infinite':this.options.character[stat].cur + " / " + this.options.character[stat].max + ' ' + width.formatPercentage(0)
		})

	    }
	    ]);
	}.bind(this));

	rows.push([
	{
	    properties : {
		'class' : 'textRight textLarge',
		styles : {
		    width : '15%'
		}
	    },
	    content : 'XP'
	},
	{
	    properties : {
		'class' : 'textCenter textLarge'
	    },
	    content : new Element('div',{
		'class' : 'textLarge NoWrap',
		html :  (Number.from(this.options.character.xp) || 0).format({
		    group : ',',
		    decimals : 0
		})
	    })

	}
	]);

	rightTable.pushMany(rows);
	$('RightInfo').adopt(rightTable);


	rows = [];
	var leftTable = new HtmlTable({
	    zebra : false,
	    selectable : false,
	    useKeyboard : false,
	    properties : {
		cellpadding : 1,
		align : 'center',
		styles : {

	    }
	    },
	    rows : [[]]
	});

	Object.keys(RPG.Stats).each(function(stat){
	    rows.push([
	    {
		properties : {
		    styles : {
			width : '15%'
		    }
		},
		content : stat
	    },
	    {
		properties : {
		    'class' : 'textRight',
		    styles : {
			width : '20px'
		    }
		},
		content : this.options.character.Stats[stat].value
	    }
	    ]);
	}.bind(this));

	leftTable.pushMany(rows);
	$('LeftInfo').adopt(leftTable);



	rightTable = null;
    }
});