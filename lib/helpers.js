var	_ = require('lodash'),
	log = require('loglevel'),
	turf = require('@turf/turf');

function polygonToLines (p) {
	var coords = p.geometry.coordinates;
	
	var lines = [];
	for (var i=0, n=coords.length-1; i<n; i++) {
		lines.push(turf.lineString([coords[i], coords[i+1]]));
	}
	
	return turf.featureCollection(lines);
}

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

function getDiagonals (f) {
 	var coords = f.geometry.coordinates[0];
	var lines = mapNonadjacentPairs(coords, (a, b) => [a, b])
		.map(x => turf.lineString(x));
	
	return lines;
}

function getConvexDiameter (f, hull_cb) {
	var hull = turf.convex(f);
	var lines = getDiagonals(hull);
	lines.forEach((x, n) => x.properties.length = turf.length(x) );
	lines.sort((a, b) => a.properties.length - b.properties.length);
	
	if (hull_cb) hull_cb(hull);
	
	return lines.slice(-1)[0];
}

function getConcaveHull (f) {
	var points = _(f.geometry.coordinates)
		.flattenDepth((f.geometry.type === 'MultiPolygon' ? 2 : 1))
		.map(x => turf.point(x))
		.valueOf();

	var points = turf.featureCollection(points);

	var hull = null;
	var maxEdge = Math.round(Math.sqrt(turf.area(f))/100);
	do {
		var hull = turf.concave(points, {units: 'meters', maxEdge: maxEdge});
		log.trace(f);
		log.trace(maxEdge);
		maxEdge *= 10;
	} while (!hull || hull.geometry.type !== 'Polygon');

	return hull;
}

module.exports = {
	polygonToLines: polygonToLines,
	getDiagonals: getDiagonals,
	getConvexDiameter: getConvexDiameter,
	getConcaveHull: getConcaveHull,
	doesIntersect: doesIntersect,
	mapNonadjacentPairs: mapNonadjacentPairs
};