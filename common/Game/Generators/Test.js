if (!RPG) var RPG = {};
if (!RPG.Generator) RPG.Generator = {};

if (typeof exports != 'undefined') {
    Object.merge(RPG,require('./Utilities.js'));
    Object.merge(RPG,require('../Tiles/Utilities.js'));
    Object.merge(RPG,require('../Tiles/Tiles.js'));
    Object.merge(RPG,require('./Generators.js'));
    Object.merge(RPG,require('./Equipment.js'));
    Object.merge(RPG,require('./Consumable.js'));
    Object.merge(RPG,require('./NPC.js'));
    Object.merge(RPG,module.exports = RPG);
}

RPG.Generator.Test = new (RPG.Generator.TestClass = new Class({
    Extends : RPG.MapGeneratorBaseClass,

    name : 'Test',
    constraints : {
	properties : {
	    name : ["/^[a-zA-Z0-9_.]+$/",1,15,'Test'],
	    seed : [0,99999999999,Math.floor((Math.random() * (99999999999 - 1) + 1))],
	    height : [4,20,11],
	    width : [4,20,11],
	    level : [1,100,1],
	    Difficulty : Object.keys(RPG.Difficulty),
	    'monster%' : [0,0.5,0.1],
	    'item%' : [0,0.5,0.1],
	    'switch%' : [0,0.5,0.1],
	    'container%' : [0,0.5,0.1],
	    'trap%' : [0,0.5,0.1]
	}
    },

    generate : function(options,rand,callback){
	rand = rand || RPG.Random;
	rand.seed = Number.from(options.properties.seed) || Math.floor((Math.random() * (99999999999 - 1)));

	//create the minimum required object to be returned
	var test = {
	    tiles : {},
	    cache : {},
	    possibleStartLocations : []
	};
	options.properties.height = Math.ceil(Number.from(options.properties.height));
	options.properties.width = Math.ceil(Number.from(options.properties.width));

	//Create a room area - /common/Game/Generators/Utilities.js
	var room = RPG.getRectangleArea([0,0],[options.properties.height,options.properties.width]);

	//Select some random images for the room:
	var lawn = RPG.getRandomTileImage('terrain.earth.solid.grass',rand);
	var tree = RPG.getRandomTileImage('world.earth.tree.conifer',rand);
	var floor = RPG.getRandomTileImage('world.earth.floor',rand);
	var top = RPG.getRandomTileImage('world.earth.room.house.t',rand);
	var bottom = RPG.getRandomTileImage('world.earth.room.house.b.wall',rand);


	//Paint the room onto the map.tiles - /common/Game/Tiles/Utilities.js
	RPG.paintRoomArea(test.tiles, room, {

	    //paint wall tiles
	    'perimeter.bottoms' : RPG.createTile('world.earth.room.house.b.wall',test.cache,{
		property : {
		    tileName : bottom.name,
		    folderName : options.properties.name,
		    image : {
			name : bottom.image
		    }
		}
	    }),

	    //paint the roof tiles
	    'perimeter.tops' : RPG.createTile('world.earth.room.house.t',test.cache,{
		property : {
		    tileName : top.name,
		    folderName : options.properties.name,
		    image : {
			name : top.image
		    }
		}
	    }),

	    //paint floor tiles
	    //In this case we are using a function call instead of a direct assignment.
	    //This way you can perform operations at each point to determine what might get placed.
	    'interior.all' :  function(paintPath,area,point,index) {

		//Push the floor first.
		RPG.pushTile(test.tiles,point,
		    RPG.createTile('world.earth.floor',test.cache,{
			property : {
			    tileName : floor.name,
			    folderName : options.properties.name,
			    image : {
				name : floor.image
			    }
			}
		    })
		    );

		/**
		 * NPC Test
		 */
		if (rand.random() <= Number.from(options.properties['monster%'])) {
		    RPG.pushTile(test.tiles, point,
			RPG.createTile(['npc','earth','monster'],test.cache,{
			    //set the properties of the NPC
			    property : {

				//give this NPC a random name (needs fixing to prevent duplicaets
				tileName : RPG.Generator.Name.generate({
				    name : {
					length:rand.random(4,8),
					seed : rand.seed
				    }
				},rand),
				folderName : options.properties.name,
				image : {
				    //Select a random monster image to use
				    name : RPG.getRandomTileImage('npc.earth.monster',rand).image
				}
			    },

			    //Generate all random options.  It is a bad idea to create all random options.
			    npc : RPG.Constraints.random(RPG.Tiles.npc.options.npc,rand),

			    //Allow this Tile to roam about
			    roam : Object.merge(RPG.Constraints.random(RPG.Tiles.npc.options.roam,rand),{
				home : point
			    })
			}));
		}

		/**
		     * Switch Test
		     */

		if (rand.random() <= Number.from(options.properties['switch%'])) {
		    RPG.pushTile(test.tiles, point,
			RPG.createTile(['world','earth','lever'],test.cache,{
			    property : {
				tileName : point.join(''),
				folderName : options.properties.name,
				image : {
				    name : 'open.png'
				}
			    },
			    'switch' : {
				state : 'Open',
				states : {
				    'Open' : [{
					path : (options.properties.name+'.world.earth.lever.'+point.join('')).split('.'),
					options : JSON.encode({
					    property : {
						image : {
						    name : 'open.png'
						}
					    },
					    'switch' : {
						state : 'Open'
					    }
					})
				    }],
				    'Closed' : [{
					path : (options.properties.name+'.world.earth.lever.'+point.join('')).split('.'),
					options : JSON.encode({
					    property : {
						image : {
						    name : 'closed.png'
						}
					    },
					    'switch' : {
						state : 'Closed'
					    }
					})
				    }]
				}
			    }
			}));
		}

		/**
		 * Container Test
		 */
		if (rand.random() <= Number.from(options.properties['container%'])) {
		    RPG.pushTile(test.tiles, point,
			RPG.createTile(['world','earth','container'],test.cache,{
			    property : {
				tileName : point.join(''),
				folderName : options.properties.name
			    },
			    lockable : {
				locked : true,
				seed : rand.seed
			    }
			}));
		}

		/**
		 * Item Test
		 */
		if (rand.random() <= Number.from(options.properties['item%'])) {
		    var randGen = Object.getSRandom(RPG.Generators.Item,rand);
		    var results = RPG.Generator[randGen.key].generate({
			properties : {
			    name : options.properties.name,
			    seed : rand.seed,
			    Difficulty : options.properties.Difficulty,
			    level : options.properties.level,
			    point : point
			}
		    },rand);
		    Object.merge(test.cache,results.cache);
		    RPG.pushTile(test.tiles,point,results.path);
		}

		/**
		 * Trap Test
		 */
		if (rand.random() <= Number.from(options.properties['trap%'])) {
		    RPG.pushTile(test.tiles, point,
			RPG.createTile(['world','earth','trap'],test.cache,{
			    property : {
				tileName : point.join(''),
				folderName : options.properties.name
			    },
			    trap : {
				seed : rand.seed
			    }
			}));
		}

	    }

	});

	//allow them to start anywhere inside the room.
	test.possibleStartLocations = room.interior.all;

	//finally callback with the testObj
	callback(test);
    }
}))();