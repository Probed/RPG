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
    Extends : RPG.GeneratorBaseClass,

    name : 'Example',
    constraints : {
        example : {
            name : ["/^[a-zA-Z0-9_.]+$/",1,15,'Example'],
            seed : [0,99999999999,Math.floor((Math.random() * (99999999999 - 1) + 1))],
            height : [1,10,5],
            width : [1,10,5]
        }
    },

    generate : function(options,rand,callback){
        rand = rand || RPG.Random;
        rand.seed = Number.from(options.example.seed) || Math.floor((Math.random() * (99999999999 - 1);

        //create the minimum required object to be returned
        var exampleObj = {
            tiles : {},
            cache : {},
            possibleStartLocations : []
        };
        options.example.height = Number.from(options.example.height);
        options.example.width = Number.from(options.example.width);

        var x = 0;
        var y = 0;

        //Create a room area from /common/Map/Generators/Utilities.js
        var room = RPG.getRectangleArea([0,0],[options.example.height,options.example.width]);

        //Paint the room onto the map.tiles
        RPG.paintRoomArea(exampleObj.tiles, room, {

            //paint wall tiles
            'perimeter.bottoms' : RPG.createTile(['wall'],exampleObj.cache,{
                property : {
                    tileName : 'Wall',
                    folderName : options.example.name,
                    image : {
                        name : 'wall.png'
                    }
                }
            }),

            //paint the roof tiles
            'perimeter.tops' : RPG.createTile(['roof'],example.cache,{
                property : {
                    tileName : 'Roof',
                    folderName : options.example.name,
                    image : {
                        name : 'roof.png'
                    }
                }
            }),

            //paint floor tiles
            'interior.all,path,openings' : RPG.createTile(['floor'],example.cache,{
                property : {
                    tileName : 'Floor'
                    folderName : options.example.name,
                    image : {
                        name : 'floor.png'
                    }
                }
            })
        });

        //finally callback with the exampleObj
        callback(exampleObj);
    }
}
```