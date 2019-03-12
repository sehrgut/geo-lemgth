var log = require('loglevel'),
	_ = require('lodash'),
	roundTo = require('round-to'),
	convert = require('convert-units'),
	fmt = require('util').format,
	turf = require('@turf/turf'),
	lemgth = require('../');
	silly = require('../lib/silly');

log.setLevel("info");

var states = require('../data/gz_2010_us_040_00_20m.json');

console.log("## Hull Aspect Ratio");
turf.featureEach(states, x => lemgth(x, lemgth.Metrics.HULL_DIAMETER_AREA));
states.features.sort((a, b) => b.properties.AR_ASPECTRATIO - a.properties.AR_ASPECTRATIO);

turf.featureEach(states, x => console.log(fmt("%s: %d (%dkm, %dkm2)",
	silly.deglyph(x.properties.NAME),
	x.properties.AR_ASPECTRATIO,
	roundTo(x.properties.AR_HULLDIAMETER, 2),
	roundTo(convert(x.properties.AR_HULLAREA).from('m2').to('km2'), 0))));
