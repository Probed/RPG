if (!RPG) var RPG = {};

RPG.appInfo = {
    version : '0.0.1',
    debug : true,
    test : true,
    adminEmail : 'tr3vor@hotmail.com',
    bitcoinDonate : '1NpQWYLFohz7DxNdhGf65wXzSLWQZurnJG',
    authors : [
    {
	authorID : 1,
	name : 'Probed',
	email : 'tr3vor@hotmail.com',
	position : 'Developer',
	bitcoinDonate : '1NpQWYLFohz7DxNdhGf65wXzSLWQZurnJG'
    }
    ],
    updates : [
    {
	authorID : 1,
	date : 'January 3, 2012',
	description : 'Initial Application Development begins.'
    }
    ]
};

if (typeof exports != 'undefined') {
    module.exports = RPG;
}