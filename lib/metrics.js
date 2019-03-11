var	_ = require('lodash'),
	log = require('loglevel'),
	turf = require('@turf/turf'),
	roundTo = require('round-to');
	fmt = require('util').format,
	helpers = require('./helpers');

//todo: method that works on any poly instead of convex hull
//todo: enum of metrics, single method

function convexHullAR (f) {
	var lines = helpers.getHullDiameters(f);
	lines.forEach((x, n) => x.properties.length = turf.length(x) );
	lines.sort((a, b) => a.properties.length - b.properties.length);

	var maxLine = lines.slice(-1)[0];
	var minLine = null;

	log.trace("##MAXLINE");
	log.trace(maxLine);

	log.trace("##INTERSECTS");
	log.trace(fmt("Testing %d lines", lines.length));
	
	var xLines = [];
	
	for (var i=0, n=lines.length-1; i<n; i++) {
		if (helpers.doesIntersect(lines[i], maxLine)) {
			xLines.push(lines[i]);
		}
	}

	log.trace(fmt("Found %d intersecting lines", xLines.length));
	log.trace(xLines);

	var xSum = _(xLines).sumBy(x => x.properties.length);
	var xMean = xSum / xLines.length;
	
	log.trace(fmt("Found a mean length of %d intersecting the max", xMean));

// todo: incorporate bearing, look for closest to 90 off?

	var aspectLengths = [ maxLine.properties.length, xMean ];

	aspectRatio = aspectLengths[0] / aspectLengths[1];

	f.properties.AR_ASPECTRATIO = roundTo(aspectRatio, 2);
	f.properties.AR_MAXLENGTH = aspectLengths[0];
	f.properties.AR_MEANWIDTH = aspectLengths[1];
	f.properties.AR_METRIC = 'CONVEXHULL';

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

module.exports = {
	boundingBoxAR: boundingBoxAR,
	convexHullAR: convexHullAR
};








