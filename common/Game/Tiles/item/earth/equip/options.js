/**
 * Generic Equipment values
 *
 */
var RPG = {};
Object.merge(RPG,require('../../../../../Random.js'));
Object.merge(RPG,require('../../../../../Character/Character.js'));
Object.merge(RPG,require('../../../TileTypes.js'));

var rand = Object.clone(RPG.Random);

rand.seed = 2271981.4012012;

exports.options = RPG.TileType.Item({
    generator : ['Equipment'],
    type : ['ammo','arm','chest','ear','foot','leg','hand', 'head','neck','ring','waist','weapon','sheild'],
    durability : [0,100,100],//%
    //    broken : [false],
    //    charges : [0,100,0],

    equip : 'All.'.repeat(3).split('.').slice(0,-1).append(['Light','Medium','Heavy']).shuffleS(rand),
    Race : 'All.'.repeat(Object.keys(RPG.Race).length).split('.').slice(0,-1).append(Object.keys(RPG.Race)).shuffleS(rand),
    Gender : 'All.'.repeat(Object.keys(RPG.Gender).length).split('.').slice(0,-1).append(Object.keys(RPG.Gender)).shuffleS(rand),
    Class : 'All.'.repeat(Object.keys(RPG.Class).length).split('.').slice(0,-1).append(Object.keys(RPG.Class)).shuffleS(rand),

    //Stat Modifiers
    Stats : (function(){
	var stats = {};
	Object.each(Object.merge({
	    hp : 0,
	    mana : 0,
	    xp : 0,
	    ac : 0
	},
	RPG.Stats),function(stat,name) {
	    stats[name] = [-100,100,0];
	});
	return stats;
    }())
});
