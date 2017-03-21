
// Config file for running Rollup in "watch" mode
// This adds a sanity check to help ourselves to run 'rollup -w' as needed.

// Needed to create files loadable by IE8
import rollupGitVersion from 'rollup-plugin-git-version'
import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'

import gitRev from 'git-rev-sync'

const branch = gitRev.branch();
const rev = gitRev.short();

const version = require('../package.json').version + '+' + branch + '.' + rev;

const now = (new Date()).getTime();
const limit = now + 5 * 60 * 1000;  // 5 minutes, in milliseconds

const warningCode = `
if (false && (new Date()).getTime() > ` + limit + `) {
  var msg = "This rollupjs bundle is potentially old. Make sure you're running 'npm run-script watch' or 'yarn run watch'.";
  alert(msg);
  // throw new Error(msg);
}

/*
 * Leaflet ` + version + `, a JS library for interactive maps. http://leafletjs.com
 * (c) 2010-2016 Vladimir Agafonkin, (c) 2010-2011 CloudMade
 */

`;

export default {
  format: 'umd',
  moduleName: 'cozy',
  banner: warningCode,
  entry: 'src/cozy.js',
  dest: 'dist/cozy-src.js',
  plugins: [
    rollupGitVersion(),
    nodeResolve({ jsnext: true, main: true }),
    commonjs({
      
    })
  ],
  globals: {
    xxepubjs: 'epubjs'
  },
  sourceMap: true,
  legacy: true // Needed to create files loadable by IE8
};
