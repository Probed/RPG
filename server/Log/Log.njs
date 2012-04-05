var RPG = module.exports = {};
Object.merge(RPG,require('../Database/mysql.njs'));
Object.merge(RPG,require('../../common/appInfo.js'));

RPG.logID = 0;

RPG.Log = function(type, options) {
    if (!RPG.appInfo || !RPG.appInfo.test || !RPG.appInfo.debug) return;

    var message = '('+(RPG.logID++)+')';
    if (type) {
	message += '['+type.toUpperCase()+']: ';
    }
    if (typeOf(options) == 'string') {
	require('util').log(message+options+String.fromCharCode(13));
	return;
    } else if (typeOf(options) == 'object') {
	require('util').log(message+JSON.stringify(options) +String.fromCharCode(13));
	return;
    }
    if (options && options.message) {
	message += options.message +String.fromCharCode(13);
    }
    if (options && options.exception) {
    //message += options.exception;
    }
    require('util').log(message+String.fromCharCode(13));
}