if (!RPG) var RPG = {};

Object.extend({
    getSRandom : function(source,rand,ignore) {
	var keys = Object.keys(source);
	keys.erase(ignore);
	var key = keys[Math.floor((rand || RPG.Random).random(0,keys.length))];
	return {
	    key : key,
	    rand : source[key]
	};
    }
});

Array.extend({
    getSRandom : function(source,rand) {
	return source[Math.floor((rand || RPG.Random).random(0,source.length))];
    }
})

RPG.Random = {
    seed : Math.random() * (99999999999 - 1) + 1,
    oldSeed : null,
    //Returns a random number between 0 and 1
    random : function(lower,upper)
    {
	var maxi = Math.pow(2,32);
	this.seed = (134775813 * (this.seed + 1)) % maxi;
	var num = (this.seed) / maxi;
	if(typeof lower!='undefined')
	{
	    var range = upper - lower;
	    num *= range;
	    num += lower;
	    range = null;
	}
	maxi = null;
	return num;
    },
    saveSeed : function() {
	RPG.Random.oldSeed = RPG.Random.seed;
    },
    restoreSeed : function() {
	if (!RPG.Random.oldSeed) return;
	RPG.Random.seed = RPG.Random.oldSeed;
    }
};

if (typeof exports != 'undefined') {
    module.exports = RPG;
}