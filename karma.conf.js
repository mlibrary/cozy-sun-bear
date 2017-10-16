var json = require('rollup-plugin-json');
var buble = require('rollup-plugin-buble'); // ES6 to ES5 transpiler
var commonjs = require('rollup-plugin-commonjs');
var nodeResolve = require('rollup-plugin-node-resolve');

// Karma configuration
module.exports = function (config) {
  var files = [
    "src/cozy.js",
    "node_modules/sinon/pkg/sinon.js",
    "node_modules/expect.js/index.js",
		"node_modules/happen/happen.js",
		"node_modules/prosthetic-hand/dist/prosthetic-hand.js",
		"spec/SpecHelper.js",
		"spec/**/*Spec.js"
  ];

	var exclude = [
  ];

	config.set({
    // base path, that will be used to resolve files and exclude
		basePath: '',

		// plugins
		plugins: [
			'karma-rollup-plugin',
			'karma-mocha',
			'karma-coverage',
			'karma-coveralls',
			'karma-sourcemap-loader',
			'karma-phantomjs-launcher',
			'karma-chrome-launcher',
			'karma-safari-launcher',
			'karma-firefox-launcher',
			'karma-jsdom-launcher'],

		// frameworks to use
		frameworks: ['mocha'],

		// list of files / patterns to load in the browser
		files: files,

		// list of files / patterns to exclude from invoking
		exclude: exclude,

		// Rollup the ES6 Cozy sources into just one ES5 file, before tests
		preprocessors: {
			'src/cozy.js': ['rollup', 'coverage']
		},
		rollupPreprocessor: {
			plugins: [
				json(),
		    nodeResolve({ jsnext: true, main: true, browser: true, preferBuiltins: true }),
				commonjs(),
				buble()
			],
			format: 'umd',
			moduleName: 'cozy' //,
			// sourceMap: 'inline'
		},

		// test results reporter(s) to use possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
		reporters: ['dots', 'coverage', 'coveralls'],
		coverageReporter: {
			type: 'lcov',
			dir: 'coverage/'
		},

		// web server port
		port: 9876,

		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_WARN,

		// enable / disable colors in the output (reporters and logs)
		colors: true,

		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: false,

		// Start these browsers, currently available:
		// - Chrome
		// - ChromeCanary
		// - Firefox
		// - Opera
		// - Safari (only Mac)
		// - PhantomJS
		// - IE (only Windows)
		// browsers: ['PhantomJSCustom'],
		browsers: ['ChromeHeadless'],
		customLaunchers: {
			// 'PhantomJSCustom': {
			// 	base: 'PhantomJS',
			// 	flags: ['--load-images=true'],
			// 	options: {
			// 		onCallback: function (data) {
			// 			if (data.render) {
			// 				page.render(data.render);
			// 			}
			// 		}
			// 	}
			// }
		},

		browserConsoleLogOptions: {
		      level: 'log',
		      format: '%b %T: %m',
		      terminal: true
		},

		// If browser does not capture in given timeout [ms], kill it
		captureTimeout: 5000,

		// Workaround for PhantomJS random DISCONNECTED error
		browserDisconnectTimeout: 10000, // default 2000
		browserDisconnectTolerance: 1, // default 0

		// Continuous Integration mode
		// if true, it capture browsers, run tests and exit
		singleRun: true
	});
};
