Map Map Map Map Map Map etc
---

The Top most object is called a `universe` which will contain everything for that universe.

Each `universe` has (at the moment) 2 object inside it:
1. `options` : stuff about the universe
2. `maps` : collection of maps by map name

## Universe

The most basic universe looks like this:

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

## Maps

The most basic map looks like this:

    var map = {
	options : {
	    /* options populated using RPG.map_options and /common/optionsConfig.js */
	},
	cache : {}, //more on this later
	tiles : {}, //more on this later
    };

## Cache

A map Cache is where all the created tiles get stored. Since a map can have multiple 'grass' tiles we store a single 'grass' tile in the cache and paint a `path` to the cached object onto the map.

A Simple Cache might look like this:

    var cache = {
        terrain : {
            grass : {
                options : {
                    /* read more about tile options in /common/Map/Tiles */
                }
            }
         }
    };

And the Path we paint to the map tiles is

    var path = ['terrain','grass'];

