var options = {
    property : {
	tileName : ["/^[a-zA-Z0-9]+$/",1,50],
	folderName : ["/^[a-zA-Z0-9]+$/",1,50],
	image : {
	    name : [],
	    size : [-200,200,100],
	    top : [-200,200,0],
	    left : [-200,200,0],
	    repeat : ['no-repeat','repeat-x','repeat-y','repeat']
	}
    },
    quest : {},
    events : {},
    other : {}
};

if (typeof exports != 'undefined') {
    exports.options = options;
}