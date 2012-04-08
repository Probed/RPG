var RPG = module.exports = {};
Object.merge(RPG,require('./Log/Log.njs'));

var logger = RPG.Log.getLogger('RPG.Cache');

RPG.Cache = new(RPG.CacheClass = new Class({
    Implements : [Options,Events],

    cache : {},

    options : {},
    initialize : function(options) {
	this.setOptions(options);
	logger.info('Initialized.');
    },

    store : function(id, to, value) {
	if (!this.cache[id]) this.cache[id] = {};
	this.cache[id][to] = value;
	logger.info('Store: id:' + id + ' to:'+ to);
	logger.trace('Store: id:' + id + ' to:'+ to + ' ' + JSON.encode((this.cache[id] && this.cache[id][to]) || null));
	return value;
    },

    merge : function(id, to, value) {
	if (!this.cache[id]) this.cache[id] = {};
	if (!this.cache[id][to]) {
	    this.cache[id][to] = value;
	} else {
	    Object.merge(this.cache[id][to],value);
	}
	logger.info('Merge: id:' + id + ' to:'+ to);
	logger.trace('Merge: id:' + id + ' to:'+ to + ' ' + JSON.encode((this.cache[id] && this.cache[id][to]) || null));
	return this.cache[id][to];
    },
    retrieve : function(id,from) {
	logger.info('Retrieve: id:' + id + ' from:'+ from);
	logger.trace('Retrieve: id:' + id + ' from:'+ from + ' ' + JSON.encode((this.cache[id] && this.cache[id][from]) || null));
	return this.cache[id] && this.cache[id][from];
    },

    remove : function(id,from) {
	var value = this.retrieve(id,from);
	logger.info('Remove: id:' + id + ' from:'+ from);
	logger.trace('Remove: id:' + id + ' from:'+ from + ' ' + JSON.encode(value));
	Object.erase(this.cache[id],from);
	return value;
    },

    list : function(id) {
	var keys = null;
	if (!this.cache[id]) {
	    logger.info('List: id:' + id + ' - Empty');
	    return null;
	} else {
	    keys = Object.keys(this.cache[id]);
	    logger.info('List: id:' + id + ' - Length:'+keys.length);
	    logger.trace('List: id:' + id + ' - Length:'+keys.length + ' Keys: ' + keys);
	    return Object.keys(this.cache[id]);
	}
    }

}))();