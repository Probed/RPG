if (!RPG) var RPG = {};

RPG.Difficulty = {
    Easy : {
	description : '',
	Character : {
	    Stats : {
		start : 5
	    }
	}
    },
    Medium : {
	description : '',
	Character : {
	    Stats : {
		start : 4
	    }
	}
    },
    Hard : {
	description : '',
	Character : {
	    Stats : {
		start : 2
	    }
	}
    },
    Impossible : {
	description : '',
	Character : {
	    Stats : {
		start : 0
	    }
	}
    }
};
RPG.difficultyVal = function(diff,path) {
    return Object.getFromPath(RPG.Difficulty[diff],path);
}

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


RPG.Gender = {
    Male : {},
    Female : {}
};

RPG.Race = {
    Human : {},
    NotHuman : {}
};

RPG.character_options = {
    Difficulty : Object.keys(RPG.Difficulty),
    portrait : ["/^[a-zA-Z0-9_.]+$/",3,50],
    name : ["/^[a-zA-Z0-9_.]+$/",3,10],
    Gender : Object.keys(RPG.Gender),
    Race : Object.keys(RPG.Race),
    Class : Object.keys(RPG.Class),
    Stats : Object.clone(RPG.Stats)
}

RPG.getCharacterStyles = function(character) {
    var styles = {};
    styles['background-image'] = 'url("/client/images/Character/portrait/'+escape(character.Gender)+'/'+escape(character.portrait)+'/'+escape((character.location && character.location.dir) || 'e')+'.png")';
    styles['background-size'] = '100% 100%';
    styles['background-repeat'] = 'no-repeat';
    return styles;
}

if (typeof exports != 'undefined') {
    module.exports = RPG;
}