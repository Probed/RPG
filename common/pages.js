if (!RPG) var RPG = {};

var cs = typeof exports != 'undefined' ?'../server':'/client';
var js = typeof exports != 'undefined' ?'.njs':'.js';

RPG.mainMenu = {
    'Main' : {
	'class' : 'folder f-open first',
	label : 'Site Menu',
	items : []
    },
    'Players' : {
	'class' : 'folder f-open',
	label : 'Players',
	items : []
    },
    'Forum' : {
	'class' : 'folder f-open',
	label : 'Forum',
	items : []
    },
    'Patches' : {
	'class' : 'folder f-open',
	label : 'Patch Notes',
	items : []
    }
};


RPG.pages = [
{
    label : 'Home',
    hashTag : '#Home',
    image : '/client/jx/themes/dark/images/logo_s.png',
    treeParent : 'Main',
    tipTitle : 'RPG Home',
    tipText :'Get all the latest news on the home page.',
    description :'',
    requires : {
	js : cs+'/pages/Home/Home'+js,
	exports : 'pageHome',
	singleton : true
    }
},
{
    label : 'What is it?',
    hashTag : '#WhatIsIt',
    image : '/client/jx/themes/dark/images/question.png',
    treeParent : 'Main',
    tipTitle : '',
    tipText :'',
    description :'',
    requires : {
	js : cs+'/pages/WhatIsIt/WhatIsIt'+js,
	exports : 'pageWhatIsIt',
	singleton : true
    }
},
{
    label : 'How to Play',
    hashTag : '#HowToPlay',
    image : 'Question',
    treeParent : 'Main',
    tipTitle : '',
    tipText :'',
    description :'',
    requires : {
	js : cs+'/pages/HowToPlay/HowToPlay'+js,
	exports : 'pageHowToPlay',
	singleton : true
    }
},
{
    label : 'Game Wiki',
    hashTag : '#GameWiki',
    image : '/client/jx/themes/dark/images/wiki.png',
    treeParent : 'Main',
    tipTitle : '',
    tipText :'',
    description :'',
    requires : {
	js : cs+'/pages/GameWiki/GameWiki'+js,
	exports : 'pageGameWiki',
	singleton : true
    }
},
{
    label : 'Player Listing',
    hashTag : '#Players',
    image : '',
    treeParent : 'Players',
    tipTitle : '',
    tipText :'',
    description :'',
    requires : {
	js : cs+'/pages/Players/Players'+js,
	exports : 'pagePlayers',
	singleton : true
    }
},
{
    label : 'Stats',
    hashTag : '#Players?stats=true',
    image : '',
    treeParent : 'Players',
    tipTitle : '',
    tipText :'',
    description :'',
    requires : {
	js : cs+'/pages/Players/Players'+js,
	exports : 'pagePlayers',
	singleton : true
    }
},
{
    label : 'Player Search',
    hashTag : '#Players?search=true',
    image : '',
    treeParent : 'Players',
    tipTitle : '',
    tipText :'',
    description :'',
    requires : {
	js : cs+'/pages/Players/Players'+js,
	exports : 'pagePlayers',
	singleton : true
    }
},
{
    label : 'Forum',
    hashTag : '#Forum',
    image : '',
    treeParent : 'Forum',
    tipTitle : '',
    tipText :'',
    description :'',
    requires : {
	js : cs+'/pages/Forum/Forum'+js,
	exports : 'pageForum',
	singleton : true
    }
},
{
    label : 'Support Forum',
    hashTag : '#Forum?showTopic=Support',
    image : '',
    treeParent : 'Forum',
    tipTitle : '',
    tipText :'',
    description :'',
    requires : {
	js : cs+'/pages/Forum/Forum'+js,
	exports : 'pageForum',
	singleton : true
    }
},
{
    label : 'Forum General',
    hashTag : '#Forum?showTopic=General',
    image : '',
    treeParent : 'Forum',
    tipTitle : '',
    tipText :'',
    description :'',
    requires : {
	js : cs+'/pages/Forum/Forum'+js,
	exports : 'pageForum',
	singleton : true
    }
},
{
    label : 'Feedback Forum',
    hashTag : '#Forum?showTopic=Feedback',
    image : '',
    treeParent : 'Forum',
    tipTitle : '',
    tipText :'',
    description :'',
    requires : {
	js : cs+'/pages/Forum/Forum'+js,
	exports : 'pageForum',
	singleton : true
    }
},
{
    label : 'Current Patch Notes',
    hashTag : '#PatchNotes',
    image : 'extTXT',
    treeParent : 'Patches',
    tipTitle : '',
    tipText :'',
    description :'',
    requires : {
	js : cs+'/pages/PatchNotes/PatchNotes'+js,
	exports : 'pagePatchNotes',
	singleton : true
    }
},
{
    label : 'All Patch Notes',
    hashTag : '#PatchNotes?all=true',
    image : 'extTXTmulti',
    treeParent : 'Patches',
    tipTitle : '',
    tipText :'',
    description :'',
    requires : {
	js : cs+'/pages/PatchNotes/PatchNotes'+js,
	exports : 'pagePatchNotes',
	singleton : true
    }
}
];
if (typeof exports != 'undefined') {
    module.exports = RPG;
}