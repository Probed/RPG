Map.njs
---

This object holds methods for interacting with a `universe`.`maps` object.

* [store](#store) **:** store all the `maps` in a `universe` in the database
* [storeCache](#storeCache) **:** store all the `maps`.`cache` in a `universe` in the database
* [storeTileset](#storeTileset) **:** store a tileset in the database
* [load](#load) **:** load a `universe`s `map` (or a tileset) contents from the database
* [listMaps](#listMaps) **:** list `universe`s `maps` for a user
* [listTilesets](#listTilesets) **:** list all tilesets
* [checkDupeTilesetName](#checkDupeTilesetName) **:** check for existing tileset name

---

<a name="store"></a>

## [store](#store) : function(`options`, `callback`)

* `options` *required*
    * `user` **:** the [User](#) making the request
    * `universe` **:** the `universe` object to look in for any `maps` to be stored
* `options` *optional*
    * `mapOrTileset` **:** `'map'` *or* `'tileset'` store as a map, or store as a tileset.
    * `category` **:** if `mapOrTileset` == `'tileset` a category is needed when storing
* *Returns*
    * `callback`(`universe` *or* `error`) **:** a universe object or a `{error:'message'}` object

A `universe` object is returned for easy merging into an existing universe.

*Example*

```javascript
RPG.Map.store({
    user : request.user,
    universe : myUniverse
}, function(universe) {
    if (universe.error) {
        console.log('Universe Error: ' + universe.error);
    } else {
        console.log('Maps Stored Successfully. Count: '+ Object.length(universe.maps));
    }
});
```

---

<a name="storeCache"></a>

## [storeCache](#storeCache) : function(`options`, `callback`)

* `options` *required*
    * `user` **:** the [User](#) making the request
    * `universe` **:** the `universe` object to look in for any `maps`.`cache` to be stored
* `options` *optional*
    * `mapOrTileset` **:** `'map'` *or* `'tileset'` store as a map, or store as a tileset.
    * `category` **:** if `mapOrTileset` == `'tileset` a category is needed when storing
* *Returns*
    * `callback`(`universe` *or* `error`) **:** a universe object or a `{error:'message'}` object

A `universe` object is returned for easy merging into an existing universe.

*Example*

```javascript
RPG.Map.storeCache({
    user : request.user,
    universe : myUniverse
}, function(universe) {
    if (universe.error) {
        console.log('Universe Error: ' + universe.error);
    } else {
        console.log('Maps Cache Stored Successfully.');
    }
});
```

---

<a name="storeTileset"></a>

## [storeTileset](#storeTileset) : function(`options`, `callback`)

* `options` *required*
    * `user` **:** the [User](#) making the request
    * `tilesetMap` **:** the `map` object to store as a tileset

* *Returns*
    * `callback`(fake `universe` *or* `error`) **:** a faked universe object or a `{error:'message'}` object

A faked `universe` object is returned for easy merging into an existing universe.

*Example*

```javascript
RPG.Map.storeTileset({
    user : request.user,
    tilesetMap : myMap
}, function(universe) {
    if (universe.error) {
        console.log('Universe Error: ' + universe.error);
    } else {
        console.log('Tileset Stored Successfully.');
    }
});
```


---

<a name="load"></a>

## [load](#load) : function(`options`, `callback`)

* `options` *required*
    * `user` **:** the [User](#) making the request
    * `universeID` *or* `universeName` **:** what universe the map belong to
    * `mapID` *or* `mapName` **:** load the specified map into the universe

* `options` *optional*
    * `tilePoints` **:** load the specified tiles into the map
    * `mapOrTileset` **:** `'map'` *or* `'tileset'` store as a map, or store as a tileset.


* *Returns*
    * `callback`(`universe` *or* `error`) **:** a universe object or a `{error:'message'}` object

*Example* Load universe #1 with map #1 and tile [0,0]

```javascript
RPG.Map.load({
    user : request.user,
    universeID : 1,
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

<a name="listMaps"></a>

## [listMaps](#listMaps) : function(`options`, `callback`)

* `options` *required*
    * `user` **:** the [User](#) making the request
    * `universeID` *or* `universeName` **:** what universe to list the maps of

* *Returns*
    * `callback`(`maplist` *or* `error`) **:** a maplist object or a `{error:'message'}` object

*Example*

```javascript
RPG.Map.listMaps({
    user : request.user,
}, function(maplist) {
    if (maplist.error) {
        console.log('Map Listing Error: ' + maplist.error);
    } else {
        console.log('Map List Loaded Successfully. Count: '+ Object.length(maplist));
    }
});
```


---

<a name="listTilesets"></a>

## [listTilesets](#listTilesets) : function(`options`, `callback`)

* `options` *required*
    * `none`

* *Returns*
    * `callback`(`tilesetlist` *or* `error`) **:** a tilesetlist object or a `{error:'message'}` object

*Example*

```javascript
RPG.Map.listTilesets({
    user : request.user,
}, function(tilesetlist) {
    if (tilesetlist.error) {
        console.log('Tilesets Listing Error: ' + tilesetlist.error);
    } else {
        console.log('Tilesets List Loaded Successfully.');
    }
});
```

---

<a name="checkDupeTilesetName"></a>

## [checkDupeTilesetName](#checkDupeTilesetName) : function(`options`, `callback`)

* `options` *required*
    * `user` **:** the [User](#) making the request
    * `name` **:** what tileset name to check

* `options` *optional*
    * `universe` *or* `universeID` **:** ignore this universe in the check

* *Returns*
    * `callback`(`dupeName` *or* `null`) **:** `dupeName` if a dupe was found, or `null` if all good.

*Example*

```javascript
RPG.Map.checkDupeTilesetName({
    user : request.user,
    universeName : 'Test'
}, function(dupeName) {
    if (dupeName) {
        console.log('Universe Name Taken: ' + dupeName.error);
    } else {
        console.log('Universe Name Available');
    }
});
```