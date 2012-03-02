var options = {
    property : {
	traversableBy : {
	    foot : {
		cost : [-100,100,1.25]
	    },
	    steed : {
		cost : [-100,100,1]
	    },
	    vehicle : {
		cost : [-100,100,0.75]
	    }
	}
    }
};

if (typeof exports != 'undefined') {
    exports.options = options;
}