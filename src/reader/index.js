import {Reader} from './Reader';
import * as EpubJS from './Reader.EpubJS';
import * as Mock from './Reader.Mock';

var engines = {
  epubjs: EpubJS.createReader,
  mock: Mock.createReader
}

var load = (function() {
  // Function which returns a function: https://davidwalsh.name/javascript-functions
  function _load(tag) {
    return function(url) {
      // This promise will be used by Promise.all to determine success or failure
      return new Promise(function(resolve, reject) {
        var element = document.createElement(tag);
        var parent = 'body';
        var attr = 'src';

        // Important success and error for the promise
        element.onload = function() {
          resolve(url);
        };
        element.onerror = function() {
          reject(url);
        };

        // Need to set different attributes depending on tag type
        switch(tag) {
          case 'script':
            element.async = true;
            break;
          case 'link':
            element.type = 'text/css';
            element.rel = 'stylesheet';
            attr = 'href';
            parent = 'head';
        }

        // Inject into document to kick off loading
        element[attr] = url;
        document[parent].appendChild(element);
      });
    };
  }
  
  return {
    css: _load('link'),
    js: _load('script'),
    img: _load('img')
  }
})();

var xload = {
	js: function(url) {
		var handler = {};
		handler.callbacks = [];
		handler.error = [];
		handler.then = function(cb) {
			handler.callbacks.push(cb);
			return handler;
		}
		handler.catch = function(cb) {
			handler.error.push(cb);
			return handler;
		}
		handler.resolve = function(_argv) {
			// var _argv;
			while ( handler.callbacks.length ) {
				var cb = handler.callbacks.shift();
				var retval;
				try {
					_argv = cb(_argv);
				} catch(e) {
					handler.reject(e);
					break;
				}
			}
		}

		handler.reject = function(e) {
			while ( handler.error.length ) {
				var cb = handler.error.shift();
				cb(e);
			}
		}

		var element = document.createElement('script');

		element.onload = function() {
		  handler.resolve(url);
		};
		element.onerror = function() {
		  // console.log("BAD THINGS HAPPANED", url);
		  handler.catch.apply(arguments);
		};

		element.async = true;
		var parent = 'body';
		var attr = 'src';
		element[attr] = url;
		document[parent].appendChild(element);

		return handler;
	}
}


export var reader = function(id, options) {
  var engine = options.engine || window.COZY_EPUB_ENGINE || 'epubjs';
  var engine_href = options.engine_href || window.COZY_EPUB_ENGINE_HREF;
  var _this = this;
  var _arguments = arguments;

  // return engines[engine].apply(this, arguments);
  console.log("AHOY LOADING", engine_href, options.engine, engine);
  return xload.js(engine_href).then(function() {
  	console.log("AHOY LOADED epub.js", engine_href, engine);
    return engines[engine].apply(_this, _arguments);
  }).catch(function(e) {
    console.log('Oh no, epic failure!', e);
  });
}