Generators
---

Generators are Classes that will create generated results based on supplied `options`

All Map Generators should **Extend** `RPG.GeneratorBaseClass` or provide equal functionality.

Example Generator File

```javascript
if (!RPG) var RPG = {};
if (!RPG.Generator) RPG.Generator = {};

if (typeof exports != 'undefined') {
    Object.merge(RPG,require('./Utilities.js'));
    Object.merge(RPG,require('../Tiles/Utilities.js'));
    Object.merge(RPG,require('../Tiles/Tiles.js'));
    Object.merge(RPG,require('./Generators.js'));
    module.exports = RPG;
}

RPG.Generator.Example = new (RPG.Generator.ExampleClass = new Class({
    Extends : RPG.MapGeneratorBaseClass,

    name : 'Example',
    constraints : {
	properties : {
	    name : ["/^[a-zA-Z0-9_.]+$/",1,15,'Example'],
	    seed : [0,99999999999,Math.floor((Math.random() * (99999999999 - 1) + 1))],
	    height : [4,20,11],
	    width : [4,20,11],
	    'monster%' : [0,1,0.5] //percent chance of monster per floor
	}
    },

    generate : function(options,rand,callback){
	rand = rand || RPG.Random;
	rand.seed = Number.from(options.properties.seed) || Math.floor((Math.random() * (99999999999 - 1)));

	//create the minimum required object to be returned
	var example = {
	    tiles : {},
	    cache : {},
	    possibleStartLocations : []
	};
	options.properties.height = Number.from(options.properties.height);
	options.properties.width = Number.from(options.properties.width);

	//Create a room area - /common/Game/Generators/Utilities.js
	var room = RPG.getRectangleArea([0,0],[options.properties.height,options.properties.width]);

	//Select some random images for the room:
	var lawn = RPG.getRandomTileImage('terrain.earth.solid.grass',rand);
	var tree = RPG.getRandomTileImage('world.earth.tree.conifer',rand);
	var floor = RPG.getRandomTileImage('world.earth.floor',rand);
	var top = RPG.getRandomTileImage('world.earth.room.house.t',rand);
	var bottom = RPG.getRandomTileImage('world.earth.room.house.b.wall',rand);


	//Paint the room onto the map.tiles - /common/Game/Tiles/Utilities.js
	RPG.paintRoomArea(example.tiles, room, {

	    //paint wall tiles
	    'perimeter.bottoms' : RPG.createTile('world.earth.room.house.b.wall',example.cache,{
		property : {
		    tileName : bottom.name,
		    folderName : options.properties.name,
		    image : {
			name : bottom.image
		    }
		}
	    }),

	    //paint the roof tiles
	    'perimeter.tops' : RPG.createTile('world.earth.room.house.t',example.cache,{
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
		RPG.pushTile(example.tiles,point,
		    RPG.createTile('world.earth.floor',example.cache,{
			property : {
			    tileName : floor.name,
			    folderName : options.properties.name,
			    image : {
				name : floor.image
			    }
			}
		    })
		    );

		//Now Randomly determine if an NPC will be generated at this point
		//in this case there is a 5% chance per tile that a monster will be created
		if (rand.random() <= Number.from(options.properties['monster%'])) {
		    RPG.pushTile(example.tiles, point,
			RPG.createTile(['npc','earth','monster'],example.cache,{
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
			    npc : RPG.optionCreator.random(RPG.Tiles.npc.options.npc,rand),

			    //Allow this Tile to roam about
			    roam : Object.merge(RPG.optionCreator.random(RPG.Tiles.npc.options.roam,rand),{
				home : point
			    })
			}));

		}
	    }
	});

	//allow them to start anywhere inside the room.
	example.possibleStartLocations = room.interior.all;

	//finally callback with the exampleObj
	callback(example);
    }
}))();
```