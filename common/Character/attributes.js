if (!RPG) var RPG = {};
if (!RPG.Attribute) RPG.Attribute = {};
if (typeof exports != 'undefined') {
    module.exports = RPG;
}

/*
 * Character/NPC Attributes
 *
 */

RPG.AttributeBaseClass = new Class({
    Implements : [Options],
    options : {}
});

RPG.Attribute.Agility = new Class({
    Extends : RPG.AttributeBaseClass,

    initialize : function(options) {
	this.setOptions(options);
    }
});

RPG.Attribute.Intelligence = new Class({
    Extends : RPG.AttributeBaseClass,
    initialize : function(options) {
	this.setOptions(options);
    }
});

RPG.Attribute.Stamina = new Class({
    Extends : RPG.AttributeBaseClass,
    initialize : function(options) {
	this.setOptions(options);
    }
});

RPG.Attribute.Strength = new Class({
    Extends : RPG.AttributeBaseClass,
    initialize : function(options) {
	this.setOptions(options);
    }
});

RPG.Attribute.Luck = new Class({
    Extends : RPG.AttributeBaseClass,
    initialize : function(options) {
	this.setOptions(options);
    }
});