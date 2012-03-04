Tiles
---

Here's where the fun really begins.

## Tiles.js aka `RPG.Tiles`

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


The `options` objects are populated using `RPG.optionCreator` in `/common/optionConfig.js`