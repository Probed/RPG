Tiles
---

Here's where the fun really begins.

## `RPG.Tiles` - Tiles.js

The Tiles.js file is **generated** on the server from within `/server/Map/MapEditor.njs` so don't manually modify unless you expect your changes to get overwritten.

#### What is the Tiles.js file?

The Tiles.js file is created by recursivly traversing the `/common/Map/Tiles/` directory to generate the list of available tile options.

The resulting object is one that is identical in structure to the directory structure.

At the same time each folder is checked for an `options.js` file. If this file is found, it is imported into the current level of tiles.

Any Images `png`/`bmp`/`jpg`/`gif` found inside the folder will be pushed onto the `[tile.]options.property.image.name` option

Example:

    var tiles = {
        options : {
            /* loaded from /common/Map/Tiles/options.js */
        },
        terrain : {
            grass : {
                options : {
                    /* loaded from /common/Map/Tiles/terrain/grass/options.js if it exists */
                }
            },
            dirt : {
                options : {
                    /* loaded from /common/Map/Tiles/terrain/dirt/options.js if it exists */
                }
            }
        }
    }


## `RPG.TileType` - TileTypes.js

#### A TileType is how we define what `options` a tile has.

Each TileType returns a `constraint_options` object which can be merged into a tile's options. (see [optionConfig.md](https://github.com/Probed/RPG/tree/master/common/optionsConfig.md))

### Simple TileType example:

#### 1. Define the TileType in `TileTypes.js`

    RPG.TileType.Teleport = function(options) {
        options = options || {};
        return {
            teleportTo : Object.merge({ //merge incoming options with these options
                warn : [true], //should we warn the user they are going to be teleported
                mapName : [],  //what map name, if any, should we teleport them to
                generator : [''].append(Object.keys(require('../Generators/Generators.js').Generators)), //load a list of available generators
                               //generator is used in case no mapName is provided. this way we can generate new maps on the fly
                point : []     //the point on the map where the character should be teleported to
            },options)
        };
    }

#### 2. Create the file `/common/Map/Tiles/teleportTo.js` to handle teleportTo events.

Events executed in this order:

1. `onBeforeEnter` : before the character has moved into the tile
2. `onBeforeLeave` : before the character has left the current tiles
3. `onLeave`       : after the character has left the current tile
4. `onEnter`       : after the character has moved into the new tile

#### 3. Create an `options.js` file in the tile folder you want to give `teleportTo` properties to.

 ex: `/common/Map/Tiles/world/stair/options.js`

#### 4. Inside the `/common/Map/Tiles/world/stair/options.js` file:

    exports.options = require('../../TileTypes.js').TileType.Teleport({

       //override if nescessary, or add additional options

        warn : [false], //give no warning, just go
        generator : ['House'] //restrict to on house generators for this tile

    });

#### 5. The tile `['world','stair']` will now teleport a character to a randomly generated house with no warning.