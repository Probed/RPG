var options = {
    property : {
	tileName : ["/^[a-zA-Z0-9]+$/",1,50],
	folderName : ["/^[a-zA-Z0-9]+$/",1,50],
	image : {
	    name : [],
	    size : [10,200,100],
	    top : [0,200,0],
	    left : [0,200,0],
	    repeat : ['no-repeat','repeat-x','repeat-y','repeat']
	},
	traversableBy : {
	    foot : {
		cost : [-100,100,1]
	    },
	    steed : {
		cost : [-100,100,0.75]
	    },
	    vehicle : {
		cost : [-100,100,0.25]
	    },
	    boat : {
		cost : [-100,100,100]
	    },
	    spaceship : {
		cost : [-100,100,100]
	    }
	}
    },
    quest : {
	starts : [],
	finishes : []
    },
    events : {
	onBeforeEnter : '',
	onEnter : '',
	onBeforeLeave : '',
	onLeave : '',
	onUpdate : ''
    },
    other : {

}
};

if (typeof exports != 'undefined') {
    exports.options = options;
}