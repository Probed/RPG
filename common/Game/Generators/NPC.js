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

RPG.Generator.NPC = new (RPG.Generator.npcClass = new Class({
    Extends : RPG.ItemGeneratorBaseClass,

    name : 'npc',
    constraints : {
	properties : {
	    name : ["/^[a-zA-Z0-9_.]+$/",1,15,'npc'],
	    seed : [0,99999999999,Math.floor((Math.random() * (99999999999 - 1) + 1))],
	    type : RPG.tileFolderList(RPG.Tiles,'npc.earth'),
	    Difficulty : Object.keys(RPG.Difficulty),
	    level : [1,100,1]
	}
    },

    generate : function(options,rand,callback){
	rand = rand || RPG.Random;
	rand.seed = Number.from(options.properties.seed) || Math.floor((Math.random() * (99999999999 - 1)));

	//create the minimum required object to be returned
	var npcObj = {
	    tiles : {},
	    cache : {},
	    npcOptions : {
		generator : this.name,
		genOptions : options
	    }
	};

	var npc = npcObj.npcOptions;

	//generate item:


	RPG.pushTile(npcObj.tiles, [0,0],
	    RPG.createTile(options.properties.type,npcObj.cache,{
		property : {
		    tileName : [0,0].join(''),
		    folderName : options.properties.name,
		    image : {
			name : RPG.getRandomTileImage(options.properties.type,rand).image
		    }
		},
		npc : npc
	    }));

	//finally callback with the npcObj
	callback(npcObj);
    }
}))();