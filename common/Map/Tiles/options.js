/**
 * Parent Tile.
 *
 * ALL Tiles receive these options
 *
 */
var options = {
    property : {
	tileName : ["/^[a-zA-Z0-9'.`_ ]+$/",1,50],
	folderName : ["/^[a-zA-Z0-9]+$/",1,50],
	image : {
	    name : [],
	    size : [-200,200,100],
	    top : [-200,200,0],
	    left : [-200,200,0],
	    repeat : ['no-repeat','repeat-x','repeat-y','repeat']
	}
    }
};
if (typeof exports != 'undefined') {
    exports.options = options;
}