if (!RPG) var RPG = {};
if (!RPG.Generator) RPG.Generator = {};

if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../../Random.js'));
    Object.merge(RPG,require('../../Constraints.js'));
    Object.merge(RPG,require('./Generators.js'));
    module.exports = RPG;
}

RPG.Generator.Name = new (RPG.Generator.NameClass = new Class({
    //Extends : RPG.WordsGeneratorBaseClass,
    Implements : [Options],

    name : 'Name',
    constraints : {
	name : {
	    seed : [0,99999999999,Math.floor((Math.random() * (99999999999 - 1) + 1))],
	    length : [2,12,6]//min/max/def
	}
    },

    options : {},
    initialize : function(options) {
	this.setOptions(options);
    },

    random : function(rand,mapName,callback) {
	if (!callback) {
	    this.generate(RPG.Constraints.random(this.constraints,rand),rand,function(generated){
		callback(generated);
	    });
	    return null;
	} else {
	    return this.generate(RPG.Constraints.random(this.constraints,rand),rand);
	}
    },

    generate : function(options,rand,callback){
	if (!options) options = {};
	rand = rand || RPG.Random;
	rand.seed = (options.name && options.name.seed) || rand.seed;

	var i = 0;

	var vowels = 'aeiouy' + 'aeio' + 'aeio';
	var con = 'bcdfghjklmnpqrstvwxz' + 'bcdfgjklmnprstvw' + 'bcdfgjklmnprst';
	var allchars = vowels + con;

	var length = options.name.length || rand.random(4,6);
	if (length < 1) length = 1;
	var consnum = 1;
	var name = '';
	for (i = 0; i < length; i++) {
	    var touse = null;
	    var c=null;
	    //if we have used 2 consonants, the next char must be vocal.
	    if (consnum == 2) {
		touse = vowels;
		consnum = 0;
	    } else {
		touse = allchars;
	    }
	    //pick a random character from the set we are goin to use.
	    c = touse.charAt(rand.random(0, touse.length - 1));
	    name = name + c;
	    if (con.indexOf(c) != -1) consnum++;
	    c = null
	    touse = null;
	}
	name = name.charAt(0).toUpperCase() + name.substring(1, name.length)
	i = vowels = con = allchars = length = consnum = null;

	if (callback) {
	    callback(name);
	    return null;
	} else {
	    return name;
	}
    }
}))();





RPG.subjects = ['Philisbad','Eckinstab','Shansiab','Bill','Edward','Sally'];
RPG.titles = ['the 1st','the 2nd','the 3rd','the 4th','the 5th','esquire','jr.','sr.','Phd.'];
RPG.verbs = ['add','allow','bake','bang','call','chase','damage','drop','end','escape','fasten','fix','gather','grab','hang','hug','imagine','itch','jog','jump','kick','knit','land','lock','march','mix','name','notice','obey','open','pass','promise','question','reach','rinse','scatter','stay','talk','turn','untie','use','vanish','visit','walk','work','yawn','yell','zip','zoom'];
RPG.objects = ['table','chair'];
RPG.adjectives = ['big','colossal','fat','gigantic','great','huge','immense','large','little','mammoth','massive','miniature','petite','puny','scrawny','short','small','tall','teeny','teeny-tiny','tiny'];
RPG.adverbs = ['carefully','correctly','eagerly','easily','fast','loudly','patiently','quickly','quietly'];
RPG.nouns = ['ball','bat','bed','book','boy','bun','can','cake','cap','car','cat','cow','cub','cup','dad','day','dog','doll','dust','fan','feet','girl','gun','hall','hat','hen','jar','kite','man','map','men','mom','pan','pet','pie','pig','pot','rat','son','sun','toe','tub','van'];

RPG.wordPatterns = {
    'Subject-Verb' : [RPG.subjects,RPG.verbs],
    'Subject-Verb-Object' : [RPG.subjects,RPG.objects,RPG.verbs],
    'Subject-Verb-Adjetive' : [RPG.subjects,RPG.verbs,RPG.adjectives],
    'Subject-Verb-Adverb':  [RPG.subjects,RPG.verbs,RPG.adverbs],
    'Subject-Verb-Noun' :  [RPG.subjects,RPG.verbs,RPG.nouns],
    'Subject' :  [RPG.subjects],
    'Verb' : [RPG.verbs],
    'Object' :  [RPG.objects],
    'Adjetive' : [RPG.adjectives],
    'Adverb' : [RPG.adverbs],
    'Noun' : [RPG.nouns]
};

/**
 * Takes a pattern defined in RPG.wordPatterns
 * and randomly constructs a sentance from the avaiable words
 */
RPG.Generator.Words = new (RPG.Generator.WordsClass = new Class({
    //Extends : RPG.WordsGeneratorBaseClass,
    Implements : [Options],

    name : 'Words',
    constraints : {
	words : {
	    seed : [0,99999999999,Math.floor((Math.random() * (99999999999 - 1) + 1))],
	    pattern : Object.keys(RPG.wordPatterns)
	}
    },
    options : {},
    initialize : function(options) {
	this.setOptions(options);
    },

    random : function(rand,mapName,callback) {
	rand = rand || RPG.Random;
	if (callback) {
	    this.generate(RPG.Constraints.random(this.constraints,rand),rand,function(generated){
		callback(generated);
	    });
	    return null;
	} else {
	    return this.generate(RPG.Constraints.random(this.constraints,rand),rand);
	}
    },

    generate : function(options,rand,callback) {
	rand = rand || RPG.Random;
	rand.seed =  (options.words && options.words.seed) || rand.seed;
	var out = '';
	RPG.wordPatterns[options.pattern].each(function(words){
	    for (var i = 0;i<256;i++) {
		var word = Array.getSRandom(words,rand);
		if (!options.ignore || (options.ignore && !options.ignore.contains('word'))) {
		    out += ' '+word;
		    break;
		}
	    }
	});
	if (callback) {
	    callback(out);
	    return null;
	} else {
	    return out;
	}
    }
}))();
