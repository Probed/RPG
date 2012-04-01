RPG.Character = new Class({
    Implements : [Options, Events],
    topNav : [],
    options : {

    },
    initialize : function(options) {
	this.setOptions(options);
	/*
	 * Map
	 */
	var n=0;
	this.topNav[n++] = (new Element('li')).adopt(
	    this.topNavMap = RPG.elementFactory.buttons.navButton({
		html : '<span class="View">Map</span>',
		tipTitle : 'Map View',
		tipText : 'Map Description',
		tips : this.tips,
		//@todo Fix Description
		events : {
		    click : function(event) {

		    }
		}
	    })
	    ).inject($('topNavUI'),'top');

	/*
	 * Skills
	 */
	this.topNav[n++] = (new Element('li')).adopt(
	    this.topNavSkills = RPG.elementFactory.buttons.navButton({
		html : '<span class="Skills">Skills</span>',
		tipTitle : 'Skills Window',
		tipText : 'Skills Description',
		tips : this.tips,
		//@todo Fix Description
		events : {
		    click : function(event) {

		    }
		}
	    })
	    ).inject($('topNavUI'),'top');

	/*
	 * Bank
	 */
	this.topNav[n++] = (new Element('li')).adopt(
	    this.topNavBank = RPG.elementFactory.buttons.navButton({
		html : '<span class="Bank">Bank</span>',
		tipTitle : 'Bank Window',
		tipText : 'Bank Description',
		tips : this.tips,
		//@todo Fix Description
		events : {
		    click : function(event) {

		    }
		}
	    })
	    ).inject($('topNavUI'),'top');

	/*
	 * Inventory
	 */
	this.topNav[n++] = (new Element('li')).adopt(
	    this.topNavInventory = RPG.elementFactory.buttons.navButton({
		html : '<span class="Inventory">Inventory</span>',
		tipTitle : 'Inventory Window',
		tipText : 'Inventory Description',
		tips : this.tips,
		//@todo Fix Description
		events : {
		    click : function(event) {

		    }
		}
	    })
	    ).inject($('topNavUI'),'top');

	this.topNav[n++] = (new Element('li')).adopt(
	    this.topNavCharacter = RPG.elementFactory.buttons.navButton({
		html : '<span class="Character">Character</span>',
		tipTitle : 'Character Window',
		tipText : 'Character Description',
		tips : this.tips,
		//@todo Fix Description
		events : {
		    click : function(event) {
			if (!this.characterEquipment) {
			    new MUI.Require({
				js : ['/client/Character/CharacterEquipment.js'],
				onloaded : function() {
				    this.characterEquipment = new RPG.CharacterEquipment({
					character : this.options.character
				    });
				}.bind(this)
			    });
			} else {
			    if (this.characterEquipment) {
				this.characterEquipment.restore();
			    }
			}
		    }.bind(this)
		}
	    })
	    ).inject($('topNavUI'),'top');

	this.characterDiv = new Element('div',{
	    'class' : 'M_tileHolder',
	    styles : RPG.getCharacterStyles(this.options.character)
	})

    },
    toElement : function() {
	return this.characterDiv;
    },

    changeDirection : function(dir) {
	this.options.character.location.dir = dir;
	this.characterDiv.setStyles(RPG.getCharacterStyles(this.options.character));
    }

})