var options = {
    attributes : {
	hitpoints : [1,1000000,1],
	disposition : ['Friendly','Wary','Neutral','Angry','Hostile'],
	roaming : {
	    canRoam : [true],
	    radius :[0,250,0]
	}
    }
};

if (typeof exports != 'undefined') {
    exports.options = options;
}