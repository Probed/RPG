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
	GrowthHead : false
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
	    height : 645,
	    width : 580,
	    require : {
		css : ['/client/mochaui/themes/charcoal/css/Character/CharacterEquipment.css'],
		js :['/common/Character/CharacterSlots.js'],
		onloaded : this.refresh.bind(this)
	    }
	});

	this.tips = new Tips([],{
	    showDelay: 100,
	    maxOpacity: .9,
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
		if (r==0&&c==5) {
		    rows[r].push({
			properties : {
			    'class' : 'CharacterName',
			    colspan : 8
			},
			content : this.characterName = new Element('div', {
			    'class' : 'textCenter',
			    styles : {
				overflow:'hidden',
				height : '32px'
			    },
			    'html' : 'Character Name [PLACEHODER]'
			})
		    });
		    c=12;
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

    },
    restore : function() {
	MUI.updateContent({
	    id : $('characterEquipmentWindow'),
	    loadMethod : 'html',
	    content : this.characterEquipmentTable.toElement()
	});
	this.characterEquipmentWindow.minimize();
	this.characterEquipmentWindow.restore();
    }
});