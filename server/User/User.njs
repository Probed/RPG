/*
 * User.js
 *
 * Individual User Session
 *
 *
 */


var RPG = module.exports = {};

RPG.User = new Class({
    Implements : [Options],
    isLoggedIn : false,
    options : {
	name : 'New User'
    },
    initialize : function(options) {
	this.setOptions(options);
    }
})