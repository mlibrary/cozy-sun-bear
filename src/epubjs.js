
// var ePub = window.ePub;
// export {ePub};

export function ePub(options) {
	if ( window.require !== undefined ) {
		window.ePub = require("ePub");
	}
  return window.ePub(options);
}