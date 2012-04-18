
define(['../Game/Item','../../common/Character/CharacterSlots'],function(){


    /*
The window which displays the characters equippable slots and handles drag-drop
of items
 */
    RPG.CharacterEquipment = new (new Class({

	/**
	 * Init Character Equipment
	 */
	initialize : function() {

	    this.equipInv = new HtmlTable({
		zebra : false,
		selectable : false,
		useKeyboard : false,
		properties : {
		    id : 'EquipInvTable',
		    cellpadding : 0,
		    cellspacing : 0
		},
		headers : [],
		rows  :[
		[
		{
		    content : (this.characterEquipmentTable = new HtmlTable({
			zebra : false,
			selectable : false,
			useKeyboard : false,
			properties : {
			    id : 'CharacterEquipmentTable',
			    cellpadding : 0,
			    cellspacing : 0
			},
			headers : [],
			rows  :[[]],
			footers : []
		    })).toElement()
		},
		{
		    properties : {
			'class' : 'vTop'
		    },
		    content : (this.characterInventoryTable = new HtmlTable({
			zebra : false,
			selectable : false,
			useKeyboard : false,
			properties : {
			    id : 'CharacterInventoryTable',
			    cellpadding : 0,
			    border : 0,
			    align : 'center',
			    styles : {
				'background-color' : '#3e3e3e'
			    }
			},
			headers : [],
			rows  :[[]],
			footers : []
		    })).toElement()
		}
		]
		],
		footers : []
	    });

	},
	toElement : function() {
	    return this.equipInv.toElement()
	},
	refresh : function(game) {

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
				'html' : 'Level ' + game.character.level + ' ' + game.character.Race +  ' ' + game.character.Class +  ' ' + game.character.name
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
		if (/Growth/.test(key) && ((slot.partOf && game.character[slot.partOf]))) {
		    add = true;
		} else if (!/Growth/.test(key)) {
		    //fix rows where we need to colspan certain items for astetics
		    if (!game.character.GrowthHead && (/Head/.test(slot.partOf) || /Head/.test(key) || /^Neck$/.test(key) || /^LeftArm$/.test(key) || /^LeftHand$/.test(key) || /^LeftFinger3$/.test(key))) {
			if (/LeftEar/.test(key)) {
			    colOffset = 2;
			} else if (/^LeftArm$/.test(key) || /^LeftHand$/.test(key) || /^LeftFinger3$/.test(key)) {
			    colOffset = -1;
			} else {
			    if (!/Growth/.test(key) && (/Head/.test(key) || /Neck/.test(key))) {
				colSpan = 2;
				delete rows[slot.row][17];
			    }
			    colOffset = 1;
			}
		    }

		    add = true;

		}

		if (add) {
		    var inv = game.inventory.equipment;
		    var styles = RPG.getMapTileStyles({
			map : inv,
			row : slot.row,
			col : slot.col,
			rowOffset : 0,
			colOffset : 0,
			zoom : 24
		    });
		    var tiles = inv.tiles && inv.tiles[slot.row] && inv.tiles[slot.row][slot.col];
		    var tileCount = 0;
		    if (tiles) {
			tileCount = tiles.length;
		    }
		    rows[slot.row][slot.col+colOffset] = Object.merge({
			properties : {
			    'class' : 'ItemDrop textCenter ' + Array.prejoin(slot.itemTypes,'accept_',' '),
			    row : slot.row,
			    col : slot.col,
			    inventory : 'equipment'
			},
			content : (new RPG.Item(game,inv.cache,tiles && tiles[0],new Element('div',{
			    html : (tileCount > 1 && tileCount) || '&nbsp;',
			    styles : Object.merge(styles,{
				'background-size' : '100% 100%',
				'background-position' : '0% 0%',
				//'background-color' : '#3e3e3e',
				'display' : 'inline-block'
			    })
			}))).toElement()
		    },(colSpan==1?{}:{
			properties : {
			    colspan : colSpan
			}
		    }));
		}
	    }.bind(this));
	    this.characterEquipmentTable.empty().pushMany(rows);

	    var bgUrls = '';
	    if (game.character.RightGrowthLeg) {
		bgUrls+='url(/common/Character/m_bg_character_rlg.png),';
	    }
	    if (game.character.LeftGrowthLeg) {
		bgUrls+='url(/common/Character/m_bg_character_llg.png),';
	    }
	    if (game.character.GrowthHead) {
		bgUrls+='url(/common/Character/m_bg_character_hg.png),';
	    } else {
		bgUrls+='url(/common/Character/m_bg_character_h.png),';
	    }
	    if (game.character.LeftGrowthArm) {
		bgUrls+='url(/common/Character/m_bg_character_lag.png),';
	    }
	    if (game.character.RightGrowthArm) {
		bgUrls+='url(/common/Character/m_bg_character_rag.png),';
	    }
	    bgUrls+='url(/common/Character/m_bg_character.png)'
	    this.characterEquipmentTable.toElement().setStyle('background-image',bgUrls);

	    this.refreshInfo(game);
	    this.refreshInventory(game);
	},

	refreshInfo : function(game) {
	    if (!$('RightInfo')) return;
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
		var width = game.character[stat].max == null?100:Math.round((((Number.from(game.character[stat].cur)) /  Number.from(game.character[stat].max)) * 100));
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
			html :  game.character[stat].max == null?'Infinite':game.character[stat].cur + " / " + game.character[stat].max + ' ' + width.formatPercentage(0)
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
		    html :  (Number.from(game.character.xp) || 0).format({
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
		    content : game.character.Stats[stat].value
		}
		]);
	    }.bind(this));

	    leftTable.pushMany(rows);
	    $('LeftInfo').adopt(leftTable);



	    rightTable = null;
	},

	refreshInventory : function(game) {
	    this.characterInventoryTable.empty();

	    var rows = [];
	    var row = null;
	    var r = 0;
	    var c = 0;
	    for (r=0;r<11;r++) {
		row = [];
		for (c=0;c<7;c++) {
		    var inv = game.inventory.character;
		    var styles = RPG.getMapTileStyles({
			map : inv,
			row : r,
			col : c,
			rowOffset : 0,
			colOffset : 0,
			zoom : 32
		    });
		    var tiles = inv.tiles && inv.tiles[r] && inv.tiles[r][c];
		    var tileCount = 0;
		    if (tiles) {
			tileCount = tiles.length;
		    }

		    row.push({
			properties : {
			    'class' : 'CharacterInventory textTiny ItemDrop',
			    row : r,
			    col : c,
			    inventory : 'character'
			},
			content : (new RPG.Item(game,inv.cache,tiles && tiles[0],new Element('div',{
			    html : (tileCount > 1 && tileCount) || '&nbsp;',
			    styles : Object.merge(styles,{
				'background-size' : '100% 100%',
				'background-position' : '0% 0%'
			    })
			}))).toElement()
		    });

		    styles = null;
		}
		rows.push(row);
	    }
	    this.characterInventoryTable.pushMany(rows);
	    $$('CharacterInventory').each(function(elm){

		});
	}
    }))();
});
