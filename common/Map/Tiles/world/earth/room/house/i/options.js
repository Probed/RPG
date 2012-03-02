var options = {
    property : {
	traversableBy : {

	    foot : {
		cost : [-100,100,1]
	    },
	    steed : {
		cost : [-100,100,0.75]
	    },
	    vehicle : {
		cost : [-100,100,0.25]
	    }
	    
	}
    }
};

if (typeof exports != 'undefined') {
    exports.options = options;
}