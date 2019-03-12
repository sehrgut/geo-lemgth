var log = require('loglevel'),
	_ = require('lodash'),
	roundTo = require('round-to'),
	fmt = require('util').format,
	turf = require('@turf/turf'),
	lemgth = require('../')
	silly = require('../lib/silly');

log.setLevel("info");

var states = require('../data/gz_2010_us_040_00_20m.json');

console.log("## Convex Hull");
turf.featureEach(states, x => lemgth(x,lemgth.Metrics.CONVEX_HULL_DIAGONALS));
states.features.sort((a, b) => b.properties.AR_ASPECTRATIO - a.properties.AR_ASPECTRATIO);

turf.featureEach(states, x => console.log(fmt("%s: %d (%dkm x %dkm)",
	silly.deglyph(x.properties.NAME),
	x.properties.AR_ASPECTRATIO,
	roundTo(x.properties.AR_MAXLENGTH, 2),
	roundTo(x.properties.AR_MEANWIDTH, 2))));
