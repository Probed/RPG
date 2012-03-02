var options = {
    property : {
	traversableBy : {
	    foot : {
		cost : [-100,100,1.5]
	    },
	    steed : {
		cost : [-100,100,4]
	    },
	    vehicle : {
		cost : [-100,100,3]
	    }
	}
    }
};

if (typeof exports != 'undefined') {
    exports.options = options;
}