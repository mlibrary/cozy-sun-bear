import {Reader} from './Reader';
import * as EpubJS from './Reader.EpubJS';
import * as Mock from './Reader.Mock';

var engines = {
  epubjs: EpubJS.createReader,
  mock: Mock.createReader
}

var load = {
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
  options = options || {};
  var engine = options.engine || window.COZY_EPUB_ENGINE || 'epubjs';
  var engine_href = options.engine_href || window.COZY_EPUB_ENGINE_HREF;
  var _this = this;
  var _arguments = arguments;

  options.engine = engine;
  options.engine_href = engine_href;

  // if ( engine_href == null ) {
  // 	return engines[engine].apply(_this, _arguments);
  // }

  return engines[engine].apply(_this, [id, options]);
}