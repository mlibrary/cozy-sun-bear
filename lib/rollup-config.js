
// Config file for running Rollup in "normal" mode (non-watch)

import rollupGitVersion from 'rollup-plugin-git-version'
import json from 'rollup-plugin-json'

import gitRev from 'git-rev-sync'


let version = require('../package.json').version;
let release;

// Skip the git branch+rev in the banner when doing a release build
if (process.env.NODE_ENV === 'release') {
    release = true;
} else {
    release = false;
    const branch = gitRev.branch();
    const rev = gitRev.short();
    version += '+' + branch + '.' + rev;
}


const banner = `/*
 * Cozy Sun Bar ` + version + `, a JS library for interactive books. http://github.com/mlibrary/cozy-sun-bar
 * (c) 2017 Regents of the University of Michigan
 */`;

export default {
    format: 'umd',
    moduleName: 'cozy',
    banner: banner,
    entry: 'src/cozy.js',
    dest: 'dist/cozy-src.js',
    plugins: [
        release ? json() : rollupGitVersion(),
    ],
    sourceMap: true,
    legacy: true // Needed to create files loadable by IE8
};
