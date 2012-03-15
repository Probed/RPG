if (!RPG) var RPG = {};
if (typeof exports != 'undefined') {
    module.exports = RPG;
}

/**
 * A Basic Universe Object. Should be cloned when creating new universes
 *
 * universe.maps[mapName] = RPG.map
 */
RPG.universe = {
    options : {},//stores the options of a universe (created using RPG.universe_options  constraints object)
    maps : {} //map objects attached to this universe mapName is the key see above
};

/**
 * Universe Option Constraints Object
 */
RPG.universe_options = {
    property : {
	universeName : ['/^[a-zA-Z0-9]+$/',3,15],
	author : ['/^[a-zA-Z0-9]+$/',3,50]
    }
};


/**
 * A Basic Map Object. Should be cloned when created new Maps
 */
RPG.map = {
    options : {},
    cache : {},
    tiles : {}
};


/**
 * Map Option Constraints Object
 */
RPG.map_options = {
    property : {
	mapName : ['/^[a-zA-Z0-9]+$/',3,15],
	author : ['/^[a-zA-Z0-9@._]+$/',3,50]
    }
};

/**
 * a Tileset is pretty much identical to a map, but treated slightly differently in the map editor
 */
RPG.tileset = Object.clone(RPG.map);

/**
 * Tileset Option Constraints
 */
RPG.tileset_options = {
    property : {
	category : ['/^[a-zA-Z0-9]+$/',3,15],
	name :  ['/^[a-zA-Z0-9]+$/',3,15],
	description : ['/^[a-zA-Z0-9 _.-]+$/',1,255]
    }
};