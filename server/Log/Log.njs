var RPG = {};

if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../Database/mysql.njs'));
    Object.merge(RPG,require('../../common/appInfo.js'));
    RPG.Log = require('log4js');
    var log = RPG.Log.getLogger('Log');
    RPG.Log.configure(undefined,{
	reloadSecs:5
    });
    module.exports = RPG;
}