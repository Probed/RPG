/**
 * Equipment - Weapons
 */
exports.options = require('../../../../TileTypes.js').TileType.Equip({
    cost : [25,100,50],
    type : ['weapon'],
    weapon : {
	type : ['dagger','mace','sword','gun'],
	damage : [1,100,1]
    }
});