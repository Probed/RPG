"use strict";

var util = require("util");
var EventEmitter = require("events").EventEmitter;

function MySQLPool(properties) {
	if(!(this instanceof MySQLPool)) {
		return new MySQLPool(properties);
	}
	
	EventEmitter.call(this);
	this.properties = {};
	
	// connections waiting for a query to execute
	this._idleQueue = [];
	// all connections that belong to this pool
	this._connectionPool = [];
	// queries to execute when a connection is ready
	this._todoQueue = [];
	
	for(var key in properties) {
		switch(key) {
			case "Client":
				throw new Error("Deprecated: specify `mysql` instead of `Client`.");
			case "mysql":
			case "poolSize":
				this[key] = properties[key];
				break;
			default:
				this.properties[key] = properties[key];
				break;
		}
	}
	
	if(!this.poolsize) {
		this.poolsize = 1;
	}
	if(!this.mysql) {
		this.mysql = require("mysql");
	} else if(typeof this.mysql == "string") {
		this.mysql = require(this.mysql);
	}
	
	this._populate();
	
	for(var i = 0; i < this.poolSize; ++i) {
		var client = this.mysql.createClient(this.properties);
		this._connectionPool.push(client);
		this._avail(client);
	}
	
	return this;
}
util.inherits(MySQLPool, EventEmitter);
exports.MySQLPool = MySQLPool;

MySQLPool.prototype._avail = function _avail(client) {
	this._idleQueue.push(client);
	var top;
	while(this._idleQueue.length > 0 && (top = this._todoQueue.shift())) {
		top.method.apply(this, top.args);
	}
}

MySQLPool.prototype.connect = function connect(n, cb) {
	throw new Error('Deprecated: specify `poolSize` in constructor options.');
};

MySQLPool.prototype.createClient = function createClient(options) {
	return new MySQLPool(options);
};

MySQLPool.prototype._forEach = function _forEach(params) {
	// TODO: callback _once_
	var pool = this;
	var args = Array.prototype.slice.call(params.args);
	while(args.length && typeof args[args.length-1] == "undefined") {
		args.pop();
	}
	var cb = args.pop();
	
	function mkCallback(client) {
		return function(err) {
			if(cb) {
				cb.apply(client, Array.prototype.slice.call(arguments));
			} else if(err) {
				pool.emit("error", err);
			}
		};
	}
	
	for(var i = 0, len = this._connectionPool.length; i < len; i++) {
		var client = this._connectionPool[i];
		params.method.apply(client, args.concat(mkCallback(client)));
	}
	
	if(params.destroying) {
		this._poolSize = 0;
		this._connectionPool = [];
		this._idleQueue = [];
		this._idleQueue.push = function() {
			return 0
		};
	}
}

MySQLPool.prototype._populate = function _populate() {
	var pool = this;
	var COPY = {format:true, escape:true};
	var FOR_EACH = {end:true, destroy:true, useDatabase:false};
	
	function mkPrototypeMethod(method, key) {
		if(key in COPY) {
			return method;
		}
		
		if(key in FOR_EACH) {
			return function() {
				return this._forEach({
					method:method, args:arguments, destroying:FOR_EACH[key]
				});
			};
		}
		
		pool[key + "All"] = function() {
			return this._forEach({
				method:method, args:arguments, destroying:false
			});
		};
		
		return function wrapperMethod() {
			var args = Array.prototype.slice.call(arguments);
			while(typeof args[args.length-1] == "undefined") {
				args.pop();
			}
			
			var client = pool._idleQueue.shift();
			if(!client) {
				pool._todoQueue.push({method:wrapperMethod, args:args});
				return pool;
			}
			
			var cb = args.pop();
			args.push(function(err) {
				pool._avail(client);
				if(cb) {
					cb.apply(client, arguments);
				} else if(err) {
					pool.emit("error", err);
				}
			});
			method.apply(client, args);
			return pool;
		};
	}

	var Client = this.mysql.Client;
	for(var key in Client.prototype) {
		if(!key.match(/^[_A-Z]/) && !(key in this) && !(key in EventEmitter.prototype)) {
			this[key] = mkPrototypeMethod(Client.prototype[key], key);
		}
	}
}
