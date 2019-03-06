import {version} from '../package.json';
export {version};

// control
export * from './control/index';

// core
export * from './core/index';

// dom
export * from './dom/index';

// reader
export * from './reader/index';

// misc

var oldCozy = window.cozy;
export function noConflict() {
  window.cozy = oldCozy;
  return this;
}
