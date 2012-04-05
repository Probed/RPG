if (!RPG) var RPG = {};

if (typeof exports != 'undefined') {
    Object.merge(RPG,require('../../Random.js'));
    module.exports = RPG;
}
RPG.fill2DFractArray = function(fa,size,seedValue,heightScale,h,rand) {
    var	i, j;
    var	stride;
    var	oddline;
    var subSize;
    var ratio;
    var scale;

    /* subSize is the dimension of the array in terms of connected line
       segments, while size is the dimension in terms of number of
       vertices. */
    subSize = size;
    size++;

    /* initialize random number generator */
    rand = rand || RPG.Random;
    rand.seed = seedValue;

    /* Set up our roughness constants.
	   Random numbers are always generated in the range 0.0 to 1.0.
	   'scale' is multiplied by the randum number.
	   'ratio' is multiplied by 'scale' after each iteration
	   to effectively reduce the randum number range.
     */
    ratio = Math.pow (2,-h);
    scale = heightScale * ratio;

    /* Seed the first four values. For example, in a 4x4 array, we
       would initialize the data points indicated by '*':

     *   .   .   .   *

       .   .   .   .   .

       .   .   .   .   .

       .   .   .   .   .

     *   .   .   .   *

       In terms of the "diamond-square" algorithm, this gives us
       "squares".

       We want the four corners of the array to have the same
       point. This will allow us to tile the arrays next to each other
       such that they join seemlessly. */

    stride = subSize / 2;
    fa[(0*size)+0] = fa[(subSize*size)+0] = fa[(subSize*size)+subSize] = fa[(0*size)+subSize] = 0;


    /* Now we add ever-increasing detail based on the "diamond" seeded
       values. We loop over stride, which gets cut in half at the
       bottom of the loop. Since it's an int, eventually division by 2
       will produce a zero result, terminating the loop. */
    while (stride) {
	/* Take the existing "square" data and produce "diamond"
		   data. On the first pass through with a 4x4 matrix, the
		   existing data is shown as "X"s, and we need to generate the
	       "*" now:

               X   .   .   .   X

               .   .   .   .   .

               .   .   *   .   .

               .   .   .   .   .

               X   .   .   .   X

	      It doesn't look like diamonds. What it actually is, for the
	      first pass, is the corners of four diamonds meeting at the
	      center of the array. */
	for (i=stride; i<subSize; i+=stride) {
	    for (j=stride; j<subSize; j+=stride) {
		fa[(i * size) + j] =
		scale * rand.random(-0.5,0.5) +
		avgSquareVals (i, j, stride, size, fa);
		j += stride;
	    }
	    i += stride;
	}

	/* Take the existing "diamond" data and make it into
	       "squares". Back to our 4X4 example: The first time we
	       encounter this code, the existing values are represented by
	       "X"s, and the values we want to generate here are "*"s:

               X   .   *   .   X

               .   .   .   .   .

	 *   .   X   .   *

               .   .   .   .   .

               X   .   *   .   X

	       i and j represent our (x,y) position in the array. The
	       first value we want to generate is at (i=2,j=0), and we use
	       "oddline" and "stride" to increment j to the desired value.
	 */
	oddline = 0;
	for (i=0; i<subSize; i+=stride) {
	    oddline = (oddline == 0);
	    for (j=0; j<subSize; j+=stride) {
		if ((oddline) && !j) j+=stride;

		/* i and j are setup. Call avgDiamondVals with the
				   current position. It will return the average of the
				   surrounding diamond data points. */
		fa[(i * size) + j] =
		scale * rand.random(-0.5,0.5) +
		avgDiamondVals (i, j, stride, size, subSize, fa);

		/* To wrap edges seamlessly, copy edge values around
				   to other side of array */
		if (i==0)
		    fa[(subSize*size) + j] =
		    fa[(i * size) + j];
		if (j==0)
		    fa[(i*size) + subSize] =
		    fa[(i * size) + j];

		j+=stride;
	    }
	}
	/* reduce random number range. */
	scale *= ratio;
	stride >>= 1;
    }
    i = j = stride = oddline = subSize = ratio = scale = null;
}

/*
 * avgSquareVals - Given the i,j location as the center of a square,
 * average the data values at the four corners of the square and return
 * it. "Stride" represents half the length of one side of the square.
 *
 * Called by fill2DFractArray.
 */
function avgSquareVals (i, j, stride, size, fa) {
    /* In this diagram, our input stride is 1, the i,j location is
       indicated by "*", and the four value we want to average are
       "X"s:
           X   .   X

           .   *   .

           X   .   X
     */
    return ((fa[((i-stride)*size) + j-stride] +fa[((i-stride)*size) + j+stride] + fa[((i+stride)*size) + j-stride] + fa[((i+stride)*size) + j+stride]) * .25);
}

/*
 * avgDiamondVals - Given the i,j location as the center of a diamond,
 * average the data values at the four corners of the diamond and
 * return it. "Stride" represents the distance from the diamond center
 * to a diamond corner.
 *
 * Called by fill2DFractArray.
 */
function avgDiamondVals (i, j, stride, size, subSize, fa) {
    /* In this diagram, our input stride is 1, the i,j location is
       indicated by "X", and the four value we want to average are
       "*"s:
           .   *   .

     *   X   *

           .   *   .
     */

    /* In order to support tiled surfaces which meet seamless at the
       edges (that is, they "wrap"), We need to be careful how we
       calculate averages when the i,j diamond center lies on an edge
       of the array. The first four 'if' clauses handle these
       cases. The final 'else' clause handles the general case (in
       which i,j is not on an edge).
     */
    if (i == 0)
	return ((fa[(i*size) + j-stride] +
	    fa[(i*size) + j+stride] +
	    fa[((subSize-stride)*size) + j] +
	    fa[((i+stride)*size) + j]) * .25);
    else if (i == size-1)
	return ((fa[(i*size) + j-stride] +
	    fa[(i*size) + j+stride] +
	    fa[((i-stride)*size) + j] +
	    fa[((0+stride)*size) + j]) * .25);
    else if (j == 0)
	return ((fa[((i-stride)*size) + j] +
	    fa[((i+stride)*size) + j] +
	    fa[(i*size) + j+stride] +
	    fa[(i*size) + subSize-stride]) * .25);
    else if (j == size-1)
	return ((fa[((i-stride)*size) + j] +
	    fa[((i+stride)*size) + j] +
	    fa[(i*size) + j-stride] +
	    fa[(i*size) + 0+stride]) * .25);
    else
	return ((fa[((i-stride)*size) + j] +
	    fa[((i+stride)*size) + j] +
	    fa[(i*size) + j-stride] +
	    fa[(i*size) + j+stride]) * .25);
}

RPG.boxFilterHeightMap = function (width, height, heightMap, smoothEdges) {
    //     width: Width of the height map in bytes
    //    height: Height of the height map in bytes
    // heightMap: Pointer to your height map data

    // Temporary values for traversing single dimensional arrays
    var x = 0;
    var z = 0;

    var  widthClamp = (smoothEdges) ?  width : width  - 1;
    var heightClamp = (smoothEdges) ? height : height - 1;

    // [Optimization] Calculate bounds ahead of time
    var bounds = width * height;

    // Validate requirements
    if (!heightMap)
	return null;

    // Allocate the result
    var result = [];


    for (z = (smoothEdges) ? 0 : 1; z < heightClamp; ++z)
    {
	for (x = (smoothEdges) ? 0 : 1; x < widthClamp; ++x)
	{
	    // Sample a 3x3 filtering grid based on surrounding neighbors

	    var value = 0.0;
	    var cellAverage = 1.0;

	    // Sample top row

	    if (((x - 1) + (z - 1) * width) >= 0 &&
		((x - 1) + (z - 1) * width) < bounds)
		{
		value += heightMap[(x - 1) + (z - 1) * width];
		++cellAverage;
	    }

	    if (((x - 0) + (z - 1) * width) >= 0 &&
		((x - 0) + (z - 1) * width) < bounds)
		{
		value += heightMap[(x    ) + (z - 1) * width];
		++cellAverage;
	    }

	    if (((x + 1) + (z - 1) * width) >= 0 &&
		((x + 1) + (z - 1) * width) < bounds)
		{
		value += heightMap[(x + 1) + (z - 1) * width];
		++cellAverage;
	    }

	    // Sample middle row

	    if (((x - 1) + (z - 0) * width) >= 0 &&
		((x - 1) + (z - 0) * width) < bounds)
		{
		value += heightMap[(x - 1) + (z    ) * width];
		++cellAverage;
	    }

	    // Sample center point (will always be in bounds)
	    value += heightMap[x + z * width];

	    if (((x + 1) + (z - 0) * width) >= 0 &&
		((x + 1) + (z - 0) * width) < bounds)
		{
		value += heightMap[(x + 1) + (z    ) * width];
		++cellAverage;
	    }

	    // Sample bottom row

	    if (((x - 1) + (z + 1) * width) >= 0 &&
		((x - 1) + (z + 1) * width) < bounds)
		{
		value += heightMap[(x - 1) + (z + 1) * width];
		++cellAverage;
	    }

	    if (((x - 0) + (z + 1) * width) >= 0 &&
		((x - 0) + (z + 1) * width) < bounds)
		{
		value += heightMap[(x    ) + (z + 1) * width];
		++cellAverage;
	    }

	    if (((x + 1) + (z + 1) * width) >= 0 &&
		((x + 1) + (z + 1) * width) < bounds)
		{
		value += heightMap[(x + 1) + (z + 1) * width];
		++cellAverage;
	    }

	    // Store the result
	    result[x + z * width] = value / cellAverage;
	    cellAverage = null;
	    value = null;
	}
    }

    x = z = widthClamp = heightClamp = bounds = null;
    // Store the new one
    return result;
}