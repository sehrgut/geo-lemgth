var	_ = require('lodash'),
	log = require('loglevel'),
	turf = require('@turf/turf'),
	roundTo = require('round-to');
	fmt = require('util').format,
	helpers = require('./helpers');

//todo: method that works on any poly instead of convex hull
//todo: enum of metrics, single method

function convexHullAR (f) {
	var hull = turf.convex(f);
	var diags = helpers.getDiagonals(hull);
	diags.forEach((x, n) => x.properties.length = turf.length(x) );
	diags.sort((a, b) => a.properties.length - b.properties.length);

	var maxDiag = diags.slice(-1)[0];

	log.trace("##MAXLINE");
	log.trace(maxDiag);

	log.trace("##INTERSECTS");
	log.trace(fmt("Testing %d lines", diags.length));
	
	var xDiags = [];
	
	for (var i=0, n=diags.length-1; i<n; i++) {
		if (helpers.doesIntersect(diags[i], maxDiag)) {
			xDiags.push(diags[i]);
		}
	}

	log.trace(fmt("Found %d intersecting lines", xDiags.length));
	log.trace(xDiags);

	var xSum = _(xDiags).sumBy(x => x.properties.length);
	var xMean = xSum / xDiags.length;
	
	log.trace(fmt("Found a mean length of %d intersecting the max", xMean));

// todo: incorporate bearing, look for closest to 90 off?

	var aspectLengths = [ maxDiag.properties.length, xMean ];

	aspectRatio = aspectLengths[0] / aspectLengths[1];

	f.properties.AR_ASPECTRATIO = roundTo(aspectRatio, 2);
	f.properties.AR_MAXLENGTH = aspectLengths[0];
	f.properties.AR_MEANWIDTH = aspectLengths[1];
	f.properties.AR_METRIC = 'CONVEXHULL';
}

function hullPolyAR (f) {
	var diam = helpers.getConvexDiameter(f);
	var dlen = turf.length(diam);
	var area = turf.area(f);
	aspectRatio = Math.pow(dlen * 1000, 2) / area;

	f.properties.AR_ASPECTRATIO = roundTo(aspectRatio, 2);
	f.properties.AR_HULLDIAMETER = dlen;
	f.properties.AR_POLYAREA = area;
	f.properties.AR_METRIC = 'HULLDIAMPOLYAREA';

}

function hullAR (f) {

	var hull = null;

	var diam = helpers.getConvexDiameter(f, h => (hull = h));
	var dlen = turf.length(diam);
	var area = turf.area(hull);
	aspectRatio = Math.pow(dlen * 1000, 2) / area;

	f.properties.AR_ASPECTRATIO = roundTo(aspectRatio, 2);
	f.properties.AR_HULLDIAMETER = dlen;
	f.properties.AR_HULLAREA = area;
	f.properties.AR_METRIC = 'HULL';

}

function concaveHullAR (f) {
	var hull = helpers.getConcaveHull(f);
	var diags = helpers.getDiagonals(hull);
	log.info(fmt('Found %d diagonals', diags.length));
	diags = _.filter(diags, x => turf.lineIntersect(x, hull).features.length == 2 );
	log.info(fmt('Found %d non-intersecting diagonals', diags.length));
	
	diags.forEach((x, n) => x.properties.length = turf.length(x) );
	diags.sort((a, b) => a.properties.length - b.properties.length);

	var maxDiag = diags.slice(-1)[0];
	
	log.info('Max diagonal found: ');
	log.info(maxDiag);
	
	xDiags = _(diags.slice(0, -1)).filter(x => helpers.doesIntersect(x, maxDiag));
	
	log.info(fmt('Found %d diagonals intersecting maxDiag', xDiags.size()));
	
	var xSum = xDiags.sumBy(x => x.properties.length);
	var xMean = xSum / xDiags.size();
	
	log.info(fmt('Mean length of %d intersecting the max', xMean));

	var aspectLengths = [ maxDiag.properties.length, xMean ];

	aspectRatio = aspectLengths[0] / aspectLengths[1];

	f.properties.AR_ASPECTRATIO = roundTo(aspectRatio, 2);
	f.properties.AR_MAXLENGTH = aspectLengths[0];
	f.properties.AR_MEANWIDTH = aspectLengths[1];
	f.properties.AR_METRIC = 'CONCAVEHULL';

}

/*
// old method using geolib
var stateboxes = require('./data/state_bounds.json').map(mapState).sort((a, b) => a.ar - b.ar);

function mapState (x) {
	x = x[0];
	var b = x.boundingbox;
	var n = x.display_name.split(",")[0];
	var width = geo.getDistance({latitude: b[0], longitude: b[2]}, {latitude: b[0], longitude: b[3]});
	var height = geo.getDistance({latitude: b[0], longitude: b[2]}, {latitude: b[1], longitude: b[2]});
	
	return {
		name: n,
		boundingbox: b,
		width: convert(width).from('m').to('mi'),
		height: convert(height).from('m').to('mi'),
		ar: Math.abs(width / height)
	};
}


stateboxes.forEach(function (x) {
	console.log(fmt("%s: %d", x.name, roundTo(x.ar,2)));
});
*/

function boundingBoxAR (f) {
// todo: find out what's up with Alaska
	var minx, miny, maxx, maxy;
	var [minx, miny, maxx, maxy] = turf.bbox(f);

	var width = (turf.distance([minx, miny], [maxx, miny]) +
					turf.distance([minx, maxy], [maxx, maxy])) / 2;
	var height = turf.distance([maxx, miny], [maxx, maxy]);

	var aspectRatio = Math.max(width, height) / Math.min(width, height);

	f.properties.AR_ASPECTRATIO = roundTo(aspectRatio, 2);
	f.properties.AR_BOXHEIGHT = height;
	f.properties.AR_MEANBOXWIDTH = width;
	f.properties.AR_METRIC = 'BOUNDINGBOX';
}

function boundingBoxAR2 (f) {
// currently a work in progress: not complete
	log.info(fmt("## boundingBoxAR region %s",
		f.properties.NAME ? f.properties.NAME : 'unnamed'));
// todo: find out what's up with Alaska (and multipolygons in general)
	var hull = helpers.getConcaveHull(f);
	var minx, miny, maxx, maxy;
	var [minx, miny, maxx, maxy] = turf.bbox(hull);
	
	var bbox = turf.bboxPolygon(turf.bbox(hull));
	var lines = turf.lineSegment(bbox);
	turf.featureEach(lines, x => x.properties.length = turf.length(x));
	console.log(lines.features);

	log.info(fmt("%d %d %d %d", minx, miny, maxx, maxy));

	var widths = [turf.distance([minx, miny], [maxx, miny]),
					turf.distance([minx, maxy], [maxx, maxy])];
	log.info(fmt("Widths: %d, %d", widths[0], widths[1]));
	
	var width = (widths[0] + widths[1]) / 2;
	var height = turf.distance([maxx, miny], [maxx, maxy]);

	var aspectRatio = Math.max(width, height) / Math.min(width, height);

	f.properties.AR_ASPECTRATIO = roundTo(aspectRatio, 2);
	f.properties.AR_BOXHEIGHT = height;
	f.properties.AR_MEANBOXWIDTH = width;
	f.properties.AR_METRIC = 'BOUNDINGBOX2';
}

function lemgth(feature, metric) {
	switch(metric) {
		case lemgth.Metrics.CONVEX_HULL_DIAGONALS:
			return convexHullAR(feature);
		case lemgth.Metrics.HULL_DIAMETER_POLY_AREA:
			return hullPolyAR(feature);
		case lemgth.Metrics.HULL_DIAMETER_AREA:
			return hullAR(feature);
		case lemgth.Metrics.BOUNDING_BOX:
			return boundingBoxAR(feature);
		case lemgth.Metrics.BBOX_OF_CONCAVE_HULL:
			return boundingBoxAR2(feature);
		case lemgth.Metrics.CONCAVE_HULL:
			return concaveHullAR(feature);
		default:
			throw fmt("Unknown metric '%s'", metric);
	}
}

lemgth.Metrics = {
	CONVEX_HULL_DIAGONALS: 1,
	HULL_DIAMETER_POLY_AREA: 2,
	HULL_DIAMETER_AREA: 3,
	BOUNDING_BOX: 4,
	BBOX_OF_CONCAVE_HULL: 5,
	CONCAVE_HULL: 6
};

module.exports = lemgth;