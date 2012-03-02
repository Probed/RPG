<a name="Readme"></a>
<h1>node-mysql-pool</h1>

<a name="Purpose"></a>
<h2>Purpose</h2>

node-mysql-pool is a MySQL [connection pool](http://en.wikipedia.org/wiki/Connection_pool)
for [node.js](http://nodejs.org/) on top of Felix Geisendörfer's MySQL client
[node-mysql](https://github.com/felixge/node-mysql).

Using a connection pool instead of a single connection should render a remarkable
speed-up, when you have many short living connections, e.g. with message board applications.

<a name="TOC"></a>
<h2>TOC</h2>

* [Tutorial](#Tutorial)
* [Current status](#Status)
* [Contributors](#Contributors)
* [Compatibility](#Compatibility)
* [Installation](#Installation)
* [API](#API)
    * [Creation of a new pool](#NewPool)
    * [Options](#Options)
    * [Methods affecting all connections](#AllConnections)
    * [Methods invoked on a single connection](#SingleConnection)
    * [Methods unrelated to connections](#NoConnection)
    * [event: 'error' \(err\)](#EventError)
* [Todo](#Todo)
* [Licence](#Licence)

<a name="Tutorial"></a>
<h2>Tutorial</h2>

```javascript
var MySQLPool = require("mysql-pool").MySQLPool;
var pool = new MySQLPool({
  poolSize: 4,
  user:     'root',
  password: 'root',
  database: 'test'
});

pool.query("SELECT 'Hello, World!' AS hello", function(err, rows, fields) {
  if(err) throw err;
  console.log(rows[0].hello);
});

for(var i = 0; i < 10; ++i) {
  pool.query("SELECT SLEEP(2), ? AS i", [i], function(err, rows, fields) {
    if(err) throw err;
    console.log("Slept: " + rows[0].i);
  });
}
```

You probably do not have to change anything if you already used
[node-mysql](https://github.com/felixge/node-mysql/)
or any of [its forks](https://github.com/felixge/node-mysql/network)!

<a name="Status"></a>
<h2>Current status</h2>

This module is currently not backed by proper unit testing. Nevertheless I found
it stable for my testings.

If you find an error, please file an [issue](https://github.com/Kijewski/node-mysql-pool/issues)!

<a name="Contributors"></a>
<h2>Contributors</h2>

* [René Kijewski](https://github.com/Kijewski)
* [Michael Lai](https://github.com/melin)
    (fixed [issue #1](https://github.com/Kijewski/node-mysql-pool/pull/1))
* [Daniel Dickison](https://github.com/danieldickison)
    (fixed [issue #3](https://github.com/Kijewski/node-mysql-pool/pull/3))
* [dall](https://github.com/dall)
    (spotted [issue #5](https://github.com/Kijewski/node-mysql-pool/issues/5))
* [Demián Rodriguez](https://github.com/demian85)
    (fixed [issue #7](https://github.com/Kijewski/node-mysql-pool/issues/7))

<a name="Compatibility"></a>
<h2>Compatibility</h2>

This module was only tested using node >= 0.4.x. It does not work with older
versions of node.js.

The node-mysql-pool even works with unknown forks of node-mysql, as long as

* the last parameter of any method is the callback function,
* no events *at all* are emitted when supplying a callback function, and
* when the first parameter of a callback is set, it denotes an error.

Otherwise the requirements are the same as for
[node-mysql](https://github.com/felixge/node-mysql/blob/master/Readme.md).

<a name="Installation"></a>
<h2>Installation</h2>

* Using [npm](http://npmjs.org/): `npm install mysql-pool`
* Using git:
    * `git clone git@github.com:Kijewski/node-mysql-pool.git node-mysql-pool`
    *     *or*
    * `git submodule add git@github.com:Kijewski/node-mysql-pool.git deps/node-mysql-pool`

<a name="API"></a>
<h2>API</h2>

The API of this module is as similar to node-mysql as possible, with two exceptions:

* You must always supply a callback function. Using listeners is not supported.
* Property `x`, when not supplied while creation, are to be set to `instance.properties.x`.

When called back, `this` will be the used connection. (You probably never need to
know which connection was actually used.)

<a name="NewPool"></a>
<h3>Creation of a new pool</h3>

    mysqlPool.Pool([options])

creates a new, currently empty. Any property for the single connections or
the connectionpool, resp., can be set using the `options` object.

If the parameter `poolsize` is omitted, 1 is used.

Only if all connection attemps failed `err` is supplied.
If some connections failed, `result.error` will contain a list of Errors.
If some or all connections succeeded, `results.connections` will contains the pool's size.

<a name="Options"></a>
<h3>Options</h3>

Defaults:

    pool.poolSize = 1
    pool.mysql = require("mysql")

* `pool.poolSize`:
    * The number of connections to establish to the server.
* `pool.mysql`:
    * If you do not want the npm version of node-mysql—e.g. because you forked and
      tweaked it for your purposes—you can supply a different library to use.
* `pool.properties.xyz = undefined`:
    * Property `xyz` of the `mysql.Client` object.
      See the [original documentation](https://github.com/felixge/node-mysql/blob/master/Readme.md)
      of node-mysql for more property related information.

<a name="AllConnections"></a>
<h3>Methods affecting all connections</h3>

    client.useDatabase(database, cb)
    client.end([cb])
    client.destroy()

* `pool.useDatabase(database, cb)`:
    * Changes the database for every connection.
* `pool.end([cb])`:
    * Shuts down every connection, not waiting for any enqueued and waiting queries.
      Active queries won't be aborted, though.
* `pool.destroy()`:
    * Kills every connection. You do not want do use this method!

For all methods you can [invoke on a single connection](#SingleConnection), there is
an equivalent `methodnameAll(...)` method. E.g. you can use `pool.pingAll(cb)`, if
you want you to ping all connections for some reason.

`cb` will be called once for every connection affected. [Subject to change!](#Todo)

<a name="SingleConnection"></a>
<h3>Methods invoked on a single connection</h3>

All methods of the `Client` object will be supported—with `connect(...)`, `end(...)`,
`useDatabase(...)` and `destroy(...)` being overwritten.

If you do not use a fork, that are currently:

    query(sql, [params], cb)
    ping([cb]))
    statistics([cb])

See the [original documentation](https://github.com/felixge/node-mysql/blob/master/Readme.md)
of node-mysql for method related information.

**Beware:**

* You must supply a callback method, if you have *any* parameters.
* No events are emitted but [error](#EventError).

<a name="NoConnection"></a>
<h3>Methods unrelated to connections</h3>

    format(sql, params)
    escape(val)

Will behave exactly like the original methods. They do not belong to a single
connection.

<a name="EventError"></a>
<h3>event: 'error' (err)</h3>

Emitted if and only if an error occurred and no callback function was supplied.
You should always supply a callback function!

<a name="Todo"></a>
<h2>Todo</h2>

* The methods affecting all connections have a strange API. `cb` should be called
  only once.


<a name="Licence"></a>
<h2>Licence</h2>

node-mysql-pool is licensed under the
[MIT license](https://github.com/Kijewski/node-mysql-pool/blob/master/License).
