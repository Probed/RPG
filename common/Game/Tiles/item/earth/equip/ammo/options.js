/**
 * Equipment - Ammo
 */
exports.options = require('../../../../TileTypes.js').TileType.Equip({
    cost : [1,2,1],
    weight : 0.01,
    type : ['ammo'],
    stacksize : [1,64,64]
});
