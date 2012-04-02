if (!RPG) var RPG = {};
if (typeof exports != 'undefined') {
    module.exports = RPG;
}

/**
 * Character Stats
 * Defines possible Stats a character can have and the starting value of that stat
 *
 *
 */
RPG.Stats = {
    Agility : {
	value : 2
    },
    Charisma : {
	value : 2
    },
    Intelligence : {
	value : 2
    },
    Stamina : {
	value : 2
    },
    Strength : {
	value : 2
    },
    Luck : {
	value : 2
    }
};

/**
 * Game Difficulty
 */
RPG.Difficulty = {
    Easy : {
	Character : {
	    lives : Infinity,
	    hp : {
		max : 0.5//+50% HP
	    },
	    mana : {
		max : 0.5//+50% HP
	    },
	    xp : {
		modifier : 0.5//+50% extra xp
	    },
	    Stats : {
		distribute : 5//start with 5 distributable stats
	    }
	},
	//override generator options
	Generator : {
	    Terrain : {
		terrain : {
		    size : 32//must be power of 2
		}
	    }
	},
	//Items
	item : {
	    equip : {
		maxStats : function(level){
		    //maximum allowed stats on an item
		    return Math.floor(level / 10) || 1;
		},
		statMods : function(level,stat,statNum) {
		    var statMods = {
			maxStat : Math.floor(level / 10) || 1,//maximum size of the stat being modified
			negChance : 0.005, //chance the stat will become negative
			roundMod : 0.05 //modify the pre-rounded value down this amount to make rounding up less likely (should be between 0 and 1
		    };
		    return statMods;
		}
	    }
	}
    },
    Medium : {
	Character : {
	    lives : Infinity,
	    hp : {
		max : 0//no change, default 100%
	    },
	    mana : {
		max : 0//no change, default 100%
	    },
	    xp : {
		modifier : 0//no change, default 100%
	    },
	    Stats : {
		distribute : 4//start with 4 distributable stats
	    }
	},
	//override generator options
	Generator : {
	    Terrain : {
		terrain : {
		    size : 64//must be power of 2
		}
	    }
	},
	//Items
	item : {
	    equip : {
		maxStats : function(level){
		    //maximum allowed stats on an item
		    return Math.floor(level / 11) || 1;
		},
		statMods : function(level,stat,statNum) {
		    var statMods = {
			maxStat : Math.floor(level / 11) || 1,//maximum size of the stat being modified
			negChance : 0.01, //chance the stat will become negative
			roundMod : 0.1 //modify the pre-rounded value down this amount to make rounding up less likely (should be between 0 and 1
		    };
		    return statMods;
		}
	    }
	}
    },
    Hard : {
	Character : {
	    lives : 100,
	    hp : {
		max : -0.25//-25% mana
	    },
	    mana : {
		max : -0.25//-25% mana
	    },
	    xp : {
		modifier : -0.25//-25% xp
	    },
	    Stats : {
		distribute : 2//start with 2 distributable stats
	    }
	},
	//override generator options
	Generator : {
	    Terrain : {
		terrain : {
		    size : 128//must be power of 2
		}
	    }
	},
	//Items
	item : {
	    equip : {
		maxStats : function(level){
		    //maximum allowed stats on an item
		    return Math.floor(level / 13) || 1;
		},
		statMods : function(level,stat,statNum) {
		    var statMods = {
			maxStat : Math.floor(level / 13) || 1,//maximum size of the stat being modified
			negChance : 0.05, //chance the stat will become negative
			roundMod : 0.15 //modify the pre-rounded value down this amount to make rounding up less likely (should be between 0 and 1
		    };
		    return statMods;
		}
	    }
	}
    },
    Impossible : {
	Character : {
	    lives : 1,
	    hp : {
		max : -0.50//-50% hp
	    },
	    mana : {
		max : -0.50//-50% mana
	    },
	    xp : {
		modifier : -0.5//-50% xp
	    },
	    Stats : {
		distribute : 0//start with 0 distributable stats
	    }
	},
	//override generator options
	Generator : {
	    Terrain : {
		terrain : {
		    size : 256//must be power of 2
		}
	    }
	},
	//Items
	item : {
	    equip : {
		maxStats : function(level){
		    //maximum allowed stats on an item
		    return Math.floor(level / 15) || 1;
		},
		statMods : function(level,stat,statNum) {
		    var statMods = {
			maxStat : Math.floor(level / 15) || 1,//maximum size of the stat being modified
			negChance : 0.1, //chance the stat will become negative
			roundMod : 0.25 //modify the pre-rounded value down this amount to make rounding up less likely (should be between 0 and 1
		    };
		    return statMods;
		}
	    }
	}
    }
};
RPG.difficultyVal = function(difficulty,path) {
    return Object.getFromPath(RPG.Difficulty[difficulty],path);
}

/**
 * Character Classes
 */
RPG.Class = {
    Warrior : {
	Character : {
	    hp : {
		max : 0.50//50% more hp
	    },
	    mana : {
		max : -0.50//50% less mana
	    },
	    Stats : {
		start : {
		    Strength : 2,//minimun start +2
		    Stamina : 1//minimun start +1
		}
	    }
	}
    },
    Priest : {
	Character : {
	    hp : {
		max : -0.50//50% less hp
	    },
	    mana : {
		max : 0.50//50% more mana
	    },
	    Stats : {
		start : {
		    Intelligence : 1,//minimun start +1
		    Stamina : 1,//minimun start +1
		    Charisma : 1//minimun start +1
		}
	    }
	}
    },
    Rogue : {
	Character : {
	    hp : {
		max : 0.25//25% more hp
	    },
	    mana : {
		max : -0.25//25% less mana
	    },
	    Stats : {
		start : {
		    Agility : 2,//minimun start +2
		    Strength : 1//minimun start +1
		}
	    }
	}
    },
    Mage : {
	Character : {
	    hp : {
		max : -0.25//25% less hp
	    },
	    mana : {
		max : 0.25//25% more mana
	    },
	    Stats : {
		start : {
		    Intelligence : 2,//minimun start +2
		    Agility : 1//minimun start +1
		}
	    }
	}
    }
};

/**
 * Genders
 */
RPG.Gender = {
    Male : {
	Character : {
	    Stats : {
		start : {
		    Strength : 1//minimun start +1
		}
	    }
	}
    },
    Female : {
	Character : {
	    Stats : {
		start : {
		    Intelligence : 1//minimun start +1
		}
	    }
	}
    }
};

/**
 * Races
 */
RPG.Race = {
    Human : {
	Character : {
	    Stats : {
		start : {
		    Agility : 1//minimun start +1
		}
	    }
	}
    },
    Dwarf : {
	Character : {
	    Stats : {
		start : {
		    Stamina : 1//minimun start +1
		}
	    }
	}
    },
    Elf : {
	Character : {
	    Stats : {
		start : {
		    Intelligence : 1//minimun start +1
		}
	    }
	}
    },
    Orc : {
	Character : {
	    Stats : {
		start : {
		    Strength : 1//minimun start +1
		}
	    }
	}
    }
};


/**
 * Character option constraints
 *
 */
RPG.character_options = {
    Difficulty : Object.keys(RPG.Difficulty),
    portrait : ["/^[a-zA-Z0-9_.]+$/",3,50],
    name : ["/^[a-zA-Z0-9_.]+$/",3,10],
    Gender : Object.keys(RPG.Gender),
    Race : Object.keys(RPG.Race),
    Class : Object.keys(RPG.Class),
    Stats : Object.clone(RPG.Stats),
    level : 1,
    xp : 1,
    hp : {
	max : 1,
	cur : 1
    },
    mana : {
	max : 1,
	cur : 1
    },
    lives : {
	max : Infinity,
	cur : Infinity
    }
}

/**
 * takes a character options object and returns a styles object for a DOM Element to display the characters portrait
 */
RPG.getCharacterStyles = function(character) {
    var styles = {};
    styles['background-image'] = 'url("'+RPG.getCharacterImage(character)+'")';
    styles['background-size'] = '100% 100%';
    styles['background-repeat'] = 'no-repeat';
    return styles;
}

RPG.getCharacterImage = function(character) {
    return '/client/images/Character/portrait/'+escape(character.Gender)+'/'+escape(character.portrait)+'/'+escape((character.location && character.location.dir) || 'e')+'.png';
}

/**
 * loop through a characters options and modify the value based on the path
 * (optional) fn -> call function with details for each modifier
 *
 * Eg: value = 1, path = 'Character.Stats.start'
 *
 * 1) Get value from RPG.Difficulty  (eg: +1)
 * 2) Get value from RPG.Gender  (eg: +1)
 * 3) Get value from RPG.Race (eg: +0)
 * 4) Get value from RPG.Class  (eg: +0)
 *
 * returns Modified Value : 3
 */
RPG.applyModifiers = function(character,value,path,fn) {
    var modified = value;
    ['Difficulty','Gender','Race','Class'].each(function(mod){
	var val = Object.getFromPath(RPG[mod][character[mod]],path);
	if (typeof val == 'undefined') return;
	var modifier = null;
	if (typeof val == 'function') {
	    modifier = val(character,value,path,modified);
	} else if (Number.from(val) || val === 0 || val == Infinity) {
	    if (val == Infinity) {
		modifier = Infinity;
		modified = Infinity
	    } else {
		modifier = Number.from(val);
		modified += Number.from(val);
	    }
	}
	if (fn && typeof fn == 'function' && typeof modifier != 'undefined' && typeof modifier != 'object') {
	    fn(path,mod,modifier,character[mod]);
	}
    });
    return modified;
},

/**
 * Calculate a Characters maximum hitpoints
 * rounded up
 */
RPG.calcMaxHP = function(character) {
    var hp = RPG.applyModifiers(character,1,'Character.hp.max');
    return Math.ceil((Number.from(character.Stats.Stamina.value) * Number.from(character.level)) * (hp || 1));
}

/**
 * Calculate a Characters maximum mana
 * rounded up
 */
RPG.calcMaxMana = function(character) {
    var mana = RPG.applyModifiers(character,1,'Character.mana.max');
    return Math.ceil((Number.from(character.Stats.Intelligence.value) * Number.from(character.level)) * (mana || 1));
}


/**
 * Calculate a Charactes Sight Radius
 */
RPG.calcSightRadius = function(character) {
    return 5;
},

/**
 * baseXP the amount to modify
 *
 * required options
 * game
 *
 * callback(xp || 0)
 */
RPG.calcXP = function(baseXP, options,callback) {
    var modifier = RPG.applyModifiers(options.game.character,1,'Character.xp.modifier');
    callback(Math.floor(baseXP * (modifier || 1)));
}