var RPG = {};

if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../Database/mysql.njs'));
    Object.merge(RPG,require('../../common/appInfo.js'));
    RPG.Log = require('log4js');
    var log = RPG.Log.getLogger('Log');
    RPG.Log.configure(undefined,{
	reloadSecs:5
    });

    RPG.Log.requiredOptions = function(options,requiredKeys,logger,callback) {
	var errors = [];
	if (!options) {
	    errors.push('"options" argument missing.');
	}
	if (!requiredKeys && typeof requiredKeys == 'array') {
	    errors.push('"requiredKeys" argument missing or not an array.');
	}
	if (typeof callback != 'function') {
	    errors.push('callback must be a function.');
	}

	if (errors && errors.length == 0) {
	    var optKeys = Object.keys(options);
	    Array.clone(requiredKeys).each(function(key){
		if (optKeys.contains(key)) {
		    requiredKeys.erase(key);

		}
	    });
	    if (requiredKeys.length != 0) {
		errors.push('Missing option values: ' + requiredKeys);
	    }
	}

	if (errors && errors.length > 0) {
	    (options.user && options.user.logger || logger || log).fatal(errors+'');
	    callback({
		error : errors
	    });
	    return false;
	}
	return true;
    }
    module.exports = RPG;
}