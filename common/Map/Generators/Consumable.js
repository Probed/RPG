if (!RPG) var RPG = {};
if (!RPG.Generator) RPG.Generator = {};



if (typeof exports != 'undefined') {
    Object.merge(RPG,require('./Utilities.js'));
    Object.merge(RPG,require('../Tiles/Utilities.js'));
    Object.merge(RPG,require('../Tiles/Tiles.js'));
    Object.merge(RPG,require('./Words.js'));
    Object.merge(RPG,require('./Maze.js'));
    module.exports = RPG;

}

RPG.Generator.Consumable = new (RPG.Generator.ConsumableClass = new Class({
    Extends : RPG.ItemGeneratorBaseClass,

    name : 'Consumable',
    constraints : {
	properties : {
	    name : ["/^[a-zA-Z0-9_.]+$/",1,15,'Consumable'],
	    seed : [0,99999999999,Math.floor((Math.random() * (99999999999 - 1) + 1))],
	    type : RPG.tileFolderList(RPG.Tiles,'item.earth.consume'),
	    Difficulty : Object.keys(RPG.Difficulty),
	    level : [1,100,1],
	    point : ''
	}
    },

    generate : function(options,rand){
	rand = rand || RPG.Random;
	rand.seed = Number.from(options.properties.seed) || Math.floor((Math.random() * (99999999999 - 1)));

	if (!options.properties.type) {
	    options.properties.type = Array.getSRandom(this.constraints.properties.type,rand);
	}

	//create the minimum required object to be returned
	var consumableObj = {
	    tiles : {},
	    cache : {},
	    itemOptions : {
		generator : this.name,
		genOptions : options
	    }
	};
	//generate item:

	if (!options.properties.point) {
	    options.properties.point = [0,0];
	} else if (typeof options.properties.point == 'string') {
	    options.properties.point = options.properties.point.split(',');
	} else if (typeof options.properties.point != 'array') {
	    options.properties.point = Array.from(options.properties.point);
	}

	RPG.pushTile(consumableObj.tiles, options.properties.point,
	    consumableObj.path = RPG.createTile(options.properties.type,consumableObj.cache,{
		property : {
		    tileName : options.properties.point.join(''),
		    folderName : options.properties.name,
		    image : {
			name : RPG.getRandomTileImage(options.properties.type,rand).image,
			size : 50,
			top : 50,
			left : 50
		    }
		},
		item : consumableObj.itemOptions
	    }));

	//finally callback with the consumableObj
	return consumableObj;
    }
}))();