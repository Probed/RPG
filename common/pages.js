if (!RPG) var RPG = {};

var cs = typeof exports != 'undefined' ?'../server':'/client';
var js = typeof exports != 'undefined' ?'.njs':'.js';

RPG.mainMenu = {
    'Main' : {
	'class' : 'folder f-open first',
	display : 'Site Menu',
	items : []
    },
    'Players' : {
	'class' : 'folder f-open',
	display : 'Players',
	items : []
    },
    'Forum' : {
	'class' : 'folder f-open',
	display : 'Forum',
	items : []
    },
    'Patches' : {
	'class' : 'folder f-open',
	display : 'Patch Notes',
	items : []
    }
};


RPG.pages = [
{
    display : 'Home',
    hashTag : '#Home',
    icon : 'Home',
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
    display : 'Play Now',
    hashTag : '#Play',
    icon : 'Home',
    treeParent : 'Main',
    tipTitle : 'Play the game.',
    tipText :'Start adventuring by clicking the Play link.',
    description :'',
    requires : {
	js : cs+'/Game/play'+js,
	exports : 'Play',
	singleton : true
    }
},
{
    display : 'What is it?',
    hashTag : '#WhatIsIt',
    icon : 'Question',
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
    display : 'How to Play',
    hashTag : '#HowToPlay',
    icon : 'Question',
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
    display : 'Game Wiki',
    hashTag : '#GameWiki',
    icon : 'Wiki',
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
    display : 'Player Listing',
    hashTag : '#Players',
    icon : '',
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
    display : 'Stats',
    hashTag : '#Players?stats=true',
    icon : '',
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
    display : 'Player Search',
    hashTag : '#Players?search=true',
    icon : '',
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
    display : 'Forum',
    hashTag : '#Forum',
    icon : '',
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
    display : 'Support Forum',
    hashTag : '#Forum?showTopic=Support',
    icon : '',
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
    display : 'Forum General',
    hashTag : '#Forum?showTopic=General',
    icon : '',
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
    display : 'Feedback Forum',
    hashTag : '#Forum?showTopic=Feedback',
    icon : '',
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
    display : 'Current Patch Notes',
    hashTag : '#PatchNotes',
    icon : 'extTXT',
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
    display : 'All Patch Notes',
    hashTag : '#PatchNotes?all=true',
    icon : 'extTXTmulti',
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