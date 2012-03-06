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

Each TileType returns a `option_constraints` object which can be merged into a tile's options. (see [optionConfig.md](https://github.com/Probed/RPG/tree/master/common/optionsConfig.md))

### Simple TileType example:

---
##### 1. Define the TileType `Teleport` in [TileTypes.js](https://github.com/Probed/RPG/tree/master/common/Map/Tiles/TileTypes.js)

    RPG.TileType.Teleport = function(options) {
        options = options || {};
        return {
            teleportTo : Object.merge({ //merge incoming options with these options
                warn : [true], //should we warn the user they are going to be teleported
                mapName : [],  //what map name, if any, should we teleport them to
                point : [],    //the point on the map where the character should be teleported to

                generator : [''].append(Object.keys(require('../Generators/Generators.js').Generators)),
                               //loads a list of available generators
                               //generator is used in case no mapName is provided.
                               //this way we can generate new maps on the fly
            },options)
        };
    }

---
##### 2. Create the file `/common/Map/Tiles/teleportTo.js` to handle `teleportTo` events.

Events executed in this order:

1. `onBeforeEnter` : before the character has moved into the tile
2. `onBeforeLeave` : before the character has left the current tiles
3. `onLeave`       : after the character has left the current tile
4. `onEnter`       : after the character has moved into the new tile

---
##### 3. Create an `options.js` file in the tile folder you want to give `teleportTo` properties to.

 ex: `/common/Map/Tiles/world/stair/options.js`

---
##### 4. Inside the `options.js` file you just created we need to import the TileType and specify any overriding options:

In this case we are overriding the `warn` and `generator` option

    exports.options = require('../../TileTypes.js').TileType.Teleport({
        warn : [false],       //give no warning, just go
        generator : ['House'] //restrict to only the house generator for this tile
    });

---
##### 5. The tile path `['world','stair']` will now teleport a character to a randomly generated house with no warning.

The Tile will also be updated with the generated `mapName` and `point` so a new map will not be generated the next time around.

---
##### 6. Create and Place the tile

Using [RPG.createTile](#createTile) and [RPG.pushTile](#pushTile) we can easily place our new tile on a Map. Any options not specified in the createTile call will resort to defaults.

    var map = {
        cache : {},
        tiles : {}
    };
    RPG.pushTile(map.tiles,[0,0],
        RPG.createTile(['world','stair'],map.cache,{
            property : {
               tileName : 'Stairs',
               folderName : 'teleporters',
               image : {
                   name : 'stair.png'
               }
            }
        })
    );


<a name="Utilities"></a>

#[Utilities.js](https://github.com/Probed/RPG/tree/master/common/Map/Tiles/Utilities.js)

This file adds a number of necessary functions for manipulating individual [Tiles](#Tiles), [Map.tiles](https://github.com/Probed/RPG/tree/master/common/Map/) and [Map.cache](https://github.com/Probed/RPG/tree/master/common/Map/)

* `Map.cache`
    * [RPG.createTile](#createTile) - use the given tile `options` to create a tile `path` in the given `cache` and return the new `path`
    * [RPG.cloneTile](#cloneTile) - clone a tile `path` including its `cache`d object at a given `point` and return the clone `path`

* `Map.tiles`
    * [RPG.pushTile](#pushTile) - push a tile `path` onto the given `point`
    * [RPG.pushTiles](#pushTiles) - push a list of tile `paths` onto the given `point`
    * [RPG.appendTile](#appendTile) - append a tile `path` to the given `point`
    * [RPG.setTile](#setTile) - overwrite all existing tile paths with the give tile `path` at the given `point`
    * [RPG.unshiftTile](#unshiftTile) - unshift a tile `path` into the given `point`
    * [RPG.replaceTile](#replaceTile) - replaces the given tile `path` with a new tile `path` at the given `point`
    * [RPG.removeAllTiles](#removeAllTiles) - empty a given `point` of all tile paths
    * [RPG.removeTile](#removeTile) - remove the given tile `path` from a `point`
    * [RPG.blockTiles](#blockTiles) - place a 'blocked' tile path at the given `points`
    * [RPG.isTileBlocked](#isTileBlocked) - checks to see if a tile at the given `point` has the tile path 'blocked'
    * [RPG.orientTiles](#orientTiles) - for each tile `callback` with `orientation` for the given tile `path`
    * [RPG.tilesContainsPath](#tilesContainsPath) - returns true/false if a tile `path` exists at a given `point`
    * [RPG.tilesContainsPartialPath](#tilesContainsPartialPath) - returns true/false if a partial tile `path` exists at a given `point`
    * [RPG.offsetTiles](#offsetTiles) - offset the location of `Map.tiles` in the given `direction`s by the `offset` values
    * [RPG.mergeTiles](#mergeTiles) - take an array of `Map.tiles` and merge them into a single `Map.tiles`
    * [RPG.paintPoints](#paintPoints) - push the given tile `paths` to each `point` supplied
    * [RPG.paintAreas](#paintAreas) - calls `RPG.paintArea` for each given `area` with the given `areaPaths` object descriptors ([More](#) on `areaPaths`)
    * [RPG.paintArea](#paintArea) - paint the given `Map.tiles` with the `areaPaths` object descriptors mapped onto the given `area` ([More](#) on `areaPaths`)
    * [RPG.paintRoomArea](#paintRoomArea) - paint `Map.tiles` with the `areaPaths` object descriptors mapped onto the given `rooms` ([More](#) on `areaPaths`)
    * [RPG.moveCharacterToTile](#moveCharacterToTile) - move events trigger [TileType](#TileTypes) handlers for each event onEnter, onLeave etc


* tile `Path`
    * [RPG.getMapTileStyles](#getMapTileStyles) - returns a styles object which can be applied to an Element to display a set of tiles
    * [RPG.triggerTileTypes](#triggerTileTypes) - merges tiles into one tile and passes control to a [TileType](#TileTypes) handler
    * [RPG.tileFolderList](#tileFolderList) - retrieve available child tile names.
    * [RPG.getTileDefaults](#getTileDefaults) - retrieve default filled `options` object for a Tile
    * [RPG.getTileOrientation](#getTileOrientation) - returns an `orientation` value of a tile `path` at the given `point`
    * [RPG.getAboveBelowLeftRight](#getAboveBelowLeftRight) - returns an object specifying if the given tile `path`, at the given `point`, has neighbors of the same tile `path`

---

<a name="createTile"></a>
---
#### function `RPG.createTile`(`path`,`cache`,`options`)

This function inserts a tile into the `cache` and returns a `new path` for the tile.

* Notes:
    * All `options` must contain a `property.tileName` and `property.folderName` or an exception is raised
    * This only returns a tile `path` it does not add the tile to `map.tiles` in any way.

* **Input**
    * `path` : raw tile path ex: ['terrain','grass']
    * `cache` : the `map.cache` object where the tile will be created in
    * `options` : the `options` for the tile
* **Output**
    * `new path` : a new tile path which contains a folder name and tile name. ex ['folderName','terrain','grass','tileName']

Example usage:

    var map : {
            cache : {}
            tiles : {}
    };
    var path = RPG.createTile(['terrain','grass'],map.cache,{
                   property : {
                       tileName : 'Name',
                       folderName : 'Folder'
                   }
               });
    //path = ['Folder','terrain','grass','Name']

<a name="cloneTile"></a>
---
#### function `RPG.cloneTile`(`tiles`,`clonePath`,`point`,`cache`,`options`)

This function takes an existing tile overriding any of the existing tiles `options` with the input `options`  and calls `RPG.createTile` to make the cloned tile. Finally the `new path` is returned

* Notes:
    * This only returns a tile `path` it does not add the tile to `map.tiles` in any way.

* **Input**
    * `tiles` : `map.tiles` object
    * `clonePath` : tile path to be cloned ex: ['folderName','terrain','grass','tileName']
    * `point` : the point in `map.tiles` ex: [0,0]
    * `cache` : the `map.cache` object where the tile will be created in
    * `options` : the overriding `options` for the new cloned tile
* **Output**
    * `new path` : a new tile path which contains a folder name and tile name. ex ['folderName','terrain','grass','tileName']

Example usage:

    var map : {
            cache : { terrain : { grass : { options : { property : { tileName : 'tileName', folderName : 'folderName' }}}}}
            tiles : { 1 : { 1 : [['folderName','terrain','grass','tileName']] }}
    };
    var path = RPG.cloneTile(map.tiles,['folderName','terrain','grass','tileName'],[1,1],map.cache,{
                   property : {
                       tileName : 'newTileName',
                       folderName : 'newFolderName'
                   }
               });
    //path = ['newTileName','terrain','grass','newFolderName']


## `Maps.tiles` modifying functions

<a name="pushTile"></a>
---
#### function `RPG.pushTile`(`tiles`,`point`,`path`)

This function is similar to array.push() and pushes a the tile `path` into the map.`tiles` at the given `point`

* **Input**
    * `tiles` : `map.tiles` object
    * `point` : the point in `map.tiles` ex: [0,0]
    * `path` : tile path to be pushed ex: ['folderName','terrain','grass','tileName']
* **Output**
    * none (the `tiles` object is modified directly)

Example usage:

    var map : {
            cache : {}
            tiles : {}
        };
    RPG.pushTile(map.tiles,[1,1],
        RPG.createTile(['terrain','grass'],map.cache,{
            property : {
                tileName : 'tileName',
                folderName : 'folderName'
            }
        })
    );
    Results:
    map : {
        cache : { terrain : { grass : { options : { property : { tileName : 'tileName', folderName : 'folderName' }}}}}
        tiles : { 1 : { 1 : [['folderName','terrain','grass','tileName']] }}
    };


<a name="pushTiles"></a>
<a name="appendTile"></a>
<a name="setTile"></a>
<a name="unshiftTile"></a>
<a name="replaceTile"></a>
<a name="removeAllTiles"></a>
<a name="blockTiles"></a>
<a name="isTileBlocked"></a>
<a name="orientTiles"></a>
<a name="tilesContainsPath"></a>
<a name="tilesContainsPartialPath"></a>
<a name="offsetTiles"></a>
<a name="mergeTiles"></a>
<a name="paintPoints"></a>
<a name="paintAreas"></a>
<a name="paintArea"></a>
<a name="paintRoomArea"></a>
<a name="moveCharacterToTile"></a>

## tile `paths` functions
<a name="getMapTileStyles"></a>
<a name="triggerTileTypes"></a>
<a name="tileFolderList"></a>
<a name="getTileDefaults"></a>
<a name="getTileOrientation"></a>
<a name="getAboveBelowLeftRight"></a>
