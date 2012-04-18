Javascript Tile Based RPG
-------------------------

The goal of this project is to create an Infinite Randomish Universe within which the player explores, quests, fights, loots, equips, levels and more.

Demo Available at: [wastedpaper.sytes.net](http://wastedpaper.sytes.net:50014/)
YouTube video #1: [March 2nd 2012](http://www.youtube.com/watch?v=D1-w8bU1E4Y)
YouTube video #2: [April 11th 2012](http://youtu.be/0fUgivYQruU)

### Server Side Javascript
--------------------------


The server uses [Node.js](http://www.nodejs.org) to process requests.
Currently the application is setup for Windows using [IISNode](https://github.com/tjanczuk/iisnode).
It has not been tested in any other environment.

All Client/Server interactions are processed through [index.njs](https://github.com/Probed/RPG/blob/master/index.njs) which is just a stub file that redirects flow into [/server/rpgApp.njs](https://github.com/Probed/RPG/blob/master/server/rpgApp.njs)

All Server-side-only javascript files use the extension `.njs`

Windows IIS Notes:

* Set the Default Document to `index.njs`
* Set the iisnode Handler Mapping to `index.njs`
* Ensure the `CustomErrorModule` is removed from the websites modules. Otherwise when the Node.js responds with an 4xx,5xx header IISNode forwards that through IIS which then applies a custom error notification which overwrites the Node.js response body


### Client Side / Common Javascript
-----------------------------------

All Client/Common javascript files use normal `.js` extension.


### Project Development
------------

Current development is being done using [Netbeans](http://www.netbeans.org/)

### 3rd Party Javascript
------------------------

* [Mootools](http://www.mootools.com) -- [Client](https://github.com/Probed/RPG/tree/master/client/mootools) & [Server](https://github.com/Probed/RPG/blob/master/server/mootools-core-1.4.2-server.njs)
* [JxLib](http://jxLib.org/) -- [Client](https://github.com/Probed/RPG/tree/master/client/jx)
* [node-mysql](https://github.com/felixge/node-mysql) -- [Server](https://github.com/Probed/RPG/tree/master/node_modules)
* [node-mysql-pool](https://github.com/Kijewski/node-mysql-pool) -- [Server](https://github.com/Probed/RPG/tree/master/node_modules)
* [hashish](http://github.com/substack/node-hashish) -- [Server](https://github.com/Probed/RPG/tree/master/node_modules) (for node-mysql)
* [traverse](http://github.com/substack/js-traverse) -- [Server](https://github.com/Probed/RPG/tree/master/node_modules) (for node-mysql)
* [log4js](https://github.com/nomiddlename/log4js-node)

### Dontations
--------------

Bitcoin: 1MV5U1LcEMVoUgB75P1K3sELtcAp1MXu56