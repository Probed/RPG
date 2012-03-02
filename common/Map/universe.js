if (!RPG) var RPG = {};


RPG.map_options = {
    property : {
	mapName : ['/^[a-zA-Z0-9]+$/',3,50],
	author : ['/^[a-zA-Z0-9@._]+$/',3,50]
    }
};

RPG.map = {
    options : {},
    cache : {},
    tiles : {}
};


RPG.tileset_options = {
    property : {
	category : ['/^[a-zA-Z0-9]+$/',3,50],
	name :  ['/^[a-zA-Z0-9]+$/',3,50],
	description : ['/^[a-zA-Z0-9 _.-]+$/',0,255]
    }
};
RPG.tileset = Object.clone(RPG.map);



RPG.universe_options = {
    property : {
	universeName : ['/^[a-zA-Z0-9]+$/',3,50],
	author : ['/^[a-zA-Z0-9]+$/',3,60]
    }
};

RPG.universe = {
    options : {},
    maps : {}
};

if (typeof exports != 'undefined') {
    module.exports = RPG;
}