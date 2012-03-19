var RPG = module.exports = {};
Object.merge(RPG,require('./Log/Log.njs'));

var cache = {};

RPG.Cache = new(RPG.CacheClass = new Class({
    Implements : [Options,Events],

    cache : cache,

    options : {},
    initialize : function(options) {
	this.setOptions(options);
	RPG.Log('init','Cache Initialized.');
    },

    store : function(userID, to, value) {
	if (!this.cache[userID]) this.cache[userID] = {};
	this.cache[userID][to] = value;
	//RPG.Log('Cache store','u:' + userID + ' k:'+ to + ' ->  '+JSON.stringify((this.cache[userID] && this.cache[userID][to]) || null));
	return value;
    },

    merge : function(userID, to, value) {
	if (!this.cache[userID]) this.cache[userID] = {};
	if (!this.cache[userID][to]) {
	    this.cache[userID][to] = value;
	} else {
	    Object.merge(this.cache[userID][to],value);
	}
	//RPG.Log('Cache merge','u:' + userID + ' k:'+ to + ' ->  '+JSON.stringify((this.cache[userID] && this.cache[userID][to]) || null));
	return this.cache[userID][to];
    },
    retrieve : function(userID,from) {
	//RPG.Log('Cache Retrieve','u:' + userID + ' k:'+ from + ' ->  '+JSON.stringify((this.cache[userID] && this.cache[userID][from]) || null));
	return this.cache[userID] && this.cache[userID][from];
    },

    remove : function(userID,from) {
	var value = this.retrieve(userID,from);
	Object.erase(this.cache[userID],from);
	//RPG.Log('Cache remove','u:' + userID + ' k:'+ from + ' ->  '+JSON.stringify((this.cache[userID] && this.cache[userID][from]) || null));
	return value;
    }

}))();