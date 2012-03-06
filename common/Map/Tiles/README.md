[Tiles](#Tiles), [TileTypes](#TileTypes), [Utilities](#Utilities)
--

<a name="Tiles"></a>

## `RPG.Tiles` - [Tiles.js](https://github.com/Probed/RPG/tree/master/common/Map/Tiles/Tiles.js)

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



<a name="TileTypes"></a>

## `RPG.TileType` - [TileTypes.js](https://github.com/Probed/RPG/tree/master/common/Map/Tiles/TileTypes.js)

#### A TileType is how we define what `options` a tile has.

Each TileType returns a `constraint_options` object which can be merged into a tile's options. (see [optionConfig.md](https://github.com/Probed/RPG/tree/master/common/optionsConfig.md))

### Simple TileType example:

---
##### 1. Define the TileType `Teleport` in [TileTypes.js](https://github.com/Probed/RPG/tree/master/common/Map/Tiles/TileTypes.js)

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

---
##### 2. Create the file `/common/Map/Tiles/teleportTo.js` to handle teleportTo events.

Events executed in this order:

1. `onBeforeEnter` : before the character has moved into the tile
2. `onBeforeLeave` : before the character has left the current tiles
3. `onLeave`       : after the character has left the current tile
4. `onEnter`       : after the character has moved into the new tile

---
##### 3. Create an `options.js` file in the tile folder you want to give `teleportTo` properties to.

 ex: `/common/Map/Tiles/world/stair/options.js`

---
##### 4. Inside the `/common/Map/Tiles/world/stair/options.js` file:

    exports.options = require('../../TileTypes.js').TileType.Teleport({

        //override if nescessary, or add additional options

        warn : [false], //give no warning, just go
        generator : ['House'] //restrict to on house generators for this tile

    });

---
##### 5. The tile path `['world','stair']` will now teleport a character to a randomly generated house with no warning.

The Tile will also be updated with the generated `mapName` and `point` so a new map will not be generated the next time around.



<a name="Utilities"></a>

#[Utilities.js](https://github.com/Probed/RPG/tree/master/common/Map/Tiles/Utilities.js)

This file adds a number of necessary functions for manipulating individual [Tiles](#Tiles) and [Map.tiles](https://github.com/Probed/RPG/tree/master/common/Map/README.md)

* [RPG.getMapTileStyles](#getMapTileStyles) - returns a styles object which can be applied to an Element to display a set of tiles
* [RPG.triggerTileTypes](#triggerTileTypes) - merges tiles into one tile and passes control to a [TileType](#TileTypes) handler
* [RPG.moveCharacterToTile](#moveCharacterToTile) - move events trigger [TileType](#TileTypes) handlers for each event onEnter, onLeave etc
* [RPG.tileFolderList](#tileFolderList) - retrieve available child tile names.
* [RPG.getTileDefaults](#getTileDefaults) - retrieve default filled `options` object for a Tile
* [RPG.createTile](#createTile) - use the given `options` to create a tile `path` in the given `cache` and return the new `path`
* [RPG.cloneTile](#cloneTile) - clone a tile `path` at a given `point`
* [RPG.removeAllTiles](#removeAllTiles) - empty a given `point` of all tile paths
* [RPG.removeTile](#removeTile) - remove the given tile `path` from a `point`
* [RPG.pushTile](#pushTile) - push a tile `path` onto the given `point`
* [RPG.pushTiles](#pushTiles) - push a list of tile `paths` onto the given `point`
* [RPG.appendTile](#appendTile) - append a tile `path` to the given `point`
* [RPG.setTile](#setTile) - overwrite all existing tile paths with the give tile `path` at the given `point`
* [RPG.unshiftTile](#unshiftTile) - unshift a tile `path` into the given `point`
* [RPG.replaceTile](#replaceTile) - replaces the given tile `path` with a new tile `path` at the given `point`
* [RPG.blockTiles](#blockTiles) - place a 'blocked' tile path at the given `points`
* [RPG.isTileBlocked](#isTileBlocked) - checks to see if a tile at the given `point` has the tile path 'blocked'
* [RPG.getTileOrientation](#getTileOrientation) - returns an `orientation` value of a tile `path` at the given `point`
* [RPG.orientTiles](#orientTiles) - for each tile `callback` with `orientation` for the given tile `path`
* [RPG.getAboveBelowLeftRight](#getAboveBelowLeftRight) - returns an object specifying if the given tile `path`, at the given `point`, has neighbors of the same tile `path`
* [RPG.tilesContainsPath](#tilesContainsPath) - returns true/false if a tile `path` exists at a given `point`
* [RPG.tilesContainsPartialPath](#tilesContainsPartialPath) - returns true/false if a partial tile `path` exists at a given `point`
* [RPG.offsetTiles](#offsetTiles) - offset the location of `Map.tiles` in the given `direction`s by the `offset` values
* [RPG.mergeTiles](#mergeTiles) - take an array of `Map.tiles` and merge them into a single `Map.tiles`
* [RPG.paintPoints](#paintPoints) - push the given tile `paths` to each `point` supplied
* [RPG.paintAreas](#paintAreas) - calls `RPG.paintArea` for each given `area` with the given `areaPaths` object descriptors ([More](#) on `areaPaths`)
* [RPG.paintArea](#paintArea) - paint the given `Map.tiles` with the `areaPaths` object descriptors mapped onto the given `area` ([More](#) on `areaPaths`)
* [RPG.paintRoomArea](#paintRoomArea) - paint `Map.tiles` with the `areaPaths` object descriptors mapped onto the given `rooms` ([More](#) on `areaPaths`)


