var RPG = module.exports = {};

Object.merge(RPG,require('../Database/mysql.njs'));
Object.merge(RPG,require('../../common/appInfo.js'));

RPG.Log = require('log4js');
RPG.Log.configure(undefined,{
    reloadSecs:30
});

RPG.Timing = new (new Class({

    logger : RPG.Log.getLogger('RPG.Timing'),
    timings : [],

    start : function(name) {
	return (this.timings.push({
	    name : name,
	    start : new Date()
	}) - 1);
    },

    stop : function(index) {
	if (!this.timings[index]) return;
	this.timings[index].end = new Date();
	this.logger.trace((this.timings[index].end - this.timings[index].start) + 'ms ' + ('\t') + this.timings[index].name.substr(0,100));
    }
}))();
