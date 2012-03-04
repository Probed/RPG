if (!RPG) var RPG = {};
if (typeof exports != 'undefined') {
    module.exports = RPG;
}

/**
 * Adds Object.getSRandom function to Object
 * This allows you to retrieve a seeded random key,content from an object.
 *
 * Eg: source = {
 *	    1 : content,
 *	    2 : content2,
 *	    3 : content3
 *	};
 *
 *	Returns {
 *	    key : random (1 or 2 or 3)
 *	    value (content or content2 or content3)
 *	}
 *
 */
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

/**
 * Returns a seeded random element from the array
 * Eg: source = [1,2,3]
 *	return = 1 or 2 or 3 (randomly selected)
 */
Array.extend({
    getSRandom : function(source,rand) {
	return source[Math.floor((rand || RPG.Random).random(0,source.length))];
    }
})

/**
 * Seeded Randomness
 */
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