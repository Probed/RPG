var options = {
    property : {
	tileName : ["/^[a-zA-Z0-9]+$/",1,50],
	folderName : ["/^[a-zA-Z0-9]+$/",1,50],
	name : '',
	image : {
	    name : [],
	    size : [10,200,100],
	    top : [0,200,0],
	    left : [0,200,0],
	    repeat : ['no-repeat','repeat-x','repeat-y','repeat']
	},
	hitpoints : [1,1000000,1],
	disposition : ['Friendly','Wary','Neutral','Angry','Hostile'],
	roaming : {
	    canRoam : [true],
	    radius :[0,250,0]
	}
    },
    quest : {
	fulfills : '',
	starts :''
    },
    event : {
	onTalk : '',
	onAttack : ''
    },
    other : {
}
};

if (typeof exports != 'undefined') {
    exports.options = options;
}