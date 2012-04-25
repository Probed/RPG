var RPG = module.exports = {};

RPG.MySQLPool = new require("node-mysql-pool").MySQLPool({
    mysql : 'node-mysql',
    poolSize: 1,
    host: 'localhost',
    user: 'rpg_player',
    password: 'psychometallica',
    database: 'rpg'
});

RPG.Mysql = new (new Class({

    query : function(sql,values,callback) {
	var idx = require('../Log/Log.njs').Timing.start('DB Query: ' + sql);
	RPG.MySQLPool.query(sql,values,function(err,results,fields,input){
	    require('../Log/Log.njs').Timing.stop(idx);
	    callback(err,results,fields,input);
	});
    },

    createQueue : function() {
	//require('util').log('[Queue] Created.'+String.fromCharCode(13));
	return new RPG.Queue();
    },

    //execute each queue in order then callback when complete
    executeQueues : function(queues,async,callback) {

	//create a new chain with all the queues
	var queueChain = new Chain();

	//go through each one at a time
	queues.each(function(q,index){
	    //require('util').log('[Queues] Executing '+ (async?'Async':'Sync') +'Queue '+index+' '+ String.fromCharCode(13));
	    if (!q) return;
	    queueChain.chain(function(){
		if (!async) {
		    q.executeSync(function(){
			queueChain.callChain();
		    })
		} else {
		    q.executeAsync(function(){
			queueChain.callChain();
		    });
		}
	    })
	});

	//add our complete callback to the end of the chain
	queueChain.chain(function(){
	    //require('util').log('[Queues] Finished '+ (async?'Async':'Sync') +'Queues'+String.fromCharCode(13));
	    callback();
	});

	//start the chain
	queueChain.callChain();
    }
}))();

RPG.Queue = new Class({

    queued : [],

    queue : function(sql,values,callback) {
	this.queued.push(function(fn){
	    //require('util').log('[Queued] Querying...'+String.fromCharCode(13));
	    var idx = require('../Log/Log.njs').Timing.start('DB Query: ' + sql);
	    RPG.MySQLPool.query(sql,values,function(err,info,fields){
		//require('util').log('[Queued] Querying Complete.'+String.fromCharCode(13));
		require('../Log/Log.njs').Timing.stop(idx);
		callback && callback(err,info,fields,{
		    sql : sql,
		    values : values
		});
		fn && fn();
	    });
	});
    },

    //execute each queued item in order then callback when complete
    executeSync : function(callback) {
	//require('util').log('[Queue] Starting Sync Queue'+String.fromCharCode(13));

	//add our complete callback to the end of the chain
	this.queued.push(function(){
	    //require('util').log('[Queue] Finished Sync Queue'+String.fromCharCode(13));
	    callback();
	});

	var queueChain = new Chain(this.queued);
	//start the chain
	queueChain.callChain(function(){
	    queueChain.callChain();
	});
    },

    //executes all queued items all at once then calls back when all are complete
    executeAsync : function(callback) {
	//require('util').log('[Queue] Starting Async Queue'+String.fromCharCode(13));
	var qLen = this.queued.length;
	if (qLen == 0) {
	    callback();
	    return;
	}
	this.queued.each(function(queue){
	    queue(function(){
		qLen--;
		if (qLen == 0) {
		    //require('util').log('[Queue] Finished aync Queue'+String.fromCharCode(13));
		    callback();
		}
	    });
	});
    }

});