if (!RPG) var RPG = {};
if (typeof exports != 'undefined') {
    module.exports = RPG;
}

/**
 * Game Difficulty
 */
RPG.Difficulty = {
    Easy : {
	description : '',
	Character : {
	    xp : {
		modifier : 1.5
	    },
	    Stats : {
		start : 5
	    }
	},
	//override generator options
	Generator : {
	    Terrain : {
		terrain : {
		    size : 32
		}
	    }
	}
    },
    Medium : {
	description : '',
	Character : {
	    xp : {
		modifier : 1
	    },
	    Stats : {
		start : 4
	    }
	},
	//override generator options
	Generator : {
	    Terrain : {
		terrain : {
		    size : 64
		}
	    }
	}
    },
    Hard : {
	description : '',
	Character : {
	    xp : {
		modifier : 0.85
	    },
	    Stats : {
		start : 2
	    }
	},
	//override generator options
	Generator : {
	    Terrain : {
		terrain : {
		    size : 128
		}
	    }
	}
    },
    Impossible : {
	description : '',
	Character : {
	    xp : {
		modifier : 0.5
	    },
	    Stats : {
		start : 0
	    }
	},
	//override generator options
	Generator : {
	    Terrain : {
		terrain : {
		    size : 256
		}
	    }
	}
    }
};
RPG.difficultyVal = function(difficulty,path) {
    return Object.getFromPath(RPG.Difficulty[difficulty],path);
}

/**
 * Character Stats
 */
RPG.Stats = {
    Agility : {
	value : 1
    },
    Charisma : {
	value : 1
    },
    Intelligence : {
	value : 1
    },
    Stamina : {
	value : 1
    },
    Strength : {
	value : 1
    }
};

/**
 * Character Classes
 */
RPG.Class = {
    Warrior : {
	Stats : {
	    start : {
		Strength : RPG.Stats.Strength.value+2,
		Stamina : RPG.Stats.Stamina.value+1
	    }
	}
    },
    Priest : {
	Stats : {
	    start : {
		Intelligence : RPG.Stats.Intelligence.value+1,
		Stamina : RPG.Stats.Stamina.value+1,
		Charisma : RPG.Stats.Charisma.value+1
	    }
	}
    },
    Rogue : {
	Stats : {
	    start : {
		Agility : RPG.Stats.Agility.value+2,
		Strength : RPG.Stats.Strength.value+1
	    }
	}
    },
    Mage : {
	Stats : {
	    start : {
		Intelligence : RPG.Stats.Intelligence.value+2,
		Agility : RPG.Stats.Agility.value+1
	    }
	}
    }
};
RPG.getClassStat = function(clas, stat, key) {
    return (RPG.Class[clas] && RPG.Class[clas].Stats[key][stat]) || RPG.Stats[stat].value;
}

/**
 * Genders
 */
RPG.Gender = {
    Male : {},
    Female : {}
};

/**
 * Races
 */
RPG.Race = {
    Human : {},
    NotHuman : {}
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
    Stats : Object.clone(RPG.Stats)
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