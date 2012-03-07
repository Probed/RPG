[Universe](#Universe) / [Map](#Map) / [Map.cache](#MapCache) / [Map.tiles](#MapTiles) / [Example Universe](#ExampleUniverse)
---

The Top most object is called a `universe` which will contain everything for that universe.

Each `universe` has (at the moment) 2 object inside it:

* `options` : stuff about the `universe`
* `maps` : collection of maps by `mapName`

<a name="Universe"></a>

## Universe

The most basic `universe` looks like this:

```javascript
var universe = {
    options : { /* options populated using RPG.universe_options and /common/optionsConfig.js */ },
    maps : { /* collection of Maps. see below Map*/}
}
```


<a name="Map"></a>

## Map

The most basic `map` looks like this:

```javascript
var map = {
    options : { /* options populated using RPG.map_options and /common/optionsConfig.js */ },
    cache : {}, //map.cache holds actual tiles
    tiles : {}, //map.tiles 2d object with tile paths
};
```

<a name="MapCache"></a>

## Map.cache

A `map.cache` is where all the actual tiles get stored. Since a `map` can have multiple 'grass' tiles we store a single 'grass' tile in the cache and paint a `path` to the cached object onto `map.tiles`

A Simple `map.cache` might look like this:

```javascript
var cache = {
    'terrain' : {
        options : { /* read more in /common/Map/Tiles */ }
        'grass' : {
            options : { /* read more in /common/Map/Tiles */ }
        },
        'dirt' : {
            options : { /* read more in /common/Map/Tiles */ }
        }
    }
};
```

And the `path` we paint to the `map.tiles` is

```javascript
var grassPath = ['terrain','grass'];
var dirtPath = ['terrain','dirt'];

//Retrieve a cached tile
var grassTile = Object.getFromPath(cache,grassPath);
```

<a name="MapTiles"></a>

## Map.tiles

The `map.tiles` is a simple 2d object containing `paths` to cached tiles.

```javascript
var grassPath = ['terrain','grass'];
var dirtPath = ['terrain','dirt'];

var tiles = {
    1 : { /*row1*/
        1 : [dirtPath, grassPath[,...]]   /*row1 col1*/
        2 : [dirtPath[,...]],             /*row1 col2*/
        3 : [dirtPath, grassPath[,...]],  /*row1 col3*/
        ...
    },
    2 : { /*row2*/
        1 : [dirtPath,grassPath[,...]],  /*row2 col1*/
        2 : [dirtPath,[,...]],           /*row2 col2*/
        ...
    }
    ...
}
```


<a name="ExampleUniverse"></a>

## Here is an example of a simple one tile universe:

```javascript

/*
 * 1. Initialize a universe. For this example the user enters these universe options:
 *        universeName : 'Sample Universe'
 *        author : 'Sample',
 */
var universe = Object.clone(RPG.universe);

//Retrieve input table to fill out the universe options:
var htmlOptionsTable = RPG.optionCreator.getOptionTable(RPG.universe_options,null,null,null,'uni_opts'); // /common/optionConfig.js

//After the user has completed entering thier options:
universe.options = RPG.optionCreator.getOptionsFromTable(RPG.universe,null,null,null,'uni_opts'); // /common/optionConfig.js

//Validate the options
var errors = RPG.optionValidator.validate(RPG.universe_options,universe.options); // /common/optionConfig.js


/*
 * 2. Repeat the above steps to add our first map. For this example the user enters these map options
 *        mapName : 'StartMap'
 *        author : 'Sample'
 */
var map = Object.clone(RPG.map);

//Retrieve input table to fill out the map options
var htmlOptionsTable = RPG.optionCreator.getOptionTable(RPG.map_options,null,null,null,'map_opts'); // /common/optionConfig.js

//After the user has completed entering thier options:
map.options = RPG.optionCreator.getOptionsFromTable(RPG.map,null,null,null,'map_opts'); // /common/optionConfig.js

//Validate the options
var errors = RPG.optionValidator.validate(RPG.map_options,map.options); // /common/optionConfig.js


/*
 * 3. Insert the map into the universe and set some universe options
 */
universe.maps[map.property.mapName] = map;
universe.options.property.activeMap = map.property.mapName;
universe.options.settings.startMap = map.property.mapName;


/*
 * 4. Add a Tile to the universe
 */
RPG.pushTile(map.tiles,[0,0], //push the tile path onto the map.tiles at x:0 y:0
    RPG.createTile(['terrain','grass'],map.cache,{  //create the tile in the map.cache
        property : {
            tileName : 'SampleTileName',
            folderName : 'SampleFolderName',
            image : {
                name : 'grass.png'
            }
        }
    })
);


//Final Universe Result:
universe : {
    options : {
        property : {
            universeName : 'Sample Universe',
            author : 'Sample',
            activeMap : 'StartMap'
        },
        settings : {
            startMap : 'StartMap'
        }
    },
    maps : {
       'StartMap' : {
            options : {
                mapName : 'StartMap',
                author : 'Sample'
            },
            tiles : {
                1 : {
                    1 : [['SampleFolderName','terrain','grass','SampleTileName']]
                }
            },
            cache : {
                'SampleFolderName' : {
                     'terrain' : {
                         'grass' : {
                             'SampleTileName' : {
                                 options : {
                                     property : {
                                         tileName : 'SampleTileName',
                                         folderName : 'SampleFolderName'
                                         image : {
                                             name : 'grass.png'
                                         }
                                     }
                                 }
                             }
                         }
                     }
                 }
             }
         }
     }
}
```
