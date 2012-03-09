if (!RPG) var RPG = {};
if (!RPG.Generator) RPG.Generator = {};



if (typeof exports != 'undefined') {
    Object.merge(RPG,require('./Utilities.js'));
    Object.merge(RPG,require('../Tiles/Utilities.js'));
    Object.merge(RPG,require('../Tiles/Tiles.js'));
    Object.merge(RPG,require('./Words.js'));
    Object.merge(RPG,require('./Maze.js'));
    module.exports = RPG;

}

RPG.Generator.Dungeon = new (RPG.Generator.DungeonClass = new Class({
    Extends : RPG.GeneratorBaseClass,
    Implements : [Options],
    name : 'Dungeon',
    constraints : {
	dungeon : {
	    name : ["/^[a-zA-Z0-9_.]+$/",1,15,'g'],
	    seed : [0,99999999999,Math.floor((Math.random() * (99999999999 - 1) + 1))],
	    height : [3,7,5],
	    width : [3,7,5],
	    type : RPG.tileFolderList(RPG.Tiles,'world.earth.room')
	},
	rooms : {
	    floor : Object.getFromPath(RPG.Tiles,'world.earth.floor.options.property.image.name'),
	    'decor%' : [0,100,25],
	    'perim%' : [0,100,25],
	    'center%' : [0,100,25],
	    door : RPG.tileFolderList(RPG.Tiles,'world.earth.door')
	}
    },
    options : {},
    initialize : function(options) {
	this.setOptions(options);
    },

    generate : function(options,rand,callback){
	rand = rand || RPG.Random;
	rand.seed = options.dungeon.seed || rand.seed;

	var dungeon = {
	    tiles : {},
	    cache : {},
	    roomAreas : [],
	    corridorAreas : [],
	    stairsUp : null,
	    stairsDown : null,
	    possibleStartLocations : []
	};

	dungeon.tiles = {};
	dungeon.cache = {};

	this.createDungeonMaze(options,rand,dungeon);

	dungeon.possibleStartLocations.push(dungeon.stairsUp);

	callback(dungeon);
    },

    createDungeonMaze : function(options,rand,dungeon) {
	var r = 0;
	var room = null;
	var rHeight =  0;
	var rWidth =  0;
	var openings =null

	var cleaned = [];
	var str = RPG.Generator.Maze.mazeToStr(RPG.Generator.Maze.createMaze({
	    maze : {
		name : options.dungeon.name,
		height : options.dungeon.height * 2,
		width : options.dungeon.width * 2,
		sparse : 0,
		offsetRow : 0,
		offsetCol : 0
	    }
	},rand));
	var strRows = str.split('\r\n');
	var c = 0;
	var rooms = {};
	strRows.each(function(row) {
	    //console.log(row+'\r\n');
	    row = row.replace(/\+/gi,'w,');
	    row = row.replace(/[s]{6}/gi,'w,w,');
	    row = row.replace(/[e]{1}/gi,'w,');
	    row = row.replace(/[1]{3}/gi,'1,');
	    row = row.replace(/[2]{1}/gi,'2,');
	    row = row.replace(/[3]{3}/gi,'3,');
	    row = row.replace(/[-]{3}/gi,'w,');
	    row = row.replace(/\|/gi,'w,');
	    row = row.substring(0,row.length-1);
	    cleaned.push(row.split(','));
	});
	cleaned.pop();
	cleaned.pop();

	var maxH = 16; //min 12 otherwise bad things happen with circles :(
	var maxW = 16;

	r = 0;
	cleaned.each(function(row,rIdx,rows) {
	    c=0;
	    if (rIdx !=0 && rIdx != rows.length-1 && rIdx%2==0) return;
	    row.each(function(col, cIdx) {
		if (col == 'w' || (cIdx%2==0)) {
		    return;
		}

		if (!rooms[r]) rooms[r] = {};

		rHeight = Math.floor(rand.random(6,maxH));
		rWidth = Math.floor(rand.random(4,maxW));

		if (rand.random(0,100) > 50) {
		    rooms[r][c] = RPG.getRectangleArea([0,0],[rHeight,rWidth]);
		} else {
		    rooms[r][c] = RPG.getCircleArea([Math.floor(maxH/2),Math.floor(maxH/2)],Math.floor((maxH/2) - rand.random(0,3)));
		}
		room = rooms[r][c];

		RPG.dirs.each(function(dir){
		    var check = RPG[dir]([Number.from(rIdx),Number.from(cIdx)],1);
		    if (rows[check[0]] && rows[check[0]][check[1]] != 'w') {
			RPG.makeRandomOpening(room,dir);
		    }else {
			Object.erase(room.openings,dir);
		    }
		});

		c++;
	    });
	    r++;
	});
	r=0;
	Object.each(rooms,function(row,rowNum){
	    c=0;
	    Object.each(row,function(room,colNum){
		RPG.offsetArea(room,
		    Math.floor((((maxH)/2) - (room.height/2))+(r*(maxH+2))),RPG.s,
		    Math.floor((((maxW)/2) - (room.width/2))+((c)*(maxW+2))),RPG.e
		    );
		c++;
	    });
	    r++;
	});
	r = 0;


	Object.each(rooms,function(row,rowNum){
	    c=0;
	    Object.each(row,function(room,colNum){

		var randInterName = Object.getSRandom(Object.getFromPath(RPG.Tiles,options.dungeon.type+'.i'),rand,'options').key;
		var top = RPG.getRandomTileImage(options.dungeon.type+'.t',rand);
		var bottom = RPG.getRandomTileImage(options.dungeon.type+'.b.wall',rand);

		var corridors = [];
		var openings = [];
		RPG.dirs.each(function(dir){
		    if (typeOf(room.openings[dir]) == 'array') {
			var from = RPG[dir](room.openings[dir][0],1);
			var toRoom = RPG[dir]([Number.from(rowNum) || 0,Number.from(colNum) || 0],1);
			toRoom = rooms[toRoom[0]] && rooms[toRoom[0]][toRoom[1]];
			if (!toRoom || !toRoom.openings[RPG.dir_opp[dir]] || !toRoom.openings[RPG.dir_opp[dir]][0]) return;
			if (toRoom.openings[RPG.dir_opp[dir]+'_created']) {
			    openings.push({
				t:room.openings[dir]
			    });
			    return;
			}
			room.openings[dir+'_created']=true;
			toRoom.openings[RPG.dir_opp[dir]+'_created']=true;
			var to = RPG[RPG.dir_opp[dir]](toRoom.openings[RPG.dir_opp[dir]][0],1);
			corridors.push(RPG.pointToPointDraw(to,from,50));
			RPG.removeAreaPoints(corridors[corridors.length-1],
			    RPG.flattenArea([
				toRoom.perimeter.tops,
				toRoom.perimeter.bottoms.e,
				room.perimeter.tops,
				room.perimeter.bottoms.e,
				toRoom.openings[RPG.dir_opp[dir]],
				room.openings[dir]
				])
			    );
		    }
		});
		dungeon.roomAreas.push(room);
		dungeon.corridorAreas.push(Array.clone(corridors));
		corridors.push(room);

		RPG.paintRoomArea(dungeon.tiles,corridors,{
		    'perimeter.bottoms' : RPG.createTile(options.dungeon.type+'.b.wall',dungeon.cache,{
			property : {
			    tileName : bottom.name,
			    folderName : options.dungeon.name,
			    image : {
				name : bottom.image
			    }
			}
		    }),

		    'perimeter.tops' : RPG.createTile(options.dungeon.type+'.t',dungeon.cache,{
			property : {
			    tileName : top.name,
			    folderName : options.dungeon.name,
			    image : {
				name : top.image
			    }
			}
		    }),
		    'interior.all,path,openings' : RPG.createTile(['world','earth','floor'],dungeon.cache,{
			property : {
			    tileName : options.rooms.floor.substr(0,options.rooms.floor.lastIndexOf('.')),
			    folderName : options.dungeon.name,
			    image : {
				name : options.rooms.floor
			    }
			}
		    }),
		    'openings' : function(paintPath,area,point,index) {
			var dir = paintPath[paintPath.length-1];
			if ((((dir == 'n') && index == 1) ||
			    ((dir == 'e' || dir == 'w' || dir == 's') && index == 0)) &&
			!room.openings[dir+'_created']){

			    return RPG.createTile(options.room.door,dungeon.cache,{
				property : {
				    tileName : dir.charAt(0),
				    folderName : options.dungeon.name,
				    image : {
					name : dir.charAt(0)+'.png'
				    }
				}
			    });
			}
			return null;
		    },
		    'perimeter.bottoms.n' : function() {
			if (rand.random(0,100) < options.rooms['decor%']) {
			    var decor = RPG.getRandomTileImage(options.dungeon.type+'.b.decor',rand);
			    return RPG.createTile(options.dungeon.type+'.b.decor',dungeon.cache,{
				property : {
				    tileName : decor.name,
				    folderName : options.dungeon.name,
				    image : {
					name : decor.image,
					size : 50,
					top : 50,
					left : 50
				    }
				}
			    });
			}
			return null;
		    },
		    'interior.perimeter' : function(paintPath,area,point,index) {
			if (rand.random(0,100) < options.rooms['perim%']) {
			    var dir = paintPath[paintPath.length-1];
			    var perim = RPG.getRandomTileImage(options.dungeon.type+'.i.'+randInterName+'.'+paintPath[paintPath.length-1],rand);
			    return RPG.createTile(options.dungeon.type+'.i.'+randInterName+'.'+paintPath[paintPath.length-1],dungeon.cache,{
				property : {
				    tileName : perim.name,
				    folderName : options.dungeon.name,
				    image : {
					name : perim.image
				    }
				}
			    });
			}
			return null;
		    },
		    'center' : function(paintPath,area,point,index) {
			if (c != 0 && r != 0 && rand.random(0,100) < options.rooms['center%']) {
			    var center = RPG.getRandomTileImage(options.dungeon.type+'.i.'+randInterName+'.o',rand);
			    return RPG.createTile(options.dungeon.type+'.i.'+randInterName+'.o',dungeon.cache,{
				property : {
				    tileName : center.name,
				    folderName : options.dungeon.name,
				    image : {
					name : center.image
				    }
				}
			    });
			} else if (r==0 && c==0) {
			    dungeon.stairsUp = Array.clone(point);
			    return RPG.createTile(['world','earth','stair'],dungeon.cache,{
				property : {
				    tileName : 'u',
				    folderName : options.dungeon.name,
				    image : {
					name : 'u.png'
				    }
				}
			    });
			}
			return null;
		    }
		});
		c++;
	    });
	    r++;
	});
    }
}))();