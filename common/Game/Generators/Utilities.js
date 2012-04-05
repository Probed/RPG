if (!RPG) var RPG = {};
if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../../Random.js'));
    Object.merge(RPG,require('../Tiles/Tiles.js'));
    module.exports = RPG;
}

RPG.dirs = ['n','e','s','w'];
RPG.dir_opp = {
    n : 's',
    e : 'w',
    s : 'n',
    w : 'e'
};
RPG.cornor = ['ne','nw','se','sw'];
RPG.cornor_opp = {
    ne : 'sw',
    nw : 'se',
    se : 'nw',
    sw : 'ne'
}

/*************************************************************************************************************************
 *  Functions for row column 'Points' and 'Areas' containing points
 *
 *  Point : [x,y]
 *
 *  Areas : {
 *	area : [point1,point2...]
 *	...
 *  }
 *
/*************************************************************************************************************************/



//shift a point ( [x,y] ) up/down/left/right etc
RPG.n = function(point,size) {
    return [point[0]-size,point[1]];
}
RPG.s = function(point,size) {
    return [point[0]+size,point[1]];
}
RPG.e = function(point,size) {
    return [point[0],point[1]+size];
}
RPG.w = function(point,size) {
    return [point[0],point[1]-size];
}
RPG.ne = function(point,size) {
    return [point[0]-size,point[1]+size];
}
RPG.nw = function(point,size) {
    return [point[0]-size,point[1]-size];
}
RPG.se = function(point,size) {
    return [point[0]+size,point[1]+size];
}
RPG.sw = function(point,size) {
    return [point[0]+size,point[1]-size];
}


/**
 * startPoints: eg [[0,0],[5,5]]
 * endPoints: eg [[10,10],[20,20]]
 * stagger : random chance to change direction; 0/100 = straight horiz/vert.  50 = most stagger
 *
 * will draw pointsPath[0] = 0,0 to 10,10.  then pointsPath[1] = 5,5 to 20,20
 */
RPG.pointsToPointsDraw = function(startPoints, endPoints,stagger) {
    var pointsPath = {
	areas : []
    };
    var i = 0;
    var len = endPoints.length;
    for(i=0;i<len;i++){
	pointsPath[i] = RPG.pointToPointDraw(startPoints[i],endPoints[i],stagger);
	pointsPath.areas[i] = pointsPath[i].area;
    }
    return pointsPath;
}

/**
 * startPoint: eg [0,0]
 * endPoints: eg [[10,10],[20,20]]
 * stagger : random chance to change direction; 0/100 = straight horiz/vert.  50 = most stagger
 */
RPG.pointToPointsDraw = function(startPoint, endPoints,stagger) {
    var pointsPath = {
	areas : []
    };
    var i = 0;
    var len = endPoints.length;
    for(i=0;i<len;i++){
	pointsPath[i] = RPG.pointToPointDraw(startPoint,endPoints[i],stagger);
	pointsPath.areas[i] = pointsPath[i].area;
    }
    return pointsPath;
}
/**
 * startPoint: eg [0,0]
 * endPoint: eg [10,10]
 * stagger : random chance to change direction; 0/100 = straight horiz/vert.  50 = most stagger
 */
RPG.pointToPointDraw = function(startPoint, endPoint, stagger,rand) {
    var pointPath = {
	area : [],
	perimeter : {
	    //tops of walls etc
	    tops : {
		n : [],
		e : [],
		s : [],
		w :[]
	    },

	    //bottoms of walls etc
	    bottoms : {
		n : [],
		e : [],
		s : [],
		w :[]
	    }
	},
	path : [],
	start : null,
	end : null
    };
    var x = 0;
    var y = 0;
    var p = 0;
    var len = 0;
    var rChange = 0;
    var cChange = 0;
    var x1 = startPoint[0];
    var y1 = startPoint[1];
    var x2 = endPoint[0];
    var y2 = endPoint[1];

    for (p=0;p<256;p++) {

	rChange = (x2 > x1?1:(x2 == x1?0:-1));
	cChange = (y2 > y1?1:(y2 == y1?0:-1));
	if (rChange != 0 && cChange !=0) {
	    if ((rand && rand.random(0,100) > (stagger || 0)) || (RPG.Random.random(0,100) > (stagger || 0))) {
		rChange = 0;
	    } else {
		cChange = 0;
	    }
	}

	var point = [x1,y1];
	if (x1 == startPoint[0] && y1 == startPoint[1]) {
	    pointPath.start = point;
	}

	pointPath.area.push(point);
	pointPath.path.push(point);
	if (x1 == x2 && y1 == y2) {
	    pointPath.end = point;
	    //we have reached our destination.
	    break;
	}
	x1 += rChange;
	y1 += cChange;
    }

    len = pointPath.path.length;
    p=pointPath.path;
    for (x=0;x<len;x++){

	//n perimeter
	if (!RPG.areaContainsPoints(pointPath.area,[RPG.n(p[x],1),RPG.n(p[x],2)])) {
	    pointPath.perimeter.bottoms.n.push(RPG.n(p[x],1));
	    pointPath.area.push(RPG.n(p[x],1));

	    pointPath.perimeter.tops.n.push(RPG.n(p[x],2));
	    pointPath.area.push(RPG.n(p[x],2));

	}

	//s perimeter
	if (!RPG.areaContainsPoints(pointPath.area,[RPG.s(p[x],2),RPG.s(p[x],1)])) {
	    pointPath.perimeter.bottoms.s.push(RPG.s(p[x],2));
	    pointPath.area.push(RPG.s(p[x],2));

	    pointPath.perimeter.tops.s.push(RPG.s(p[x],1));
	    pointPath.area.push(RPG.s(p[x],1));


	}
    }
    for (x=0;x<len;x++){

	//e perimeter
	if (!RPG.areaContainsPoint(pointPath.area,RPG.e(p[x],1))) {
	    pointPath.perimeter.tops.e.push(RPG.e(p[x],1));
	    pointPath.area.push(RPG.e(p[x],1));
	    if (!RPG.areaContainsPoint(pointPath.area,RPG.s(RPG.e(p[x],1),1))) {
		pointPath.perimeter.bottoms.s.push(RPG.s(RPG.e(p[x],1),1));
		pointPath.area.push(RPG.s(RPG.e(p[x],1),1));
	    }
	} else if (RPG.areaContainsPoint(pointPath.perimeter.bottoms.s,RPG.e(p[x],1))) {
	    RPG.removeAreaPoint(pointPath.perimeter.bottoms,RPG.e(p[x],1));
	    pointPath.perimeter.tops.e.push(RPG.e(p[x],1));

	    if (!RPG.areaContainsPoint(pointPath.area,RPG.se(p[x],1))) {
		pointPath.perimeter.bottoms.s.push(RPG.se(p[x],1));
		pointPath.area.push(RPG.se(p[x],1));
	    }
	}
	if (!RPG.areaContainsPoint(pointPath.area,RPG.ne(p[x],1))) {
	    pointPath.perimeter.tops.n.push(RPG.ne(p[x],1));
	    pointPath.area.push(RPG.ne(p[x],1));
	}

	//w perimeter
	if (!RPG.areaContainsPoint(pointPath.area,RPG.w(p[x],1))) {
	    pointPath.perimeter.tops.w.push(RPG.w(p[x],1));
	    pointPath.area.push(RPG.w(p[x],1));


	} else if (RPG.areaContainsPoint(pointPath.perimeter.bottoms.s,RPG.w(p[x],1))) {
	    RPG.removeAreaPoint(pointPath.perimeter.bottoms,RPG.w(p[x],1));
	    pointPath.perimeter.tops.w.push(RPG.w(p[x],1));

	    if (!RPG.areaContainsPoint(pointPath.area,RPG.sw(p[x],1))) {
		pointPath.perimeter.bottoms.s.push(RPG.sw(p[x],1));
		pointPath.area.push(RPG.sw(p[x],1));
	    }
	}
	if (!RPG.areaContainsPoint(pointPath.area,RPG.nw(p[x],1))) {
	    pointPath.perimeter.tops.n.push(RPG.nw(p[x],1));
	    pointPath.area.push(RPG.nw(p[x],1));
	}

    }
    x1 = y1 = x2 = y2 = x = p = rChange = cChange = null;

    return pointPath;
}



RPG.getRectangleAreas = function(fromPoints,toPoints) {
    var i = 0;
    var len = fromPoints.length;
    var rectangles = {
	areas : []
    };
    for (i=0;i<len;i++) {
	rectangles[i] = RPG.getRectangleArea(fromPoints[i], toPoints[i]);
	rectangles.areas.push(rectangles[i].area.length);
    }
    return rectangles;
}
RPG.getRectangleArea = function(from,to) {
    var x = 0;
    var y = 0;

    var x1 = from[0];
    var y1 = from[1];

    var x2 = to[0];
    var y2 = to[1];

    var rect = {
	area : [],
	height : to[0]-from[0],
	width :  to[1]-from[1],
	perimeter : {
	    //tops of walls etc
	    tops : {
		n : [],
		e : [],
		s : [],
		w :[]
	    },

	    //bottoms of walls etc
	    bottoms : {
		n : [],
		e : [],
		s : [],
		w :[]
	    }
	},
	half : {
	    n :[],
	    e : [],
	    s : [],
	    w : []
	},
	quarter : {
	    ne : [],
	    nw : [],
	    se : [],
	    sw : []
	},
	interior : {
	    all : [],
	    perimeter : {
		n : [],
		e : [],
		s : [],
		w : []
	    }

	},
	openings : {
	    n : {},
	    e : {},
	    s : {},
	    w : {}
	},
	center : []
    }

    var halfHeight = Math.floor((x1 + x2) / 2);
    var halfWidth = Math.floor((y1 + y2) / 2);

    for(x=x1;x<=x2;x++) {
	for(y=y1;y<=y2;y++) {

	    rect.area.push([x,y]);

	    if (x==halfHeight && y == halfWidth) {
		rect.center.push([x,y]);
	    }

	    /*n*/
	    if (x==x1 && y > (y1) && y < (y2)) {
		rect.perimeter.tops.n.push([x,y]);

		if (y > (y1+1) && y < (y2-1)) {

		    if (!rect.openings.n[y]) rect.openings.n[y] = [];
		    rect.openings.n[y].push([x,y]);
		}
	    }
	    if (x==(x1+1) && y > (y1) && y < (y2)) {
		rect.perimeter.bottoms.n.push([x,y]);

		if (y > (y1+1) && y < (y2-1)) {
		    rect.openings.n[y].push([x,y]);
		}
	    }
	    if (x==(x1+2) && y > (y1) && y < (y2)) {
		if (y > (y1+1) && y < (y2-1)) {
		    rect.interior.perimeter.n.push([x,y]);
		    rect.openings.n[y].push([x,y]);
		}
	    }

	    /*s*/
	    if (x==(x2-2) && y > (y1) && y < (y2)) {
		if (y > (y1+1) && y < (y2-1)) {
		    rect.interior.perimeter.s.push([x,y]);

		    if (!rect.openings.s[y]) rect.openings.s[y] = [];
		    rect.openings.s[y].push([x,y]);
		}
	    }
	    if (x==(x2-1) && y > (y1) && y < (y2)) {
		rect.perimeter.tops.s.push([x,y]);

		if (y > (y1+1) && y < (y2-1)) {
		    rect.openings.s[y].unshift([x,y]);
		}
	    }
	    if (x==x2 && y >= (y1) && y <= (y2)) {
		rect.perimeter.bottoms.s.push([x,y]);
		if (y > (y1+1) && y < (y2-1)) {
		    rect.openings.s[y].unshift([x,y]);//unshifed to make this item 0. each opening (n/s/e/w) starts a 0
		}
	    }

	    if (y==y1 && x<x2) {
		rect.perimeter.tops.w.push([x,y]);
		if (x>(x1+2) && x<(x2-2)) {
		    if (!rect.openings.w[x]) rect.openings.w[x] = [];
		    rect.openings.w[x].push([x,y]);
		}
	    }
	    if (y==y2 && x<x2) {
		rect.perimeter.tops.e.push([x,y]);
		if (x>(x1+2) && x<(x2-2)) {
		    rect.openings.e[x].unshift([x,y]);//unshifed to make this item 0. each opening (n/s/e/w) starts a 0
		}
	    }

	    //interior
	    if (x > (x1+1) && x < (x2-1) && y > (y1) && y < (y2)) {
		if (y==(y1+1)) {

		    if (x>(x1+2) && x<(x2-2)) {
			rect.interior.perimeter.w.push([x,y]);

			rect.openings.w[x].push([x,y]);
		    }
		}
		if (y==(y2-1)) {

		    if (x>(x1+2) && x<(x2-2)) {
			rect.interior.perimeter.e.push([x,y]);
			if (!rect.openings.e[x]) rect.openings.e[x] = [];
			rect.openings.e[x].push([x,y]);
		    }
		}
		rect.interior.all.push([x,y]);

		if (y < halfWidth) {
		    rect.half.w.push([x,y]);
		}
		if (x < halfHeight) {
		    rect.half.e.push([x,y]);
		}
		if (x < halfHeight) {
		    rect.half.n.push([x,y]);
		    if (y < halfWidth) {
			rect.quarter.ne.push([x,y]);
		    } else if (y > halfWidth) {
			rect.quarter.nw.push([x,y]);
		    }
		}
		if (x > halfHeight) {
		    rect.half.s.push([x,y]);
		    if (y < halfWidth) {
			rect.quarter.se.push([x,y]);
		    } else if (y > halfWidth) {
			rect.quarter.sw.push([x,y]);
		    }
		}
	    }
	}
    }

    return rect;
}

RPG.makeRandomOpening = function(area, nesw) {

    //find and remove a random opening
    var opening = Array.clone(Object.getSRandom(area.openings[nesw]).rand);
    RPG.removeAreaPoints(area,opening);

    //fix the tops/bootms
    if (nesw == 'e' || nesw == 'w') {
	if (!area.perimeter.bottoms[nesw]) area.perimeter.bottoms[nesw] = [];
	area.perimeter.bottoms[nesw].push(RPG.removeAreaPoint(area.perimeter.tops[nesw],RPG.n(opening[0],1)));
    }

    //put the opening back into the area
    area.openings[nesw] = opening;
    return opening;
}

RPG.getCircleAreas = function(centerPoints,radiuses) {
    var i = 0;
    var len = centerPoints.length;
    var circles = {
	areas : []
    };
    for (i=0;i<len;i++) {
	circles[i] = RPG.getCircleArea(centerPoints[i][0],centerPoints[i][1],radiuses[i]);
	circles.areas.push(circles[i].area.length);
    }
    i = len = null;
    return circles;
}

RPG.getCircleArea = function(point,radius) {
    var center_x = point[0];
    var center_y = point[1];
    var circle = {
	area : [],
	height : radius+(radius),
	width :  radius+(radius),
	perimeter : {
	    tops : {
		n : [],
		e : [],
		s : [],
		w : []
	    },
	    bottoms : {
		n : [],
		e : [],
		s : [],
		w : []
	    }
	},
	half : {
	    n :[],
	    e : [],
	    s : [],
	    w : []
	},
	quarter : {
	    ne : [],
	    nw : [],
	    se : [],
	    sw : []
	},
	openings : {
	    n : {},
	    e : {},
	    s : {},
	    w : {}
	},
	interior : {
	    all : [],
	    perimeter : {
		n :[],
		e : [],
		s : [],
		w : []
	    }
	},
	concentric : {},
	center : []
    };
    var fillX = 0;
    var fillY = 0;
    var perim = true;
    //Draw the circle and initialize the points
    for(fillX=-(radius); fillX<=(radius); fillX++) {
	for(fillY=-(radius); fillY<=(radius); fillY++) {

	    if((fillX*fillX)+((fillY)*(fillY)) < ((radius+1)*(radius))) {
		x = center_x+fillX;
		y = center_y+fillY;

		perim = false;
		//check if any surrounding fall outside
		if (((fillX*fillX)+((fillY-1)*(fillY-1)) > ((radius+1)*(radius))) ||
		    ((fillX*fillX)+((fillY+1)*(fillY+1)) > ((radius+1)*(radius))) ||
		    (((fillX+1)*(fillX+1))+(fillY*fillY+1) > ((radius+1)*(radius))) ||
		    (((fillX-1)*(fillX-1))+(fillY*fillY) > ((radius+1)*(radius)))) {
		    perim = true;
		}


		//everything gets put into the area
		circle.area.push([x,y]);

		/*n*/
		if (fillX < 0) {
		    circle.half.n.push([x,y]);
		    if (perim && fillY>-(radius) && fillY<radius) {
			circle.perimeter.tops.n.push([x,y]);
			circle.perimeter.bottoms.n.push(RPG.s([x,y],1));
			circle.interior.perimeter.n.push(RPG.s([x,y],2));
		    }
		    if (fillX == -radius){
			if (!circle.openings.n[fillY]) circle.openings.n[fillY] = [];
			circle.openings.n[fillY].push([x,y]);
			circle.openings.n[fillY].push(RPG.s([x,y],1));
			circle.openings.n[fillY].push(RPG.s([x,y],2));
		    }
		    if (fillY > 0) {
			circle.quarter.ne.push([x,y]);
			circle.half.e.push([x,y]);
		    } else if (fillY < 0) {
			circle.quarter.nw.push([x,y]);
			circle.half.w.push([x,y]);
		    }
		}

		/*s*/

		if (fillX == 0 && fillY == 0) {
		    circle.center.push([x,y]);
		}
		if (fillX > 0) {
		    circle.half.s.push([x,y]);
		    if (perim && fillY>-(radius) && fillY<radius) {
			circle.perimeter.bottoms.s.push([x,y]);
			circle.perimeter.tops.s.push(RPG.n([x,y],1));
			circle.interior.perimeter.s.push(RPG.n([x,y],2));
		    }
		    if (fillX == radius){
			if (!circle.openings.s[fillY]) circle.openings.s[fillY] = [];
			circle.openings.s[fillY].push([x,y]);
			circle.openings.s[fillY].push(RPG.n([x,y],1));
			circle.openings.s[fillY].push(RPG.n([x,y],2));
		    }
		    if (fillY > 0) {
			circle.quarter.se.push([x,y]);
		    } else if (fillY < 0) {
			circle.quarter.sw.push([x,y]);
		    }
		}

		/**
		 *e/w
		 */
		if (fillY > 0) {
		    circle.half.e.push([x,y]);
		} else if (fillY < 0) {
		    circle.half.w.push([x,y]);
		}

		if (perim && (fillY==-(radius))) {
		    circle.perimeter.tops.w.push([x,y]);

		    if (!circle.openings.w[fillX]) circle.openings.w[fillX] = [];
		    circle.openings.w[fillX].push([x,y]);
		    circle.openings.w[fillX].push(RPG.e([x,y],1));
		    circle.interior.perimeter.w.push(RPG.e([x,y],1));

		} else if (perim && (fillY==(radius))) {
		    circle.perimeter.tops.e.push([x,y]);
		    if (!circle.openings.e[fillX]) circle.openings.e[fillX] = [];
		    circle.openings.e[fillX].push([x,y]);
		    circle.openings.e[fillX].push(RPG.w([x,y],1));
		    circle.interior.perimeter.e.push(RPG.w([x,y],1));
		}

		if (!perim) {
		    circle.interior.all.push([x,y]);
		}

		perim = false;
	    } else {
		perim = true;
	    }
	}
    }
    var r = 0;
    var x = 0;
    var y = 0;
    var con = null;
    for (r = 1;r<radius;r++) {
	if (!circle.concentric[r]) circle.concentric[r] = con = [];

	x = 0;
	y = r;
	while (x <= y) {
	    con.push([center_x+x,center_y+y]); // S
	    con.push([center_x-x,center_y+y]); // NE
	    con.push([center_x+x,center_y-y]); // SW
	    con.push([center_x-x,center_y-y]); // N
	    con.push([center_x+y,center_y+x]); // E
	    con.push([center_x-y,center_y+x]); // SE
	    con.push([center_x+y,center_y-x]); // NW
	    con.push([center_x-y,center_y-x]); // W
	    x++;
	    if (Math.abs(x*x + (y)*(y) - r*r) > Math.abs(x*x + (y-1)*(y-1) - r*r)) {
		y--;
	    }
	}
    }
    radius=x=y=r=null;

    RPG.dirs.each(function(dir){
	//get rid of the first 2 and last 2 opening points cause they are too close to walls.
	Object.erase(circle.openings[dir],Object.keys(circle.openings[dir]).min());
	Object.erase(circle.openings[dir],Object.keys(circle.openings[dir]).min());
	Object.erase(circle.openings[dir],Object.keys(circle.openings[dir]).max());
	Object.erase(circle.openings[dir],Object.keys(circle.openings[dir]).max());


	if (dir == 'e' || dir == 'w') {
	    //remove any w/e interior perimeters from n/s
	    RPG.removeAreaPoints(circle.interior.perimeter.s,circle.interior.perimeter[dir]);
	    RPG.removeAreaPoints(circle.interior.perimeter.n,circle.interior.perimeter[dir]);

	    //change the last element in the e/w tops to a bottom
	    circle.perimeter.bottoms[dir].push(RPG.removeAreaPoint(circle.perimeter.tops[dir],circle.perimeter.tops[dir][circle.perimeter.tops[dir].length-1]));

	    circle.interior.perimeter[dir].shift();
	    circle.interior.perimeter[dir].pop();
	}
    });
    RPG.removeAreaPoints(circle.perimeter.bottoms,RPG.flattenArea(circle.perimeter.tops));
    RPG.removeAreaPoints(circle.concentric,RPG.flattenArea(circle.perimeter));
    RPG.removeAreaPoints(circle.interior,RPG.flattenArea(circle.perimeter));
    return circle;
}

RPG.pointsEqual = function(point1,point2) {
    return point1 && point2 && point1[0] == point2[0] && point1[1] == point2[1];
}

RPG.areaContainsPoint = function(area,point){
    var i = 0;
    var len = area.length;
    var contPoint = null;
    for(i=0;i<len;i++){
	if (area[i] == point || RPG.pointsEqual(area[i],point)) {
	    contPoint = area[i];
	}
    }
    i=len=null;
    return contPoint;
}

RPG.areaContainsPoints = function(area,points) {
    var i = 0;
    var len = points.length;
    var contPoints = [];
    var contains = null;
    for(i=0;i<len;i++){
	contains = RPG.areaContainsPoint(area,points[i]);
	if (contains) {
	    contPoints.push(contains);
	}
    }
    if (contPoints.length > 0) {
	return contPoints;
    }
    return null;
}


/**
 * takes some object/array and flattens it to a 2d array removing duplicates
 * eg :
 * input = {
 *  area1 = {
 *	poins : [[p1,p2],[p3,p4]]
 *  },
 *  area2 : [p5,p6],
 *  area3 : [[p7,p8],[p9,p0]]
 *  }
 *  TO :
 *  returns: [[p1,p2],[p3,p4],[p5,p6],[p7,p8],[p9,p0]]
 */
RPG.flattenArea = function(area, flat) {
    if (!flat) flat = [];
    var i = 0;
    var len = 0;
    var k = 0;
    if (typeOf(area) == 'array' && typeOf(area[0]) == 'number') {

	//[num,num] = point
	!RPG.areaContainsPoint(flat,area) && flat.push(area);

    } else if (typeOf(area) == 'array') {
	//array : []
	len = area.length;
	for (i = 0; i<len; i++) {
	    RPG.flattenArea(area[i],flat);
	}

    } else if (typeOf(area) == 'object') {
	//obj : {...}

	k = Object.keys(area);
	len = k.length;
	for(i = 0; i<len; i++) {
	    RPG.flattenArea(area[k[i]],flat);
	}
    }
    return flat;
}
/**
 *
 *
 */
RPG.removeAreaPoints = function(area, points, removed) {
    if (!points) return null;
    if (!removed) removed = [];
    var i = 0;
    var len = 0;
    var k = 0;



    if (typeOf(area) == 'array') {
	//array : []
	for (i = 0; i<area.length; i++) {
	    len = points.length;
	    for(k=0;k<len;k++) {
		var point = points[k];
		if (RPG.pointsEqual(area[i],point)) {
		    area.splice(i,1);
		    !RPG.areaContainsPoint(removed,point) && removed.push(Array.clone(point));
		    i--;
		}
	    }
	}

    } else if (typeOf(area) == 'object') {
	//obj : {...}

	k = Object.keys(area);
	len = k.length;
	for(i = 0; i<len; i++) {
	    RPG.removeAreaPoints(area[k[i]],points,removed,area);
	    if (area[k[i]] && area[k[i]].length == 0) {
		Object.erase(area,k[i]);
	    }
	}

    }
    if (removed.length > 0) {
	return removed;
    } else {
	return null;
    }
}

RPG.removeAreaPoint = function(area, point, removed) {
    if (!removed) removed = [];
    var i = 0;
    var len = 0;
    var k = 0;

    if (typeOf(area) == 'array') {
	//array : []
	for (i = 0; i<area.length; i++) {
	    if (RPG.pointsEqual(area[i],point)) {
		removed.push(point);
		area.splice(i,1);
		return Array.clone(point);
	    }
	}

    } else if (typeOf(area) == 'object') {
	//obj : {...}

	k = Object.keys(area);
	len = k.length;
	for(i = 0; i<len; i++) {
	    RPG.removeAreaPoint(area[k[i]],point,removed,area);
	    if (area[k[i]] && area[k[i]].length == 0) {
		Object.erase(area,k[i]);
	    }
	}

    }
    if (removed.length > 0) {
	return Array.clone(point);
    } else {
	return false;
    }
}

RPG.removeTilesArea = function(tiles,area) {
    var rows = Object.keys(tiles);
    var cols = null;
    var rLen = rows.length;
    var r = 0;
    var cLen = 0;
    var c = 0;
    var rem = null;
    var removed = [];
    for (r=0;r<rLen;r++){
	cols = Object.keys(tiles[rows[r]]);
	cLen = cols.length;
	for (c=0;c<cLen;c++){
	    rem = RPG.removeAreaPoint(area,[Number.from(rows[r]),Number.from(cols[c])]);
	    if (rem) removed.push(rem);
	}
    }
    return removed;
}

/**
 * Recursivly traverses an Area array/object and shift it by the offset in the specified direction function.
 * eg :
 * offset : +/- integer
 * direction: RPG.nw  (or other function which takes a Point / Offset argument
 */
RPG.offsetArea = function(area,offset,directionFunc,offset2,directionFunc2) {
    var i = 0;
    var len = 0;
    var k = 0;
    if (typeOf(area) == 'object') {
	k = Object.keys(area);
	len = k.length;
	for(i = 0; i<len; i++) {
	    RPG.offsetArea(area[k[i]],offset,directionFunc,offset2,directionFunc2);
	}
    } else if (typeOf(area) == 'array' && typeOf(area[0]) == 'array') {
	len = area.length;
	for(i=0;i<len;i++){
	    if (!area[i]) continue;
	    area[i] = directionFunc(area[i],offset);
	    if (offset2 && directionFunc2) {
		area[i] = directionFunc2(area[i],offset2);
	    }
	}

    } else if (typeOf(area) == 'array' && typeOf(area[0]) == 'number' && typeOf(area[1]) == 'number') {
	area[0] = directionFunc(area,offset)[0];
	area[1] = directionFunc(area,offset)[1];

    } else if (typeOf(area) == 'array') {
	len = area.length;
	for (i = 0; i<len; i++) {
	    RPG.offsetArea(area[i],offset,directionFunc,offset2,directionFunc2);
	}
    }
}

RPG.getRandomTileImage = function(path,rand) {
    if (typeOf(path) == 'array') path = path.join('.');
    var imglist = Object.getFromPath(RPG.Tiles,path+'.options.property.image.name');
    if (!imglist) return null;
    var img = Array.getSRandom(imglist,rand);
    return {
	image : img,
	name : img.substr(0,img.lastIndexOf("."))
    };
}

RPG.getPointSQL = function(point) {
    var sql = "GeomFromText('POINT(";
    sql += point[0];
    sql += " ";
    sql += point[1];
    sql += ")')";
    return sql;
}