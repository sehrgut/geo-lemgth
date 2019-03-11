var turf = require('@turf/turf');

function doesIntersect (featA, featB) {
	var fc = turf.lineIntersect(featA, featB);
	return fc.features.length > 0;
}

// todo: wrappers for feature and geometry#polygon input
function mapNonadjacentPairs(arr, cb) {
	var len = arr.length;
	var out = [];
	for (var i=0, n=len-1; i<n; i++) {
		for (var j=i+2, m=len; j<n; j++) {
			// todo: elegant way to skip last on first run. mod somehow?
			if (i==0 && j==m-1) continue; 
			out.push(cb(arr[i], arr[j]));
		}
	}
	return out;
}

function getHullDiameters (f) {
	var hull = turf.convex(f);

 	//todo: can hull generate discontinuous polys?
 	var coords = hull.geometry.coordinates[0];
	var lines = mapNonadjacentPairs(coords, (a, b) => [a, b])
		.map(x => turf.lineString(x));
	
	return lines;
}

module.exports = {
	getHullDiameters: getHullDiameters,
	doesIntersect: doesIntersect,
	mapNonadjacentPairs: mapNonadjacentPairs
};