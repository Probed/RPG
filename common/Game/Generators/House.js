if (!RPG) var RPG = {};
if (!RPG.Generator) RPG.Generator = {};

if (typeof exports != 'undefined') {
    Object.merge(RPG,require('./Utilities.js'));
    Object.merge(RPG,require('../Tiles/Utilities.js'));
    Object.merge(RPG,require('../Tiles/Tiles.js'));
    Object.merge(RPG,require('./Words.js'));
    Object.merge(RPG,require('./Generators.js'));
    Object.merge(RPG,require('./Equipment.js'));
    Object.merge(RPG,require('./Consumable.js'));
    module.exports = RPG;
}

RPG.Generator.House = new (RPG.Generator.HouseClass = new Class({
    Extends : RPG.MapGeneratorBaseClass,
    Implements : [Options],
    name : 'House',
    constraints : {
	properties : {
	    name : ["/^[a-zA-Z0-9_.]+$/",1,15,'g'],
	    seed : [0,99999999999,Math.floor((Math.random() * (99999999999 - 1) + 1))],
	    Difficulty : Object.keys(RPG.Difficulty),
	    level : [1,100,1]
	},
	house : {
	    type : RPG.tileFolderList(RPG.Tiles,'world.earth.room'),
	    rows : [2,4,2],
	    cols : [2,4,2]
	},
	property : {
	    lawn : RPG.tileFolderList(RPG.Tiles,'terrain.earth.solid'),
	    fence : RPG.tileFolderList(RPG.Tiles,'world.earth.fence'),
	    sidewalk : RPG.tileFolderList(RPG.Tiles,'world.earth.sidewalk'),
	    gate : RPG.tileFolderList(RPG.Tiles,'world.earth.gate'),
	    tree : RPG.tileFolderList(RPG.Tiles,'world.earth.tree'),
	    'tree%' : [0,100,10]
	},
	mainFloor : {
	    floor : Object.getFromPath(RPG.Tiles,'world.earth.floor.options.property.image.name'),
	    'decor%' : [0,100,25],
	    'perim%' : [0,100,25],
	    'center%' : [0,100,25],
	    door : RPG.tileFolderList(RPG.Tiles,'world.earth.door'),
	    doorsLocked : [false]
	},
	upStairs : {
	    allow : [true],
	    floor : Object.getFromPath(RPG.Tiles,'world.earth.floor.options.property.image.name'),
	    'decor%' : [0,100,25],
	    'perim%' : [0,100,25],
	    'center%' : [0,100,25],
	    door : RPG.tileFolderList(RPG.Tiles,'world.earth.door')
	},
	downStairs : {
	    allow : [true],
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

    generate : function(options,rand,callback) {
	rand = rand || RPG.Random;
	rand.seed = options.properties.seed || rand.seed;


	options.house.rows = Math.floor(Number.from(options.house.rows));
	options.house.cols = Math.floor(Number.from(options.house.cols));

	var house = {
	    cache : {},
	    tiles : {},
	    propertyArea : null,
	    roomAreas : [],
	    corridorAreas : [],
	    frontGate : null,
	    backGate : null,
	    frontDoor : null,
	    backDoor : null,
	    stairsUp : null,
	    starsDown : null,
	    possibleStartLocations : []
	};

	this.createHouse(options,rand,house);

	callback(house);
    },

    createHouse : function(options,rand,house) {
	rand = rand || RPG.Random;
	var rooms = {};
	var i = 0;
	var r = 0;
	var c = 0;
	var maxH = 11;
	var maxW = 11;
	var totalRowHeight = 0;
	var tWidth = 0;
	var largestHeight=0;
	var totalColWidth=0;

	var fDoor = null;
	var bDoor = null;
	var fGate = null;
	var bGate = null;


	options.house.rows = Number.from(options.house.rows);
	options.house.cols = Number.from(options.house.cols);
	for(r=0;r<options.house.rows;r++) {

	    tWidth = 0;
	    for(c=0;c<options.house.cols;c++) {
		if (!rooms[r]) rooms[r] = {};

		var rHeight = Math.floor(rand.random(6,maxH));
		var rWidth = Math.floor(rand.random(4,maxW));

		if (rand.random(0,100) > 50) {
		    rooms[r][c] = RPG.getRectangleArea([0,0],[rHeight,rWidth]);
		} else {
		    rooms[r][c] = RPG.getCircleArea([Math.floor(maxH/2),Math.floor(maxH/2)],Math.floor((maxH/2) - rand.random(0,0)));
		}
		var room = rooms[r][c];

		RPG.dirs.each(function(dir){
		    if ((r>0 && dir == 'n') ||
			(c>0 && dir == 'w') ||
			(r<options.house.rows-1 && dir == 's') ||
			(c<options.house.cols-1 && dir == 'e')) {
			RPG.makeRandomOpening(room,dir);
		    } else {
			if (r==0 && c == 0 && dir == 'n') {
			    bDoor = RPG.makeRandomOpening(room,dir);
			} else if (r==options.house.rows-1 && c==options.house.cols-1 && dir == 's') {
			    fDoor = RPG.makeRandomOpening(room,dir);
			} else {
			    Object.erase(room.openings,dir);
			}
		    }
		});
		tWidth += room.width + 3;
		if (tWidth > totalColWidth) {
		    totalColWidth = tWidth;
		}
		if (largestHeight < room.height) {
		    largestHeight = room.height;
		}
	    }
	    totalRowHeight += largestHeight + 2;
	}
	totalRowHeight += 4;
	totalColWidth += 3;

	var pArea = RPG.getRectangleArea([0,0],[totalRowHeight,totalColWidth]);
	bGate = RPG.makeRandomOpening(pArea,'n');
	fGate = RPG.makeRandomOpening(pArea,'s');
	Object.erase(pArea.openings,'e');
	Object.erase(pArea.openings,'w');

	r=0;
	totalColWidth = 0;
	tWidth = 3;
	totalRowHeight = 3;

	Object.each(rooms,function(row,rowNum){
	    c=0;
	    largestHeight = 3;
	    Object.each(row,function(room,colNum){
		RPG.offsetArea(room,
		    totalRowHeight,RPG.s,
		    tWidth,RPG.e
		    );
		tWidth += room.width + 3;
		if (largestHeight < room.height) {
		    largestHeight = room.height;
		}
		c++;
	    });
	    tWidth = 3;
	    totalRowHeight += largestHeight + 2;
	    r++;
	});

	/**
	 * Randomly select things to paint
	 */

	var lawn = RPG.getRandomTileImage(options.property.lawn,rand);
	var gate = RPG.getRandomTileImage(options.property.gate,rand);
	var tree = RPG.getRandomTileImage(options.property.tree,rand);
	var top = RPG.getRandomTileImage(options.house.type+'.t',rand);
	var bottom = RPG.getRandomTileImage(options.house.type+'.b.wall',rand);
	r=0;
	Object.each(rooms,function(row,rowNum){
	    c=0;
	    Object.each(row,function(room,colNum){
		var corridors = [];
		var randInterName = Object.getSRandom(Object.getFromPath(RPG.Tiles,options.house.type+'.i'),rand,'options').key;

		RPG.dirs.each(function(dir){
		    if (typeOf(room.openings[dir]) == 'array') {
			var from = RPG[dir](room.openings[dir][0],1);
			var toRoom = RPG[dir]([Number.from(rowNum) || 0,Number.from(colNum) || 0],1);
			toRoom = rooms[toRoom[0]] && rooms[toRoom[0]][toRoom[1]];
			if (!toRoom || !toRoom.openings[RPG.dir_opp[dir]] || !toRoom.openings[RPG.dir_opp[dir]][0]) return;
			if (toRoom.openings[RPG.dir_opp[dir]+'_created']) {
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

		house.corridorAreas.push(Array.clone(corridors));
		house.roomAreas.push(room);
		corridors.push(room);

		RPG.paintRoomArea(house.tiles,corridors,{
		    'perimeter.bottoms' : RPG.createTile(options.house.type+'.b.wall',house.cache,{
			property : {
			    tileName : bottom.name,
			    folderName : options.properties.name,
			    image : {
				name : bottom.image
			    }
			}
		    }),

		    'perimeter.tops' : RPG.createTile(options.house.type+'.t',house.cache,{
			property : {
			    tileName : top.name,
			    folderName : options.properties.name,
			    image : {
				name : top.image
			    }
			}
		    }),
		    'perimeter.bottoms.n' : function() {
			if (rand.random(0,100) < options.mainFloor['decor%']) {
			    var decor = RPG.getRandomTileImage(options.house.type+'.b.decor',rand);
			    return RPG.createTile(options.house.type+'.b.decor',house.cache,{
				property : {
				    tileName : decor.name,
				    folderName : options.properties.name,
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
			if (rand.random(0,100) < options.mainFloor['perim%']) {
			    var perim = RPG.getRandomTileImage(options.house.type+'.i.'+randInterName+'.'+paintPath[paintPath.length-1],rand);
			    return RPG.createTile(options.house.type+'.i.'+randInterName+'.'+paintPath[paintPath.length-1],house.cache,{
				property : {
				    tileName : perim.name,
				    folderName : options.properties.name,
				    image : {
					name : perim.image
				    }
				}
			    });
			}
			return null;
		    },
		    'center' : function(paintPath,area,point,index) {
			if (c != 0 && r != 0 && rand.random(0,100) < options.mainFloor['center%']) {
			    var center = RPG.getRandomTileImage(options.house.type+'.i.'+randInterName+'.o',rand);
			    return RPG.createTile(options.house.type+'.i.'+randInterName+'.o',house.cache,{
				property : {
				    tileName : center.name,
				    folderName : options.properties.name,
				    image : {
					name : center.image
				    }
				}
			    });
			} else if (r==0 && c==0 && options.upStairs.allow) {
			    return RPG.createTile(['world','earth','stair'],house.cache,{
				property : {
				    tileName : 'u',
				    folderName : options.properties.name,
				    image : {
					name : 'u.png'
				    }
				}
			    });
			}
			return null;
		    },
		    'interior.all,path,openings' : function(paintPath,area,point,index) {
			RPG.unshiftTile(house.tiles, point,
			    RPG.createTile(['world','earth','floor'],house.cache,{
				property : {
				    tileName : options.mainFloor.floor.substr(0,options.mainFloor.floor.lastIndexOf('.')),
				    folderName : options.properties.name,
				    image : {
					name : options.mainFloor.floor
				    }
				}
			    }));
			if (rand.random() <= 0.01) {
			    RPG.pushTile(house.tiles, point,
				RPG.createTile(['world','earth','lever'],house.cache,{
				    property : {
					tileName : point.join(''),
					folderName : options.properties.name,
					image : {
					    name : 'open.png'
					}
				    },
				    'switch' : {
					state : 'Open',
					states : {
					    'Open' : [{
						path : (options.properties.name+'.world.earth.lever.'+point.join('')).split('.'),
						options : JSON.encode({
						    property : {
							image : {
							    name : 'open.png'
							}
						    },
						    'switch' : {
							state : 'Open'
						    }
						})
					    }],
					    'Closed' : [{
						path : (options.properties.name+'.world.earth.lever.'+point.join('')).split('.'),
						options : JSON.encode({
						    property : {
							image : {
							    name : 'closed.png'
							}
						    },
						    'switch' : {
							state : 'Closed'
						    }
						})
					    }]
					}
				    }
				}));
			}
			if (rand.random() <= 0.01) {
			    RPG.pushTile(house.tiles, point,
				RPG.createTile(['world','earth','trap'],house.cache,{
				    property : {
					tileName : point.join(''),
					folderName : options.properties.name
				    },
				    trap : {
					seed : rand.random(0,99999999999)
				    }
				}));
			}
			if (rand.random() <= 0.15) {
			    var randGen = Object.getSRandom(RPG.Generators.Item,rand);
			    var results = RPG.Generator[randGen.key].generate({
				properties : {
				    name : options.properties.name,
				    seed : rand.seed,
				    Difficulty : options.properties.Difficulty,
				    level : options.properties.level,
				    point : point
				}
			    },rand);
			    Object.merge(house.cache,results.cache);
			    RPG.pushTile(house.tiles,point,results.path);

			}
			if (rand.random() <= 0.05) {
			    RPG.pushTile(house.tiles, point,
				RPG.createTile(['npc','earth','monster'],house.cache,{
				    property : {
					tileName : RPG.Generator.Name.generate({
					    name : {
						length:rand.random(4,8),
						seed : rand.seed
					    }
					},rand),
					folderName : options.properties.name,
					image : {
					    name : RPG.getRandomTileImage('npc.earth.monster',rand).image
					}
				    },
				    npc : RPG.Constraints.random(RPG.Tiles.npc.options.npc,rand),
				    roam : Object.merge(RPG.Constraints.random(RPG.Tiles.npc.options.roam,rand),{
					home : point,
					distance : 0
				    })
				}));
			}
		    },
		    'openings' : function(paintPath,area,point,index) {
			var dir = paintPath[paintPath.length-1];
			if ((((dir == 'n') && index == 1) ||
			    ((dir == 'e' || dir == 'w' || dir == 's') && index == 0)) &&
			!room.openings[dir+'_created']){
			    if (dir == 'n') {
				RPG.removeAreaPoint(room.area,RPG.n(point,1));
				RPG.pushTiles(house.tiles,RPG.n(point,1),[
				    RPG.createTile(options.property.lawn,house.cache,{
					property : {
					    tileName : lawn.name,
					    folderName : options.properties.name,
					    image : {
						name : lawn.image
					    }
					}
				    }),
				    options.property.sidewalk]);
			    }
			    return RPG.createTile(options.mainFloor.door,house.cache,{
				property : {
				    tileName : dir.charAt(0),
				    folderName : options.properties.name,
				    image : {
					name : dir.charAt(0)+'.png'
				    }
				},
				lockable : {
				    locked : options.mainFloor.doorsLocked,
				    Difficulty : options.properties.Difficulty,
				    level : options.properties.level,
				    seed : options.properties.seed
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

	var property = {};

	RPG.paintRoomArea(property,pArea,{
	    'area,openings' : RPG.createTile(options.property.lawn,house.cache,{
		property : {
		    tileName : lawn.name,
		    folderName : options.properties.name,
		    image : {
			name : lawn.image
		    }
		}
	    }),
	    'openings' : function(paintPath,area,point,index) {
		if (index == 0) {
		    return [
		    options.property.sidewalk.split('.'),
		    RPG.createTile(options.property.gate,house.cache,{
			property : {
			    tileName : gate.name,
			    folderName : options.properties.name,
			    image : {
				name : gate.image
			    }
			}
		    })
		    ];
		}
		return null;
	    },

	    'perimeter.tops.n,perimeter.tops.e,perimeter.tops.w,perimeter.bottoms.s' : options.property.fence,

	    'interior.all' : function(paintPath,area,point,index) {
		if (rand.random(0,100) < options.property['tree%']) {
		    return RPG.createTile(options.property.tree,house.cache,{
			property : {
			    tileName :  tree.name,
			    folderName : options.properties.name,
			    image : {
				name : tree.image
			    }
			}
		    });
		}
		return null;
	    }
	});

	Object.merge(property,house.tiles);
	house.tiles = property;

	var sidewalks = RPG.pointsToPointsDraw([RPG.s(fDoor[0],1),RPG.n(bDoor[0],1)],[RPG.n(fGate[0],1),RPG.s(bGate[0],1)],50);
	Object.each(sidewalks,function(sidewalk) {
	    RPG.paintRoomArea(house.tiles,sidewalk,{
		'path' : options.property.sidewalk
	    });
	});

	RPG.orientTiles(house.tiles,options.property.fence, function(orientation,point) {
	    if (orientation) {
		RPG.replaceTile(house.tiles,options.property.fence,point,
		    RPG.createTile(options.property.fence,house.cache,{
			property : {
			    tileName : orientation,
			    folderName : options.properties.name,
			    image : {
				name : orientation+'.png'
			    }
			}
		    })
		    );
	    }
	});

	RPG.orientTiles(house.tiles,options.property.sidewalk, function(orientation,point) {
	    if (orientation) {
		RPG.replaceTile(house.tiles,options.property.sidewalk,point,
		    RPG.createTile(options.property.sidewalk,house.cache,{
			property : {
			    tileName : orientation,
			    folderName : options.properties.name,
			    image : {
				name : orientation+'.png'
			    }
			}
		    })
		    );
	    }
	});

	house.frontDoor = fDoor[0];
	house.backDoor = bDoor[0];
	house.frontGate = fGate[0];
	house.backGate = bGate[0];
	house.propertyArea = pArea;
	house.possibleStartLocations.push(house.frontGate,house.backGate);
    }
}))();