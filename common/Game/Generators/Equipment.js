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

RPG.Generator.Equipment = new (RPG.Generator.EquipmentClass = new Class({
    Extends : RPG.ItemGeneratorBaseClass,

    name : 'Equipment',
    constraints : {
	properties : {
	    name : ["/^[a-zA-Z0-9_.]+$/",1,15,'Equipment'],
	    seed : [0,99999999999,Math.floor((Math.random() * (99999999999 - 1) + 1))],
	    type : RPG.tileFolderList(RPG.Tiles,'item.earth.equip'),
	    Difficulty : Object.keys(RPG.Difficulty),
	    level : [1,100,1],
	    point : '',
	    identified : [false]
	}
    },

    generate : function(options,rand){
	rand = rand || RPG.Random;
	rand.seed = Number.from(options.properties.seed) || Math.floor((Math.random() * (99999999999 - 1)));

	if (!options.properties.type) {
	    options.properties.type = Array.getSRandom(this.constraints.properties.type,rand);
	}

	//create the minimum required object to be returned
	var equipmentObj = {
	    tiles : {},
	    cache : {},
	    path : options.properties.type.split('.'),
	    tileConstraints : RPG.Constraints.getConstraints(options.properties.type.split('.'),RPG.Tiles).item,
	    itemOptions : {
		genOptions : options
	    }
	};

	//generate random options:
	Object.merge(equipmentObj.itemOptions,RPG.Constraints.random(equipmentObj.tileConstraints,rand));


	//generate item generic
	var numStats = 0;
	var maxStats = RPG.difficultyVal(options.properties.Difficulty,'item.equip.maxStats')(Math.floor(Number.from(options.properties.level)));
	//randomly get a number between 0 and maxStats to become the new maxStats
	maxStats = Math.round(rand.random(0,maxStats-1));

	equipmentObj.itemOptions.level = Number.from(options.properties.level);
	equipmentObj.itemOptions.durability = Math.ceil(equipmentObj.itemOptions.durability);

	//reset the randomized stats.
	Object.each(equipmentObj.itemOptions.Stats,function(stat,name){
	    equipmentObj.itemOptions.Stats[name] = 0;
	});

	if (options.properties.identified) {

	    var usedStats = [];
	    //apply up to max stats to the item:
	    for (numStats=0; numStats<maxStats; numStats++) {
		//select a random stat:
		var rStat = Object.getSRandom(equipmentObj.itemOptions.Stats,rand,usedStats);
		usedStats.push(rStat.key);

		//get the maximum allowed stat for this level and stat and stat number
		var statMods = RPG.difficultyVal(options.properties.Difficulty,'item.equip.statMods')(Math.floor(Number.from(options.properties.level)),rStat.key,numStats);

		//randomly get a number between 0 and maxStat to become the stat modifier
		var stat = Math.round(rand.random(0,statMods.maxStat) - statMods.roundMod);

		//will the stat become negative?
		if (rand.random() <= statMods.negChance) {
		    stat = -stat;
		}

		if (stat) {
		    //set the stat
		    equipmentObj.itemOptions.Stats[rStat.key] = stat;
		}
	    }
	}
	//trim 0 stats to save bandwidth
	Object.each(equipmentObj.itemOptions.Stats,function(stat,name){
	    if (!equipmentObj.itemOptions.Stats[name]) {
		Object.erase(equipmentObj.itemOptions.Stats,name);
	    } else {

	}
	});


	//generate item specifics by calling a function corrospoding to the type: eg ammo,arm,chest etc:
	if (this[equipmentObj.path[equipmentObj.path.length-1]]) {
	    this[equipmentObj.path[equipmentObj.path.length-1]](options,equipmentObj);
	}

	if (!options.properties.point) {
	    options.properties.point = [0,0];
	} else if (typeof options.properties.point == 'string') {
	    options.properties.point = options.properties.point.split(',');
	} else if (typeof options.properties.point != 'array') {
	    options.properties.point = Array.from(options.properties.point);
	}

	var randImg = RPG.getRandomTileImage(options.properties.type,rand);
	RPG.pushTile(equipmentObj.tiles, options.properties.point,
	    equipmentObj.path = RPG.createTile(options.properties.type,equipmentObj.cache,{
		property : {
		    tileName : 'Level ' + equipmentObj.itemOptions.level + ' ' + equipmentObj.itemOptions.type + ' ' +options.properties.point.join(),
		    folderName : options.properties.name,
		    image : {
			name : randImg && randImg.image || '',
			size : 50,
			top : 50,
			left : 50
		    }
		},
		item : equipmentObj.itemOptions
	    }));

	//finally callback with the equipmentObj
	return equipmentObj;
    },



    ammo : function(options,equipmentObj){
	equipmentObj.itemOptions.weight = 0.001;
    },
    arm : function(options,equipmentObj){
	equipmentObj.itemOptions.weight = equipmentObj.tileConstraints.equip.indexOf(equipmentObj.itemOptions.equip);
    },
    chest : function(options,equipmentObj){
	equipmentObj.itemOptions.weight = equipmentObj.tileConstraints.equip.indexOf(equipmentObj.itemOptions.equip);
    },
    ear : function(options,equipmentObj){
	equipmentObj.itemOptions.weight = 0.01;
    },
    foot : function(options,equipmentObj){
	equipmentObj.itemOptions.weight = equipmentObj.tileConstraints.equip.indexOf(equipmentObj.itemOptions.equip);
    },
    hand : function(options,equipmentObj){
	equipmentObj.itemOptions.weight = equipmentObj.tileConstraints.equip.indexOf(equipmentObj.itemOptions.equip);
    },
    head : function(options,equipmentObj){
	equipmentObj.itemOptions.weight = equipmentObj.tileConstraints.equip.indexOf(equipmentObj.itemOptions.equip);
    },
    leg : function(options,equipmentObj){
	equipmentObj.itemOptions.weight = equipmentObj.tileConstraints.equip.indexOf(equipmentObj.itemOptions.equip);
    },
    neck : function(options,equipmentObj){
	equipmentObj.itemOptions.weight = 0.01;
    },
    shield : function(options,equipmentObj){
	equipmentObj.itemOptions.weight = 0.01;
    },
    ring : function(options,equipmentObj){
	equipmentObj.itemOptions.weight = equipmentObj.tileConstraints.equip.indexOf(equipmentObj.itemOptions.equip)*2;
    },
    waist : function(options,equipmentObj){
	equipmentObj.itemOptions.weight = equipmentObj.tileConstraints.equip.indexOf(equipmentObj.itemOptions.equip);
    },
    weapon : function(options,equipmentObj){
	equipmentObj.itemOptions.weight = equipmentObj.tileConstraints.equip.indexOf(equipmentObj.itemOptions.equip);
    }
}))();