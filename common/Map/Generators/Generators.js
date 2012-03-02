RPG.Generators = {
    Terrain : {
	require :{
	    js : ['/common/map/Generators/Terrain.js','/common/map/Generators/diamond-square.js','/common/map/Generators/Words.js']
	}
    },
    Dungeon : {
	require :{
	    js : ['/common/map/Generators/Dungeon.js','/common/map/Generators/Maze.js','/common/map/Generators/Words.js']
	}
    },
    House : {
	require :{
	    js : ['/common/map/Generators/House.js','/common/map/Generators/Words.js']
	}
    },
    Maze : {
	require :{
	    js : ['/common/map/Generators/Maze.js','/common/map/Generators/Words.js']
	}
    },
    Name : {
	require :{
	    js : ['/common/map/Generators/Words.js']
	}
    },
    Words : {
	require :{
	    js : ['/common/map/Generators/Words.js']
	}
    }
}