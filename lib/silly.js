function deglyph (s) {
	return s.replace(/n/g, 'm').replace(/N/g, 'M');
}

module.exports = {
	deglyph: deglyph
};