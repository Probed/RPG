[Universe](#Universe) / [Map](#Map) / [Map.cache](#MapCache) / [Map.tiles](#MapTiles) / [Example Universe](#ExampleUniverse)
---

The Top most object is called a `universe` which will contain everything for that universe.

Each `universe` has (at the moment) 2 object inside it:

* `options` : stuff about the `universe`
* `maps` : collection of maps by `mapName`

<a name="#Universe"></a>

## Universe

The most basic `universe` looks like this:

    var universe = {
        options : {
            /* options populated using RPG.universe_options and /common/optionsConfig.js */
        },
        maps : {
            'StartMap' : {
                options : {
                    /* options populated using RPG.map_options and /common/optionsConfig.js */
                },
                cache : {}, //more on this later
                tiles : {}, //more on this later
            }
       }
    }


<a name="#Map"></a>

## Map

The most basic `map` looks like this:

    var map = {
        options : {
            /* options populated using RPG.map_options and /common/optionsConfig.js */
        },
        cache : {}, //map.cache holds actual tiles
        tiles : {}, //map.tiles 2d object with tile paths
    };

<a name="#MapCache"></a>

## Map.cache

A `map.cache` is where all the actual tiles get stored. Since a `map` can have multiple 'grass' tiles we store a single 'grass' tile in the cache and paint a `path` to the cached object onto `map.tiles`

A Simple `map.cache` might look like this:

    var cache = {
        terrain : {
            grass : {
                options : {
                    /* read more about tile options in /common/Map/Tiles */
                }
            },
            dirt : {
               options : {
                    /* read more about tile options in /common/Map/Tiles */
                }
             }
         }
    };

And the `path` we paint to the `map.tiles` is

    var grass = ['terrain','grass'];
    var dirt = ['terrain','dirt'];

<a name="#MapTiles"></a>

## Map.tiles

The `map.tiles` is a simple 2d object containing `paths` to cached tiles.

    var grass = ['terrain','grass'];
    var dirt = ['terrain','dirt'];

    var tiles = {
        1 : { /*row1*/
            1 : [grass,dirt[,...]]   /*row1 col1*/
            2 : [grass[,...]],       /*row1 col2*/
            3 : [grass,dirt[,...]],  /*row1 col3*/
            ...
        },
        2 : { /*row2*/
            1 : [grass,dirt[,...]],  /*row2 col1*/
            2 : [grass,dirt[,...]],  /*row2 col2*/
            ...
        }
        ...
    }


<a name="#ExampleUniverse"></a>

## Here is an example of a simple one tile universe:

    var universe = {
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
                        1 : [['SampleFolder','terrain','grass','SampleTileName']]
                    }
                },
                cache : {
                    SampleFolder : {
                        terrain : {
                            grass : {
                                SampleTileName : {
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
