Javascript Tile Based RPG
=========================

The goal of this project is to create an Infinite Randomish Universe within which the player explores, quests, fights, loots, equips, levels and more.

### Server Side Javascript


The server uses [Node.js](http://www.nodejs.org) to process requests.
Currently the application is setup for Windows using [IISNode](https://github.com/tjanczuk/iisnode).
It has not been tested in any other environment.

All Client/Server interactions are processed through [index.njs](https://github.com/Probed/RPG/blob/master/index.njs) which is just a stub file that redirects flow into [/server/rpgApp.njs](https://github.com/Probed/RPG/blob/master/server/rpgApp.njs)

All Server-side-only javascript files use the extension '.njs'


### Client Side / Common Javascript

All Client/Common javascript files use normal .js extension.


### Netbeans


Current development is being done using [Netbeans](http://www.netbeans.org/)

### 3rd Party Javascript

* [Mootools](http://www.mootools.com) - [Client](https://github.com/Probed/RPG/tree/master/client/mootools) & [Server](https://github.com/Probed/RPG/blob/master/server/mootools-core-1.4.2-server.njs)
* [MochaUI](http://mochaui.org/) - [Client](https://github.com/Probed/RPG/tree/master/client/mochaui) (likely changing soon)
* [node-mysql](https://github.com/felixge/node-mysql) - [Server](https://github.com/Probed/RPG/tree/master/node_modules)
* [node-mysql-pool](https://github.com/Kijewski/node-mysql-pool) - [Server](https://github.com/Probed/RPG/tree/master/node_modules)
* [hashish](http://github.com/substack/node-hashish) - [Server](https://github.com/Probed/RPG/tree/master/node_modules) (for node-mysql)
* [traverse](http://github.com/substack/js-traverse) - [Server](https://github.com/Probed/RPG/tree/master/node_modules) (for node-mysql)
