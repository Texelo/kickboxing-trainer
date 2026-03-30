module.exports = {
	globDirectory: 'dist',
	globPatterns: [
		'**/*.{html,json,ico,ttf,js}'
	],
	swDest: 'dist/sw.js',
	ignoreURLParametersMatching: [
		/^utm_/,
		/^fbclid$/
	]
};