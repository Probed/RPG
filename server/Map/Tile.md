Tile.njs
---

This object holds methods for interacting with a `map`.`tiles` object.

* [storeTiles](#storeTiles) **:** store all the `maps` in a `universe` in the database
* [load](#load) **:** load specified tiles into a `map`.`tiles`
* [loadTilesCache](#loadTilesCache) **:** load tile caches into a `map`.`cache`
* [getViewableTiles](#getViewableTiles) **:** determine character sight radius and load those tiles


---

<a name="storeTiles"></a>

## [storeTiles](#storeTiles) : function(`options`, `callback`)

* `options` *required*
    * `user` **:** the [User](#) making the request
    * `universe` **:** the `universe` object to look in for any `map`.`tiles` to be stored

* `options` *optional*
    * `mapOrTileset` **:** `'map'` *or* `'tileset'` store as a map, or store as a tileset.

* *Returns*
    * `callback`(`universe` *or* `error`) **:** a universe object or a `{error:'message'}` object

A `universe` object is returned for easy merging into an existing universe.

*Example*

```javascript
RPG.Tile.storeTiles({
    user : request.user,
    universe : myUniverse
}, function(universe) {
    if (universe.error) {
        console.log('Universe Error: ' + universe.error);
    } else {
        console.log('Tiles Stored Successfully.');
    }
});
```


---

<a name="load"></a>

## [load](#load) : function(`options`, `callback`)

* `options` *required*
    * `user` **:** the [User](#) making the request
    * `character` *or* `mapID` *or* `mapName` **:** load the specified map into the universe
    * `tilePoints` **:** load the specified tiles into the map

* `options` *optional*
    * `mapOrTileset` **:** `'map'` *or* `'tileset'` store as a map, or store as a tileset.


* *Returns*
    * `callback`(`universe` *or* `error`) **:** a universe object or a `{error:'message'}` object

*Example* Load map #1 and tile [0,0]

```javascript
RPG.Tile.load({
    user : request.user,
    mapID : 1,
    tilePoints : [[0,0]]
}, function(universe) {
    if (universe.error) {
        console.log('Universe Error: ' + universe.error);
    } else {
        console.log('Universe Map Loaded Successfully.');
    }
});
```


---

<a name="load"></a>

## [loadTilesCache](#loadTilesCache) : function(`options`, `callback`)

* `options` *required*
    * `user` **:** the [User](#) making the request
    * `character` *or* `mapID` *or* `mapName` **:** load the specified map into the universe
    * `paths` **:** eg `[['terrain','grass'],['terrain','dirt']]`

* `options` *optional*
    * `mapOrTileset` **:** `'map'` *or* `'tileset'` store as a map, or store as a tileset.


* *Returns*
    * `callback`(`maps.cache` *or* `error`) **:** a `maps`.`cache` object or a `{error:'message'}` object

Called by [load](#load).



---

<a name="getViewableTiles"></a>

## [getViewableTiles](#getViewableTiles) : function(`options`, `callback`)

* `options` *required*
    * `user` **:** the [User](#) making the request
    * `character` **:** the `character` to calculate the sight radius for
    * `universe` **:** the `universe` object to look in for any `map`.`tiles`

* *Returns*
    * `callback`(`universe` *or* `error`) **:** a universe object or a `{error:'message'}` object

A `universe` object is returned for easy merging into an existing universe.

*Example*

```javascript
RPG.Tile.getViewableTiles({
    user : request.user,
    character : myCharacter,
    universe : myUniverse
}, function(universe) {
    if (universe.error) {
        console.log('Universe Error: ' + universe.error);
    } else {
        console.log('Got Viewable Tiles.');
    }
});
```