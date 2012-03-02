var options = {
    property : {
	traversableBy : {
	    foot : {
		cost : [-100,100,100]
	    },
	    steed : {
		cost : [-100,100,100]
	    },
	    vehicle : {
		cost : [-100,100,100]
	    },
	    boat : {
		cost : [-100,100,3]
	    }
	}
    }
};

if (typeof exports != 'undefined') {
    exports.options = options;
}