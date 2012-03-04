if (!RPG) var RPG = {};
if (!RPG.Generator) RPG.Generator = {};

if (typeof exports != 'undefined') {
    Object.merge(RPG,require('./Utilities.js'));
    Object.merge(RPG,require('../Tiles/Utilities.js'));
    Object.merge(RPG,require('../Tiles/Tiles.js'));
    Object.merge(RPG,require('./Words.js'));
    Object.merge(RPG,require('./diamond-square.js'));
    module.exports = RPG;
}

RPG.Generator.Terrain = new (RPG.Generator.TerrainClass = new Class({
    Implements : [Options],
    constraints : {
	terrain : {
	    name : ['/^[a-zA-Z0-9_.]+$/',1,20,'G'],
	    size : ['32','64','128','256','64'],
	    seed : [0,99999999999,Math.floor((Math.random() * (99999999999 - 1) + 1))],
	    choas : [0.1,0.9,0.5],
	    smoothTerrain : [0,5,5],
	    seaLevel : [-1,1,0],
	    maxRivers : [0,10,0],
	    road :  RPG.tileFolderList(RPG.Tiles,'world.earth.road'),
	    cities : [0,10,5],
	    treeCoverage : [0,100,75]
	}
    },
    options : {},
    initialize : function(options) {
	this.setOptions(options);
    },

    /**
     * random
     *
     * returns object {
     * terrain : {}
     * universe: {
     *	maps : {
     *	    [mapName] = {
     *		tiles : {},
     *		cache : {}
     *		}
     *	    }
     *	}
     * }
     */
    random : function(mapName,rand) {
	rand = rand || RPG.Random;

	var universe = {
	    maps : {}
	};
	var map = universe.maps[mapName] = {};
	map.options = {};
	map.options.generator = {
	    Terrain : {
		options : RPG.optionCreator.random(this.constraints,rand)
	    }
	};

	var terrain = RPG.Generator.Terrain.generate(map.options.generator.Terrain.options,rand);

	map.tiles = terrain.tiles;
	map.cache = terrain.cache;

	return {
	    options : map.options.generator.Terrain.options,
	    universe : universe,
	    generated : terrain
	};
    },

    generate : function(options,rand) {
	var x = 0;
	var y = 0;
	var heightMap1D = [];
	var terrain = {
	    tiles : {},
	    cache : {}
	};
	rand = rand || RPG.Random;
	rand.seed = options.terrain.seed || rand.seed;

	RPG.fill2DFractArray(heightMap1D,Number.from(options.terrain.size),Number.from(options.terrain.seed),-7,Number.from(options.terrain.choas),rand);
	if (options.terrain.smoothTerrain) {
	    for(x = 0; x<options.terrain.smoothTerrain; x++) {
		heightMap1D = RPG.boxFilterHeightMap(Number.from(options.terrain.size), Number.from(options.terrain.size), heightMap1D, true);
	    }
	}
	var avg = heightMap1D.average() + Number.from(options.terrain.seaLevel);//determine the average height of everything

	//RPG.generateRivers(heightMap1D,terrain.size,avg, -0.7,Number.from(terrain.maxRivers),10);
	terrain.heightMap2D = {};
	terrain.liquid = {};
	terrain.solid = {};
	terrain.deep = {};
	terrain.shallow = {};
	terrain.sand = {};
	terrain.swamp = {};
	terrain.grass = {};
	terrain.dirt = {};
	terrain.rock = {};
	terrain.mountain = {};

	for(x=0; x<options.terrain.size;x++) {
	    for(y=0; y<options.terrain.size;y++){
		var val = heightMap1D[(x*options.terrain.size)+y];

		//build a 2d version of the heightmap
		if (!terrain.heightMap2D[x]) terrain.heightMap2D[x] = {};
		terrain.heightMap2D[x][y] = val;


		if (val < (avg-1.25)) {
		    if (!terrain.liquid[x]) terrain.liquid[x] = {};
		    if (!terrain.deep[x]) terrain.deep[x] = {};
		    terrain.liquid[x][y] = terrain.deep[x][y] = [RPG.createTile(['terrain','earth','liquid','deep'],terrain.cache,{
			property : {
			    tileName : '1',
			    folderName : options.terrain.name,
			    image : {
				name : '1.png'
			    }
			}
		    })];

		} else if (val < (avg-0.65)) {
		    if (!terrain.liquid[x]) terrain.liquid[x] = {};
		    if (!terrain.shallow[x]) terrain.shallow[x] = {};
		    terrain.liquid[x][y] = terrain.shallow[x][y] = [RPG.createTile(['terrain','earth','liquid','shallow'],terrain.cache,{
			property : {
			    tileName : '1',
			    folderName : options.terrain.name,
			    image : {
				name : '1.png'
			    }
			}
		    })];

		} else if (val < (avg-0.50)) {
		    if (!terrain.solid[x]) terrain.solid[x] = {};
		    if (!terrain.sand[x]) terrain.sand[x] = {};
		    terrain.solid[x][y] = terrain.sand[x][y] = [RPG.createTile(['terrain','earth','solid','sand'],terrain.cache,{
			property : {
			    tileName : '1',
			    folderName : options.terrain.name,
			    image : {
				name : '1.png'
			    }
			}
		    })];

		} else if (val < (avg-0.45)) {
		    if (!terrain.solid[x]) terrain.solid[x] = {};
		    if (!terrain.swamp[x]) terrain.swamp[x] = {};
		    terrain.solid[x][y] = terrain.swamp[x][y] = [RPG.createTile(['terrain','earth','solid','swamp'],terrain.cache,{
			property : {
			    tileName : '1',
			    folderName : options.terrain.name,
			    image : {
				name : '1.png'
			    }
			}
		    })];

		} else if (val < avg+0.15) {
		    if (!terrain.solid[x]) terrain.solid[x] = {};
		    if (!terrain.grass[x]) terrain.grass[x] = {};
		    terrain.solid[x][y] = terrain.grass[x][y] = [RPG.createTile(['terrain','earth','solid','grass'],terrain.cache,{
			property : {
			    tileName : '1',
			    folderName : options.terrain.name,
			    image : {
				name : '1.png'
			    }
			}
		    })];

		} else if (val < avg+0.75) {
		    if (!terrain.solid[x]) terrain.solid[x] = {};
		    if (!terrain.grass[x]) terrain.grass[x] = {};

		    if (val < avg+0.30) {
			terrain.solid[x][y] = terrain.grass[x][y] = [RPG.createTile(['terrain','earth','solid','grass'],terrain.cache,{
			    property : {
				tileName : '2',
				folderName : options.terrain.name,
				image : {
				    name : '2.png'
				}
			    }
			})];
		    } else {
			terrain.solid[x][y] = terrain.grass[x][y] = [RPG.createTile(['terrain','earth','solid','grass'],terrain.cache,{
			    property : {
				tileName : '3',
				folderName : options.terrain.name,
				image : {
				    name : '3.png'
				}
			    }
			})];
		    }

		} else if (val < (avg+1.25)) {
		    if (!terrain.solid[x]) terrain.solid[x] = {};
		    if (!terrain.dirt[x]) terrain.dirt[x] = {};

		    if (val < (avg+1.0)) {
			terrain.solid[x][y] = terrain.dirt[x][y] = [RPG.createTile(['terrain','earth','solid','dirt'],terrain.cache,{
			    property : {
				tileName : '1',
				folderName : options.terrain.name,
				image : {
				    name : '1.png'
				}
			    }
			})];
		    } else {
			terrain.solid[x][y] = terrain.dirt[x][y] = [RPG.createTile(['terrain','earth','solid','dirt'],terrain.cache,{
			    property : {
				tileName : '2',
				folderName : options.terrain.name,
				image : {
				    name : '2.png'
				}
			    }
			})];
		    }

		} else if (val < (avg+2.2)) {
		    if (!terrain.solid[x]) terrain.solid[x] = {};
		    if (!terrain.rock[x]) terrain.rock[x] = {};
		    terrain.solid[x][y] = terrain.rock[x][y] = [RPG.createTile(['terrain','earth','solid','rock'],terrain.cache,{
			property : {
			    tileName : '1',
			    folderName : options.terrain.name,
			    image : {
				name : '1.png'
			    }
			}
		    })];

		} else {
		    if (!terrain.rock[x]) terrain.rock[x] = {};
		    if (!terrain.solid[x]) terrain.solid[x] = {};
		    terrain.solid[x][y] = terrain.rock[x][y] = [
		    RPG.createTile(['terrain','earth','solid','rock'],terrain.cache,{
			property : {
			    tileName : '2',
			    folderName : options.terrain.name,
			    image : {
				name : '2.png'
			    }
			}
		    }),
		    RPG.createTile(['world','earth','mountian'],terrain.cache,{
			property : {
			    tileName : '1',
			    folderName : options.terrain.name,
			    image : {
				name : '1.png'
			    }
			}
		    })];
		}
		val = null;
	    }
	}

	x = y = avg = heightMap1D = null;

	this.generateCities(options,rand,terrain);
	this.connectCities(options,rand,terrain);
	this.generateBuildings(options,rand,terrain);
	this.generateTrees(options,rand,terrain);

	/**
     * Merge the maps together into the final map.
     */
	terrain.tiles = {};
	RPG.mergeTiles(terrain.tiles,[
	    terrain.solid,
	    terrain.liquid,
	    terrain.roads,
	    terrain.city,
	    terrain.swampHut,
	    terrain.barn,
	    terrain.tipi,
	    terrain.cave,
	    terrain.trees
	    ]);

	return terrain;
    },

    /**
     * takes the options object returned from generateTerrain
     */
    generateCities : function(options,rand,terrain) {
	//rand = rand || RPG.Random;
	terrain.city = {};
	options.terrain.cities = Math.floor(Number.from(options.terrain.cities));
	for (var x = 0; x<options.terrain.cities; x++) {
	    var randRow = Object.getSRandom(terrain.solid,rand);
	    var randCol = Object.getSRandom(randRow.rand,rand);

	    if (!terrain.city[randRow.key]) terrain.city[randRow.key] = {};
	    terrain.city[randRow.key][randCol.key] = [RPG.createTile(['world','earth','building','cityscape'],terrain.cache,{
		property : {
		    tileName : 'City of ' + RPG.Generator.Name.generate({
			name : {
			    length:rand.random(4,8),
			    seed : rand.seed
			}
		    },rand),
		    folderName : options.terrain.name,
		    image : {
			name : 'modernCity.png'
		    }
		}
	    })];
	}

    },

    connectCities : function(options,rand,terrain) {
	rand = rand || RPG.Random;
	/**
	 * Connect the cities together
	 * cloned because connect removes cities upon connection
	 */

	var connect = Object.clone(terrain.city);
	terrain.roads = {};
	var checked = {};
	Object.each(connect,function(row,rowNum){
	    rowNum = Number.from(rowNum);
	    Object.each(row,function(col,colNum){
		colNum = Number.from(colNum);
		if (!connect[rowNum] || !connect[rowNum][colNum] || (Object.keys(connect).length<=1)) return;
		var cityFound = false;
		//at most look 256 tiles away for another city
		for (var x = 4;x<256; x++) {

		    //start at the top right point '-x' and go to '+x'
		    for (var r = -x;r<x; r++) {

			//start at column '-x' goto column '+x'
			for (var c = -x;c<x; c++) {


			    if ((r > -x+1 && r < x-1 && c > (-x+1) && c < (x-1)) || (checked[rowNum+r] && checked[rowNum+r][colNum+c])) {
			    //skip checked columns
			    } else {


				//check tile for city
				if (connect[rowNum+r] && connect[rowNum+r][colNum+c]) {

				    //connect the two cities with roads
				    this.generateRoad({
					fromRow : rowNum+1,
					fromCol : colNum,
					toRow : rowNum+r+1,
					toCol : colNum+c,
					roads : terrain.roads,
					road : options.terrain.road
				    },rand,terrain);
				    cityFound = true;
				    Object.erase(connect[rowNum],colNum);//remove the city from the list
				    Object.erase(connect,rowNum);
				    break;
				} else {
				    if (!checked[rowNum+r]) checked[rowNum+r] = {};
				    checked[rowNum+r][colNum+c] = true;
				}
			    }
			}
			if (cityFound) {
			    break;
			}
		    }
		    if (cityFound) {
			break;
		    }
		}
	    }.bind(this));
	}.bind(this));

	/**
     * place roads
     *
     */
	var clonedRoads = Object.clone(terrain.roads,rand);
	Object.each(terrain.roads,function(row,rowNum) {
	    rowNum = Number.from(rowNum);
	    Object.each(row,function(road,colNum) {
		colNum = Number.from(colNum);
		var orientation = RPG.getTileOrientation(clonedRoads,options.terrain.road,[rowNum,colNum]);
		if (orientation) {
		    RPG.replaceTile(terrain.roads,options.terrain.road,[rowNum,colNum],
			RPG.createTile(options.terrain.road,terrain.cache,{
			    property : {
				tileName : orientation,
				folderName : options.terrain.name,
				image : {
				    name : orientation+'.png'
				}
			    }
			})
			);
		}
	    });
	});
	clonedRoads = null;
    },

    generateRoad : function(options,rand,terrain) {
	rand = rand || RPG.Random;
	var row = options.fromRow;
	var col = options.fromCol;
	if (!terrain.roads[row-1]) {
	    terrain.roads[row-1] = {};
	}
	terrain.roads[row-1][col] = [options.road.split('.')];

	if (!terrain.roads[options.toRow-1]) {
	    terrain.roads[options.toRow-1] = {};
	}
	terrain.roads[options.toRow-1][options.toCol] = [options.road.split('.')];

	/**
     * Loop through adding/removing rows/cols till we get to the end point
     */
	for (var p = 0;p<256; p++) {

	    var rChange = (options.toRow > row?1:(options.toRow == row?0:-1));
	    var cChange = (options.toCol > col?1:(options.toCol == col?0:-1));

	    if (rChange != 0 && cChange !=0) {
		if (rand.random(0,100) > 30) {
		    rChange = 0;
		} else {
		    cChange = 0;
		}
	    }
	    if (!terrain.roads[row]) terrain.roads[row] = {};
	    terrain.roads[row][col] = [options.road.split('.')];

	    if (row == options.toRow && col == options.toCol) {
		break;
	    }
	    row += rChange;
	    col += cChange;
	}
	row = p = null;

    },

    generateTrees : function(options,rand,terrain) {
	rand = rand || RPG.Random;
	terrain.trees = {};
	options.terrain.treeCoverage = Number.from(options.terrain.treeCoverage);

	Object.each(terrain.solid,function(row,rowNum){
	    Object.each(row,function(col,colNum){
		if (rand.random(0,100) <= options.terrain.treeCoverage) {

		    if ((terrain.city && terrain.city[rowNum] && terrain.city[rowNum][colNum]) ||
			(terrain.roads && terrain.roads[rowNum] && terrain.roads[rowNum][colNum]) ||
			(terrain.cave && terrain.cave[rowNum] && terrain.cave[rowNum][colNum]) ||
			(terrain.tipi && terrain.tipi[rowNum] && terrain.tipi[rowNum][colNum])){

		    //ignore roads and cities

		    } else {
			if (!terrain.trees[rowNum]) terrain.trees[rowNum] = {};
			if ((terrain.dirt && terrain.dirt[rowNum] && terrain.dirt[rowNum][colNum])) {
			    terrain.trees[rowNum][colNum] = [RPG.createTile(['world','earth','tree','conifer'],terrain.cache,{
				property : {
				    tileName : '1',
				    folderName : options.terrain.name,
				    image : {
					name : '1.png'
				    }
				}
			    })];
			} else if ((terrain.grass && terrain.grass[rowNum] && terrain.grass[rowNum][colNum])) {
			    if (rand.random(0,100) <= 20) {
				terrain.trees[rowNum][colNum] = [RPG.createTile(['world','earth','shrub'],terrain.cache,{
				    property : {
					tileName : '1',
					folderName : options.terrain.name,
					image : {
					    name : '1.png'
					}
				    }
				})];
			    }

			} else if ((terrain.sand && terrain.sand[rowNum] && terrain.sand[rowNum][colNum])) {
			    if (rand.random(0,100) <= 50) {
				terrain.trees[rowNum][colNum] = [RPG.createTile(['world','earth','tree','palm'],terrain.cache,{
				    property : {
					tileName : '2',
					folderName : options.terrain.name,
					image : {
					    name : '2.png'
					}
				    }
				})];
			    } else {
				terrain.trees[rowNum][colNum] = [RPG.createTile(['world','earth','shrub'],terrain.cache,{
				    property : {
					tileName : '3',
					folderName : options.terrain.name,
					image : {
					    name : '3.png'
					}
				    }
				})];
			    }

			} else if ((terrain.rock && terrain.rock[rowNum] && terrain.rock[rowNum][colNum])) {
			    terrain.trees[rowNum][colNum] = [RPG.createTile(['world','earth','tree','pine'],terrain.cache,{
				property : {
				    tileName : '1',
				    folderName : options.terrain.name,
				    image : {
					name : '1.png'
				    }
				}
			    })];
			}
		    }
		}
	    });
	});
    },

    generateBuildings : function(options,rand,terrain) {
	rand = rand || RPG.Random;
	terrain.swampHut = {};
	//swamp buildings
	Object.each(terrain.swamp,function(row,rowNum){
	    rowNum = Number.from(rowNum);
	    Object.each(row,function(col,colNum){
		if (rand.random(0,100) <= 10) {
		    colNum = Number.from(colNum);
		    var above = !!(terrain.swampHut[rowNum-1] && terrain.swampHut[rowNum-1][colNum]);
		    var below = !!(terrain.swampHut[rowNum+1] && terrain.swampHut[rowNum+1][colNum]);
		    var left = !!(terrain.swampHut[rowNum] && terrain.swampHut[rowNum][colNum-1]);
		    var right = !!(terrain.swampHut[rowNum] && terrain.swampHut[rowNum][colNum+1]);

		    if ((terrain.city && terrain.city[rowNum] && terrain.city[rowNum][colNum]) ||
			(terrain.roads && terrain.roads[rowNum] && terrain.roads[rowNum][colNum]) ||
			(above || below || left || right)) {
		    //ignore roads and cities

		    } else {
			if (!terrain.swampHut[rowNum]) terrain.swampHut[rowNum] = {};
			terrain.swampHut[rowNum][colNum] = [RPG.createTile(['world','earth','building','hut'],terrain.cache,{
			    property : {
				tileName : RPG.Generator.Name.generate({
				    name : {
					length:rand.random(4,8),
					seed : rand.seed
				    }
				},rand) + "'s Swamp Hut",
				folderName : options.terrain.name,
				image : {
				    name : 'h1.png'
				}
			    }
			})];
		    }
		}
	    });
	});

	terrain.barn = {};
	//swamp buildings
	Object.each(terrain.grass,function(row,rowNum){
	    rowNum = Number.from(rowNum);
	    Object.each(row,function(col,colNum){
		if (rand.random(0,100) <= 3) {
		    colNum = Number.from(colNum);
		    var above = !!(terrain.barn[rowNum-1] && terrain.barn[rowNum-1][colNum]);
		    var below = !!(terrain.barn[rowNum+1] && terrain.barn[rowNum+1][colNum]);
		    var left = !!(terrain.barn[rowNum] && terrain.barn[rowNum][colNum-1]);
		    var right = !!(terrain.barn[rowNum] && terrain.barn[rowNum][colNum+1]);

		    if ((terrain.city && terrain.city[rowNum] && terrain.city[rowNum][colNum]) ||
			(terrain.roads && terrain.roads[rowNum] && terrain.roads[rowNum][colNum]) ||
			(above || below || left || right)) {
		    //ignore roads and cities

		    } else {
			if (!terrain.barn[rowNum]) terrain.barn[rowNum] = {};
			if (rand.random(0,100) <= 50) {
			    terrain.barn[rowNum][colNum] = [RPG.createTile(['world','earth','building','hut'],terrain.cache,{
				property : {
				    tileName : RPG.Generator.Name.generate({
					name : {
					    length:rand.random(4,8),
					    seed : rand.seed
					}
				    },rand) + "'s Barn",
				    folderName : options.terrain.name,
				    image : {
					name : 'h3.png'
				    }
				}
			    })];
			} else {
			    terrain.barn[rowNum][colNum] = [RPG.createTile(['world','earth','building','hut'],terrain.cache,{
				property : {
				    tileName : RPG.Generator.Name.generate({
					name : {
					    length:rand.random(4,8),
					    seed : rand.seed
					}
				    },rand) + "'s Farm",
				    folderName : options.terrain.name,
				    image : {
					name : 'h2.png'
				    }
				}
			    })];
			}
		    }
		}
	    });
	});

	terrain.tipi = {};
	//swamp buildings
	Object.each(terrain.dirt,function(row,rowNum){
	    Object.each(row,function(col,colNum){
		if (rand.random(0,100) <= 5) {

		    if ((terrain.city && terrain.city[rowNum] && terrain.city[rowNum][colNum]) ||
			(terrain.roads && terrain.roads[rowNum] && terrain.roads[rowNum][colNum])) {
		    //ignore roads and cities

		    } else {
			if (!terrain.tipi[rowNum]) terrain.tipi[rowNum] = {};
			terrain.tipi[rowNum][colNum] = [RPG.createTile(['world','earth','building','hut'],terrain.cache,{
			    property : {
				tileName : RPG.Generator.Name.generate({
				    name : {
					length:rand.random(4,8),
					seed : rand.seed
				    }
				},rand) + " Tribe",
				folderName : options.terrain.name,
				image : {
				    name : 'h4.png'
				}
			    }
			})];
		    }
		}
	    });
	});

	terrain.cave = {};
	//swamp buildings
	Object.each(terrain.rock,function(row,rowNum){
	    rowNum = Number.from(rowNum);
	    Object.each(row,function(col,colNum){
		if (rand.random(0,100) <= 5) {

		    colNum = Number.from(colNum);
		    var above = !!(terrain.cave[rowNum-1] && terrain.cave[rowNum-1][colNum]);
		    var below = !!(terrain.cave[rowNum+1] && terrain.cave[rowNum+1][colNum]);
		    var left = !!(terrain.cave[rowNum] && terrain.cave[rowNum][colNum-1]);
		    var right = !!(terrain.cave[rowNum] && terrain.cave[rowNum][colNum+1]);

		    if ((terrain.city && terrain.city[rowNum] && terrain.city[rowNum][colNum]) ||
			(terrain.roads && terrain.roads[rowNum] && terrain.roads[rowNum][colNum]) ||
			(above || below || left || right)) {
		    //ignore roads and cities

		    } else {
			if (!terrain.cave[rowNum]) terrain.cave[rowNum] = {};
			if (rand.random(0,100) <= 50) {
			    terrain.cave[rowNum][colNum] = [RPG.createTile(['world','earth','building','cave'],terrain.cache,{
				property : {
				    tileName : RPG.Generator.Name.generate({
					name : {
					    length:rand.random(4,8),
					    seed : rand.seed
					}
				    },rand) + " opening",
				    folderName : options.terrain.name,
				    image : {
					name : 'c1.png'
				    }
				}
			    })];
			} else {
			    terrain.cave[rowNum][colNum] = [RPG.createTile(['world','earth','building','cave'],terrain.cache,{
				property : {
				    tileName : RPG.Generator.Name.generate({
					name : {
					    length:rand.random(4,8),
					    seed : rand.seed
					}
				    },rand) + " cave",
				    folderName : options.terrain.name,
				    image : {
					name : 'c3.png'
				    }
				}
			    })];
			}
		    }
		}
	    });
	});

	//options.terrain.cave = {};
	Object.each(terrain.sand,function(row,rowNum){
	    Object.each(row,function(col,colNum){
		if (rand.random(0,100) <= 5) {

		    if ((terrain.city && terrain.city[rowNum] && terrain.city[rowNum][colNum]) ||
			(terrain.roads && terrain.roads[rowNum] && terrain.roads[rowNum][colNum])) {
		    //ignore roads and cities

		    } else {
			if (!terrain.cave[rowNum]) terrain.cave[rowNum] = {};
			terrain.cave[rowNum][colNum] = [RPG.createTile(['world','earth','building','cave'],terrain.cache,{
			    property : {
				tileName : RPG.Generator.Name.generate({
				    name : {
					length:rand.random(4,8),
					seed : rand.seed
				    }
				},rand) + " cavern",
				folderName : options.terrain.name,
				image : {
				    name : 'c2.png'
				}
			    }
			})];
		    }
		}
	    });
	});

	Object.each(terrain.deep,function(row,rowNum){
	    Object.each(row,function(col,colNum){
		if (rand.random(0,100) <= 5) {

		    if ((terrain.city && terrain.city[rowNum] && terrain.city[rowNum][colNum]) ||
			(terrain.roads && terrain.roads[rowNum] && terrain.roads[rowNum][colNum])) {
		    //ignore roads and cities

		    } else {
			if (!terrain.cave[rowNum]) terrain.cave[rowNum] = {};
			if (rand.random(0,100) <= 50) {
			    terrain.cave[rowNum][colNum] = [RPG.createTile(['world','earth','building','cave'],terrain.cache,{
				property : {
				    tileName : RPG.Generator.Name.generate({
					name : {
					    length:rand.random(4,8),
					    seed : rand.seed
					}
				    },rand) + " whirlpool",
				    folderName : options.terrain.name,
				    image : {
					name : 'w1.png'
				    }
				}
			    })];
			} else {
			    terrain.cave[rowNum][colNum] = [RPG.createTile(['world','earth','building','ship'],terrain.cache,{
				property : {
				    tileName : 'Captain ' + RPG.Generator.Name.generate({
					name : {
					    length:rand.random(4,8),
					    seed : rand.seed
					}
				    },rand) + "'s pirate ship",
				    folderName : options.terrain.name,
				    image : {
					name : 'p1.png'
				    }
				}
			    })];
			}
		    }
		}
	    });
	});

	Object.each(terrain.shallow,function(row,rowNum){
	    Object.each(row,function(col,colNum){
		if (rand.random(0,100) <= 5) {

		    if ((terrain.city && terrain.city[rowNum] && terrain.city[rowNum][colNum]) ||
			(terrain.roads && terrain.roads[rowNum] && terrain.roads[rowNum][colNum])) {
		    //ignore roads and cities

		    } else {
			if (!terrain.cave[rowNum]) terrain.cave[rowNum] = {};
			if (rand.random(0,100) <= 50) {
			    terrain.cave[rowNum][colNum] = [RPG.createTile(['world','earth','building','cave'],terrain.cache,{
				property : {
				    tileName : RPG.Generator.Name.generate({
					name : {
					    length:rand.random(4,8),
					    seed : rand.seed
					}
				    },rand) + " whirlpool",
				    folderName : options.terrain.name,
				    image : {
					name : 'w2.png'
				    }
				}
			    })];
			} else {
			    terrain.cave[rowNum][colNum] = [RPG.createTile(['world','earth','building','ship'],terrain.cache,{
				property : {
				    tileName : 'Captain ' + RPG.Generator.Name.generate({
					name : {
					    length:rand.random(4,8),
					    seed : rand.seed
					}
				    },rand) + "'s pirate ship",
				    folderName : options.terrain.name,
				    image : {
					name : 'p1.png'
				    }
				}
			    })];
			}
		    }
		}
	    });
	});

	/**
     *
     * Trim Close Together stuff
     */
	[terrain.barn,terrain.cave,terrain.tipi].each(function(stuff){
	    Object.each(stuff,function(row,rowNum,obj){
		rowNum = Number.from(rowNum);
		Object.each(row,function(col,colNum){
		    colNum = Number.from(colNum);
		    if (!obj[rowNum][colNum]) return;
		    for (var r = -4;r<4; r++) {
			for (var c = -4;c<4; c++) {
			    if (r==0 && c==0) {
			    //skip self
			    }
			    else {
				if (obj[rowNum+r] && obj[rowNum+r][colNum+c]) {
				    obj[rowNum+r][colNum+c].pop();
				    Object.erase(obj[rowNum+r],colNum+c);
				    if (Object.keys(obj[rowNum+r]).length == 0) {
					Object.erase(obj,rowNum+r);
				    }
				}
			    }
			}
		    }
		});
	    });
	});
    },


    generateRivers : function(heightMap,size,average, termHeight,maxRivers,minRiverSpacing) {
	var mIndexs = [];
	var riverCount = 0;
	var max = (average+1.75);
	heightMap.each(function(item,mIndex){
	    if (item >= max && riverCount < maxRivers && item != 'r') {

		var existing = false;
		//	    mIndexs.each(function(index){
		//		//check for existing rivers withing 'minRiverSpacing'
		//		for (var x=-minRiverSpacing; x<minRiverSpacing; x++) {
		//		    for (var y=-minRiverSpacing; x<minRiverSpacing; x++) {
		//			var gridIdx = index + (x*size) + y;
		//			if (gridIdx > 0 && heightMap[gridIdx] == 'r') {
		//			    existing = true;
		//			}
		//		    }
		//		}
		//	    });
		if (!existing) {
		    riverCount++;
		    for(var i = 0;i<2000;i++) {
			var tIdx = (mIndex - size);
			var top = heightMap[tIdx];
			var lIdx = (mIndex-1);
			var left = heightMap[lIdx];
			var rIdx = (mIndex+1);
			var right = heightMap[rIdx];
			var bIdx = (mIndex + size);
			var bottom = heightMap[bIdx];
			var rIndex = -1;
			if (!top) {
			    tIdx = (size*size) - mIndex;
			    top = heightMap[tIdx];
			}
			if (top =='r') {
			    top = 100;
			}
			if (!bottom) {
			    bIdx = (size*size) - mIndex;
			    bottom = heightMap[bIdx];
			}
			if (bottom =='r') {
			    bottom = 100;
			}
			if (!left) {
			    lIdx = (size*size)
			    left = heightMap[lIdx];
			}
			if (left =='r') {
			    left = 100;
			}
			if (!right) {
			    rIdx = 0;
			    right = heightMap[rIdx];
			}
			if (right =='r') {
			    right = 100;
			}
			if (top < left && top < right && top < bottom) {
			    rIndex = tIdx;
			} else if (left < top && left < right && left < bottom) {
			    rIndex = lIdx;
			} else if (right < top && right < left && right < bottom) {
			    rIndex = rIdx;
			} else if (bottom < top && bottom < right && bottom < left) {
			    rIndex = bIdx;
			}
			if (rIndex != -1 && heightMap[rIndex] > (average+termHeight)) {
			    heightMap[rIndex] = 'r';
			    mIndex = rIndex;
			    mIndexs.push(mIndex);
			} else {
			    break;
			}
			tIdx = top = lIdx = left = rIdx = right = bIdx = bottom = rIndex = null;
		    }
		}
	    }
	});
	mIndexs = null;
	riverCount = null;
	max = null;
    }
}))();