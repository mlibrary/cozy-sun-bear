// Needed to create files loadable by IE8
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import babel from 'rollup-plugin-babel';
import polyfill from 'rollup-plugin-polyfill';

// --- rollupGitVersion doesn't fit our workflow at the moment;
// import rollupGitVersion from 'rollup-plugin-git-version'
import json from 'rollup-plugin-json';

import gitRev from 'git-rev-sync'

const branch = gitRev.branch();
const rev = gitRev.short();

// this explicit version doesn't seem useful at this point
// const version = require('../package.json').version + '+' + branch + '.' + rev;
const version = require('../package.json').version + rev;

const now = (new Date()).getTime();
const limit = now + 5 * 60 * 1000;  // 5 minutes, in milliseconds
const yyyy = (new Date()).getYear() + 1900;

const banner = `/*
 * Cozy Sun Bear ` + version + `, a JS library for interactive books. http://github.com/mlibrary/cozy-sun-bear
 * (c) ${yyyy} Regents of the University of Michigan
 */`;

export default {
  format: 'umd',
  moduleName: 'cozy',
  banner: banner,
  entry: 'src/cozy.js',
  dest: 'dist/cozy-sun-bear.js',
  plugins: [
    // rollupGitVersion(),
    json({
        // exclude: 'package.json' // uncomment this if we enable rollupGitVersion
    }),
    nodeResolve({ jsnext: true, main: true }),
    babel({
      exclude: [ 'node_modules/**' ], // only transpile our source code
    }),
    commonjs({
    }),
    polyfill('src/cozy.js', ['url-polyfill', 'classlist-polyfill'])
  ],
  sourceMap: true,
  legacy: true // Needed to create files loadable by IE8
};
