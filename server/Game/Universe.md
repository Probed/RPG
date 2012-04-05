Universe.njs
---

This object holds methods for interacting with a `universe` object.

* [store](#store) **:** store all the contents of a `universe` into the database
* [load](#load) **:** load a `universe`s contents from the database
* [list](#list) **:** list `universe`s for a user
* [checkDupeName](#checkDupeName) **:** check for existing universe name

---

<a name="store"></a>

## [store](#store) : function(`options`, `callback`)

If any `maps` exist within the universe they will be stored as well. see [Map](https://github.com/Probed/RPG/blob/master/server/Game/Map.md#store)

If any `tiles` exist within the maps they will be stored also. see [Tile](https://github.com/Probed/RPG/blob/master/server/Game/Tile.md#store)

* `options` *required*
    * `user` **:** the [User](#) making the request
    * `universe` **:** the `universe` object to be stored
* `options` *optional*
    * `bypassCache` **:** does not attempt to load from, or store in, the game cache

* *Returns*
    * `callback`(`universe` *or* `error`) **:** a universe object or a `{error:'message'}` object

*Example*

```javascript
RPG.Universe.store({
    user : request.user,
    universe : myUniverse
}, function(universe) {
    if (universe.error) {
        console.log('Universe Error: ' + universe.error);
    } else {
        console.log('Universe Stored Successfully. ID#: '+ universe.property.database.universeID);
    }
});
```

---

<a name="load"></a>

## [load](#load) : function(`options`, `callback`)

* `options` *required*
    * `user` **:** the [User](#) making the request
    * `character` *or* `universeID` *or* `universeName` **:** what universe to load

* `options` *optional*
    * `mapID` *or* `mapName` **:** load the specified map into the universe
    * `tilePoints` **:** load the specified tiles into the map
    * `bypassCache` **:** does not attempt to load from, or store in, the game cache

* *Returns*
    * `callback`(`universe` *or* `error`) **:** a universe object or a `{error:'message'}` object

*Example* Load universe #1 with map #1 and tile [0,0]

```javascript
RPG.Universe.load({
    user : request.user,
    universeID : 1,
    mapID : 1,
    tilePoints : [[0,0]]
}, function(universe) {
    if (universe.error) {
        console.log('Universe Error: ' + universe.error);
    } else {
        console.log('Universe Loaded Successfully. ID#: '+ universe.property.database.universeID);
    }
});
```

---

<a name="list"></a>

## [list](#list) : function(`options`, `callback`)

* `options` *required*
    * `user` **:** the [User](#) making the request

* *Returns*
    * `callback`(`universe` *or* `error`) **:** a universe object or a `{error:'message'}` object

*Example*

```javascript
RPG.Universe.list({
    user : request.user,
}, function(universes) {
    if (universes.error) {
        console.log('Universe Listing Error: ' + universes.error);
    } else {
        console.log('Universe List Loaded Successfully. Count: '+ Object.length(universes));
    }
});
```

---

<a name="checkDupeName"></a>

## [checkDupeName](#checkDupeName) : function(`options`, `callback`)

* `options` *required*
    * `user` **:** the [User](#) making the request
    * `universeName` **:** what universe name to check

* `options` *optional*
    * `universe` *or* `universeID` **:** ignore this universe in the check

* *Returns*
    * `callback`(`dupeName` *or* `null`) **:** `dupeName` if a dupe was found, or `null` if all good.

*Example*

```javascript
RPG.Universe.checkDupeName({
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