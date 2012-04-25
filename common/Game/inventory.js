

if (!RPG) var RPG = {};
if (typeof exports != 'undefined') {
    module.exports = RPG;
}

RPG.inventory = {
    property : {
	name : ['/^[a-zA-Z0-9]+$/',3,15]
    }
}

RPG.canInventorize = function(map,point) {
    var cant = 'Invetory slot does not exist.';
    if (point[0] >= 0 && point[1] >=0 && point[0] < Object.getFromPath(map,'options.property.maxRows') && point[1] < Object.getFromPath(map,'options.property.maxCols')) {
	cant = null;
    }
    return cant;
}