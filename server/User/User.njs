/*
 * User.js
 *
 * Individual User Session
 *
 *
 */
var RPG = module.exports = {};

Object.merge(RPG,require('../Log/Log.njs'));

RPG.User = new Class({
    Implements : [Options],
    logger : null,
    isLoggedIn : false,
    options : {
	name : 'New User'
    },
    initialize : function(options) {
	this.setOptions(options);
	this.logger = RPG.Log.getLogger('User '+ (this.options.userID || (this.options.id)));
	this.logger.setLevel('ALL');
	this.logger.trace('Initialized.');

    }
});