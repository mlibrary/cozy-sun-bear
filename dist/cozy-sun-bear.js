/*
 * Cozy Sun Bear 1.0.021f3ab4, a JS library for interactive books. http://github.com/mlibrary/cozy-sun-bear
 * (c) 2018 Regents of the University of Michigan
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.cozy = global.cozy || {})));
}(this, (function (exports) { 'use strict';

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};





function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

(function(global) {
  /**
   * Polyfill URLSearchParams
   *
   * Inspired from : https://github.com/WebReflection/url-search-params/blob/master/src/url-search-params.js
   */

  var checkIfIteratorIsSupported = function() {
    try {
      return !!Symbol.iterator;
    } catch(error) {
      return false;
    }
  };


  var iteratorSupported = checkIfIteratorIsSupported();

  var createIterator = function(items) {
    var iterator = {
      next: function() {
        var value = items.shift();
        return { done: value === void 0, value: value };
      }
    };

    if(iteratorSupported) {
      iterator[Symbol.iterator] = function() {
        return iterator;
      };
    }

    return iterator;
  };

  /**
   * Search param name and values should be encoded according to https://url.spec.whatwg.org/#urlencoded-serializing
   * encodeURIComponent() produces the same result except encoding spaces as `%20` instead of `+`.
   */
  var serializeParam = function(value) {
    return encodeURIComponent(value).replace(/%20/g, '+');
  };

  var deserializeParam = function(value) {
    return decodeURIComponent(value).replace(/\+/g, ' ');
  };

  var polyfillURLSearchParams= function() {

    var URLSearchParams = function(searchString) {
      Object.defineProperty(this, '_entries', { value: {} });

      if(typeof searchString === 'string') {
        if(searchString !== '') {
          searchString = searchString.replace(/^\?/, '');
          var attributes = searchString.split('&');
          var attribute;
          for(var i = 0; i < attributes.length; i++) {
            attribute = attributes[i].split('=');
            this.append(
              deserializeParam(attribute[0]),
              (attribute.length > 1) ? deserializeParam(attribute[1]) : ''
            );
          }
        }
      } else if(searchString instanceof URLSearchParams) {
        var _this = this;
        searchString.forEach(function(value, name) {
          _this.append(value, name);
        });
      }
    };

    var proto = URLSearchParams.prototype;

    proto.append = function(name, value) {
      if(name in this._entries) {
        this._entries[name].push(value.toString());
      } else {
        this._entries[name] = [value.toString()];
      }
    };

    proto.delete = function(name) {
      delete this._entries[name];
    };

    proto.get = function(name) {
      return (name in this._entries) ? this._entries[name][0] : null;
    };

    proto.getAll = function(name) {
      return (name in this._entries) ? this._entries[name].slice(0) : [];
    };

    proto.has = function(name) {
      return (name in this._entries);
    };

    proto.set = function(name, value) {
      this._entries[name] = [value.toString()];
    };

    proto.forEach = function(callback, thisArg) {
      var entries;
      for(var name in this._entries) {
        if(this._entries.hasOwnProperty(name)) {
          entries = this._entries[name];
          for(var i = 0; i < entries.length; i++) {
            callback.call(thisArg, entries[i], name, this);
          }
        }
      }
    };

    proto.keys = function() {
      var items = [];
      this.forEach(function(value, name) { items.push(name); });
      return createIterator(items);
    };

    proto.values = function() {
      var items = [];
      this.forEach(function(value) { items.push(value); });
      return createIterator(items);
    };

    proto.entries = function() {
      var items = [];
      this.forEach(function(value, name) { items.push([name, value]); });
      return createIterator(items);
    };

    if(iteratorSupported) {
      proto[Symbol.iterator] = proto.entries;
    }

    proto.toString = function() {
      var searchString = '';
      this.forEach(function(value, name) {
        if(searchString.length > 0) searchString+= '&';
        searchString += serializeParam(name) + '=' + serializeParam(value);
      });
      return searchString;
    };

    global.URLSearchParams = URLSearchParams;
  };

  if(!('URLSearchParams' in global) || (new URLSearchParams('?a=1').toString() !== 'a=1')) {
    polyfillURLSearchParams();
  }

  // HTMLAnchorElement

})(
  (typeof commonjsGlobal !== 'undefined') ? commonjsGlobal
    : ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : commonjsGlobal))
);

(function(global) {
  /**
   * Polyfill URL
   *
   * Inspired from : https://github.com/arv/DOM-URL-Polyfill/blob/master/src/url.js
   */

  var checkIfURLIsSupported = function() {
    try {
      var u = new URL('b', 'http://a');
      u.pathname = 'c%20d';
      return (u.href === 'http://a/c%20d') && u.searchParams;
    } catch(e) {
      return false;
    }
  };


  var polyfillURL = function() {
    var _URL = global.URL;

    var URL = function(url, base) {
      if(typeof url !== 'string') url = String(url);

      var doc = document.implementation.createHTMLDocument('');
      window.doc = doc;
      if(base) {
        var baseElement = doc.createElement('base');
        baseElement.href = base;
        doc.head.appendChild(baseElement);
      }

      var anchorElement = doc.createElement('a');
      anchorElement.href = url;
      doc.body.appendChild(anchorElement);
      anchorElement.href = anchorElement.href; // force href to refresh

      if(anchorElement.protocol === ':' || !/:/.test(anchorElement.href)) {
        throw new TypeError('Invalid URL');
      }

      Object.defineProperty(this, '_anchorElement', {
        value: anchorElement
      });
    };

    var proto = URL.prototype;

    var linkURLWithAnchorAttribute = function(attributeName) {
      Object.defineProperty(proto, attributeName, {
        get: function() {
          return this._anchorElement[attributeName];
        },
        set: function(value) {
          this._anchorElement[attributeName] = value;
        },
        enumerable: true
      });
    };

    ['hash', 'host', 'hostname', 'port', 'protocol', 'search']
    .forEach(function(attributeName) {
      linkURLWithAnchorAttribute(attributeName);
    });

    Object.defineProperties(proto, {

      'toString': {
        get: function() {
          var _this = this;
          return function() {
            return _this.href;
          };
        }
      },

      'href' : {
        get: function() {
          return this._anchorElement.href.replace(/\?$/,'');
        },
        set: function(value) {
          this._anchorElement.href = value;
        },
        enumerable: true
      },

      'pathname' : {
        get: function() {
          return this._anchorElement.pathname.replace(/(^\/?)/,'/');
        },
        set: function(value) {
          this._anchorElement.pathname = value;
        },
        enumerable: true
      },

      'origin': {
        get: function() {
          // get expected port from protocol
          var expectedPort = {'http:': 80, 'https:': 443, 'ftp:': 21}[this._anchorElement.protocol];
          // add port to origin if, expected port is different than actual port
          // and it is not empty f.e http://foo:8080
          // 8080 != 80 && 8080 != ''
          var addPortToOrigin = this._anchorElement.port != expectedPort &&
            this._anchorElement.port !== '';

          return this._anchorElement.protocol +
            '//' +
            this._anchorElement.hostname +
            (addPortToOrigin ? (':' + this._anchorElement.port) : '');
        },
        enumerable: true
      },

      'password': { // TODO
        get: function() {
          return '';
        },
        set: function(value) {
        },
        enumerable: true
      },

      'username': { // TODO
        get: function() {
          return '';
        },
        set: function(value) {
        },
        enumerable: true
      },

      'searchParams': {
        get: function() {
          var searchParams = new URLSearchParams(this.search);
          var _this = this;
          ['append', 'delete', 'set'].forEach(function(methodName) {
            var method = searchParams[methodName];
            searchParams[methodName] = function() {
              method.apply(searchParams, arguments);
              _this.search = searchParams.toString();
            };
          });
          return searchParams;
        },
        enumerable: true
      }
    });

    URL.createObjectURL = function(blob) {
      return _URL.createObjectURL.apply(_URL, arguments);
    };

    URL.revokeObjectURL = function(url) {
      return _URL.revokeObjectURL.apply(_URL, arguments);
    };

    global.URL = URL;

  };

  if(!checkIfURLIsSupported()) {
    polyfillURL();
  }

  if((global.location !== void 0) && !('origin' in global.location)) {
    var getOrigin = function() {
      return global.location.protocol + '//' + global.location.hostname + (global.location.port ? (':' + global.location.port) : '');
    };

    try {
      Object.defineProperty(global.location, 'origin', {
        get: getOrigin,
        enumerable: true
      });
    } catch(e) {
      setInterval(function() {
        global.location.origin = getOrigin();
      }, 100);
    }
  }

})(
  (typeof commonjsGlobal !== 'undefined') ? commonjsGlobal
    : ((typeof window !== 'undefined') ? window
    : ((typeof self !== 'undefined') ? self : commonjsGlobal))
);

/*
 * classList.js: Cross-browser full element.classList implementation.
 * 1.1.20170427
 *
 * By Eli Grey, http://eligrey.com
 * License: Dedicated to the public domain.
 *   See https://github.com/eligrey/classList.js/blob/master/LICENSE.md
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */

if ("document" in window.self) {

// Full polyfill for browsers with no classList support
// Including IE < Edge missing SVGElement.classList
if (!("classList" in document.createElement("_")) 
	|| document.createElementNS && !("classList" in document.createElementNS("http://www.w3.org/2000/svg","g"))) {

(function (view) {

"use strict";

if (!('Element' in view)) return;

var
	  classListProp = "classList"
	, protoProp = "prototype"
	, elemCtrProto = view.Element[protoProp]
	, objCtr = Object
	, strTrim = String[protoProp].trim || function () {
		return this.replace(/^\s+|\s+$/g, "");
	}
	, arrIndexOf = Array[protoProp].indexOf || function (item) {
		var
			  i = 0
			, len = this.length;
		for (; i < len; i++) {
			if (i in this && this[i] === item) {
				return i;
			}
		}
		return -1;
	}
	// Vendors: please allow content code to instantiate DOMExceptions
	, DOMEx = function (type, message) {
		this.name = type;
		this.code = DOMException[type];
		this.message = message;
	}
	, checkTokenAndGetIndex = function (classList, token) {
		if (token === "") {
			throw new DOMEx(
				  "SYNTAX_ERR"
				, "An invalid or illegal string was specified"
			);
		}
		if (/\s/.test(token)) {
			throw new DOMEx(
				  "INVALID_CHARACTER_ERR"
				, "String contains an invalid character"
			);
		}
		return arrIndexOf.call(classList, token);
	}
	, ClassList = function (elem) {
		var
			  trimmedClasses = strTrim.call(elem.getAttribute("class") || "")
			, classes = trimmedClasses ? trimmedClasses.split(/\s+/) : []
			, i = 0
			, len = classes.length;
		for (; i < len; i++) {
			this.push(classes[i]);
		}
		this._updateClassName = function () {
			elem.setAttribute("class", this.toString());
		};
	}
	, classListProto = ClassList[protoProp] = []
	, classListGetter = function () {
		return new ClassList(this);
	};
// Most DOMException implementations don't allow calling DOMException's toString()
// on non-DOMExceptions. Error's toString() is sufficient here.
DOMEx[protoProp] = Error[protoProp];
classListProto.item = function (i) {
	return this[i] || null;
};
classListProto.contains = function (token) {
	token += "";
	return checkTokenAndGetIndex(this, token) !== -1;
};
classListProto.add = function () {
	var
		  tokens = arguments
		, i = 0
		, l = tokens.length
		, token
		, updated = false;
	do {
		token = tokens[i] + "";
		if (checkTokenAndGetIndex(this, token) === -1) {
			this.push(token);
			updated = true;
		}
	}
	while (++i < l);

	if (updated) {
		this._updateClassName();
	}
};
classListProto.remove = function () {
	var
		  tokens = arguments
		, i = 0
		, l = tokens.length
		, token
		, updated = false
		, index;
	do {
		token = tokens[i] + "";
		index = checkTokenAndGetIndex(this, token);
		while (index !== -1) {
			this.splice(index, 1);
			updated = true;
			index = checkTokenAndGetIndex(this, token);
		}
	}
	while (++i < l);

	if (updated) {
		this._updateClassName();
	}
};
classListProto.toggle = function (token, force) {
	token += "";

	var
		  result = this.contains(token)
		, method = result ?
			force !== true && "remove"
		:
			force !== false && "add";

	if (method) {
		this[method](token);
	}

	if (force === true || force === false) {
		return force;
	} else {
		return !result;
	}
};
classListProto.toString = function () {
	return this.join(" ");
};

if (objCtr.defineProperty) {
	var classListPropDesc = {
		  get: classListGetter
		, enumerable: true
		, configurable: true
	};
	try {
		objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
	} catch (ex) { // IE 8 doesn't support enumerable:true
		// adding undefined to fight this issue https://github.com/eligrey/classList.js/issues/36
		// modernie IE8-MSW7 machine has IE8 8.0.6001.18702 and is affected
		if (ex.number === undefined || ex.number === -0x7FF5EC54) {
			classListPropDesc.enumerable = false;
			objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
		}
	}
} else if (objCtr[protoProp].__defineGetter__) {
	elemCtrProto.__defineGetter__(classListProp, classListGetter);
}

}(window.self));

}

// There is full or partial native classList support, so just check if we need
// to normalize the add/remove and toggle APIs.

(function () {
	"use strict";

	var testElement = document.createElement("_");

	testElement.classList.add("c1", "c2");

	// Polyfill for IE 10/11 and Firefox <26, where classList.add and
	// classList.remove exist but support only one argument at a time.
	if (!testElement.classList.contains("c2")) {
		var createMethod = function(method) {
			var original = DOMTokenList.prototype[method];

			DOMTokenList.prototype[method] = function(token) {
				var i, len = arguments.length;

				for (i = 0; i < len; i++) {
					token = arguments[i];
					original.call(this, token);
				}
			};
		};
		createMethod('add');
		createMethod('remove');
	}

	testElement.classList.toggle("c3", false);

	// Polyfill for IE 10 and Firefox <24, where classList.toggle does not
	// support the second argument.
	if (testElement.classList.contains("c3")) {
		var _toggle = DOMTokenList.prototype.toggle;

		DOMTokenList.prototype.toggle = function(token, force) {
			if (1 in arguments && !this.contains(token) === !force) {
				return force;
			} else {
				return _toggle.call(this, token);
			}
		};

	}

	testElement = null;
}());

}

var version = "1.0.0";

/*
 * @namespace Util
 *
 * Various utility functions, used by Leaflet internally.
 */

// @function extend(dest: Object, src?: Object): Object
// Merges the properties of the `src` object (or multiple objects) into `dest` object and returns the latter. Has an `L.extend` shortcut.
function extend(dest) {
    var i, j, len, src;

    for (j = 1, len = arguments.length; j < len; j++) {
        src = arguments[j];
        for (i in src) {
            dest[i] = src[i];
        }
    }
    return dest;
}

// @function create(proto: Object, properties?: Object): Object
// Compatibility polyfill for [Object.create](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/create)
var create = Object.create || function () {
    function F() {}
    return function (proto) {
        F.prototype = proto;
        return new F();
    };
}();

// @function bind(fn: Function, …): Function
// Returns a new function bound to the arguments passed, like [Function.prototype.bind](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Function/bind).
// Has a `L.bind()` shortcut.
function bind(fn, obj) {
    var slice = Array.prototype.slice;

    if (fn.bind) {
        return fn.bind.apply(fn, slice.call(arguments, 1));
    }

    var args = slice.call(arguments, 2);

    return function () {
        return fn.apply(obj, args.length ? args.concat(slice.call(arguments)) : arguments);
    };
}

// @property lastId: Number
// Last unique ID used by [`stamp()`](#util-stamp)
var lastId = 0;

// @function stamp(obj: Object): Number
// Returns the unique ID of an object, assiging it one if it doesn't have it.
function stamp(obj) {
    /*eslint-disable */
    obj._cozy_id = obj._cozy_id || ++lastId;
    return obj._cozy_id; /* not leaflet */
    /*eslint-enable */
}

// @function throttle(fn: Function, time: Number, context: Object): Function
// Returns a function which executes function `fn` with the given scope `context`
// (so that the `this` keyword refers to `context` inside `fn`'s code). The function
// `fn` will be called no more than one time per given amount of `time`. The arguments
// received by the bound function will be any arguments passed when binding the
// function, followed by any arguments passed when invoking the bound function.
// Has an `L.throttle` shortcut.
function throttle(fn, time, context) {
    var lock, args, wrapperFn, later;

    later = function later() {
        // reset lock and call if queued
        lock = false;
        if (args) {
            wrapperFn.apply(context, args);
            args = false;
        }
    };

    wrapperFn = function wrapperFn() {
        if (lock) {
            // called too soon, queue to call later
            args = arguments;
        } else {
            // call and lock until later
            fn.apply(context, arguments);
            setTimeout(later, time);
            lock = true;
        }
    };

    return wrapperFn;
}

// @function wrapNum(num: Number, range: Number[], includeMax?: Boolean): Number
// Returns the number `num` modulo `range` in such a way so it lies within
// `range[0]` and `range[1]`. The returned value will be always smaller than
// `range[1]` unless `includeMax` is set to `true`.
function wrapNum(x, range, includeMax) {
    var max = range[1],
        min = range[0],
        d = max - min;
    return x === max && includeMax ? x : ((x - min) % d + d) % d + min;
}

// @function falseFn(): Function
// Returns a function which always returns `false`.
function falseFn() {
    return false;
}

// @function formatNum(num: Number, digits?: Number): Number
// Returns the number `num` rounded to `digits` decimals, or to 5 decimals by default.
function formatNum(num, digits) {
    var pow = Math.pow(10, digits || 5);
    return Math.round(num * pow) / pow;
}

// @function isNumeric(num: Number): Boolean
// Returns whether num is actually numeric
function isNumeric(num) {
    return !isNaN(parseFloat(num)) && isFinite(num);
}

// @function trim(str: String): String
// Compatibility polyfill for [String.prototype.trim](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/String/Trim)
function trim(str) {
    return str.trim ? str.trim() : str.replace(/^\s+|\s+$/g, '');
}

// @function splitWords(str: String): String[]
// Trims and splits the string on whitespace and returns the array of parts.
function splitWords(str) {
    return trim(str).split(/\s+/);
}

// @function setOptions(obj: Object, options: Object): Object
// Merges the given properties to the `options` of the `obj` object, returning the resulting options. See `Class options`. Has an `L.setOptions` shortcut.
function setOptions(obj, options) {
    if (!obj.hasOwnProperty('options')) {
        obj.options = obj.options ? create(obj.options) : {};
    }
    for (var i in options) {
        obj.options[i] = options[i];
    }
    return obj.options;
}

// @function getParamString(obj: Object, existingUrl?: String, uppercase?: Boolean): String
// Converts an object into a parameter URL string, e.g. `{a: "foo", b: "bar"}`
// translates to `'?a=foo&b=bar'`. If `existingUrl` is set, the parameters will
// be appended at the end. If `uppercase` is `true`, the parameter names will
// be uppercased (e.g. `'?A=foo&B=bar'`)
function getParamString(obj, existingUrl, uppercase) {
    var params = [];
    for (var i in obj) {
        params.push(encodeURIComponent(uppercase ? i.toUpperCase() : i) + '=' + encodeURIComponent(obj[i]));
    }
    return (!existingUrl || existingUrl.indexOf('?') === -1 ? '?' : '&') + params.join('&');
}

var templateRe = /\{ *([\w_\-]+) *\}/g;

// @function template(str: String, data: Object): String
// Simple templating facility, accepts a template string of the form `'Hello {a}, {b}'`
// and a data object like `{a: 'foo', b: 'bar'}`, returns evaluated string
// `('Hello foo, bar')`. You can also specify functions instead of strings for
// data values — they will be evaluated passing `data` as an argument.
function template(str, data) {
    return str.replace(templateRe, function (str, key) {
        var value = data[key];

        if (value === undefined) {
            throw new Error('No value provided for variable ' + str);
        } else if (typeof value === 'function') {
            value = value(data);
        }
        return value;
    });
}

// @function isArray(obj): Boolean
// Compatibility polyfill for [Array.isArray](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/isArray)
var isArray = Array.isArray || function (obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
};

// @function indexOf(array: Array, el: Object): Number
// Compatibility polyfill for [Array.prototype.indexOf](https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf)
function indexOf(array, el) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] === el) {
            return i;
        }
    }
    return -1;
}

// @property emptyImageUrl: String
// Data URI string containing a base64-encoded empty GIF image.
// Used as a hack to free memory from unused images on WebKit-powered
// mobile devices (by setting image `src` to this string).
var emptyImageUrl = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

// inspired by http://paulirish.com/2011/requestanimationframe-for-smart-animating/

function getPrefixed(name) {
    return window['webkit' + name] || window['moz' + name] || window['ms' + name];
}

var lastTime = 0;

// fallback for IE 7-8
function timeoutDefer(fn) {
    var time = +new Date(),
        timeToCall = Math.max(0, 16 - (time - lastTime));

    lastTime = time + timeToCall;
    return window.setTimeout(fn, timeToCall);
}

var requestFn = window.requestAnimationFrame || getPrefixed('RequestAnimationFrame') || timeoutDefer;
var cancelFn = window.cancelAnimationFrame || getPrefixed('CancelAnimationFrame') || getPrefixed('CancelRequestAnimationFrame') || function (id) {
    window.clearTimeout(id);
};

// @function requestAnimFrame(fn: Function, context?: Object, immediate?: Boolean): Number
// Schedules `fn` to be executed when the browser repaints. `fn` is bound to
// `context` if given. When `immediate` is set, `fn` is called immediately if
// the browser doesn't have native support for
// [`window.requestAnimationFrame`](https://developer.mozilla.org/docs/Web/API/window/requestAnimationFrame),
// otherwise it's delayed. Returns a request ID that can be used to cancel the request.
function requestAnimFrame(fn, context, immediate) {
    if (immediate && requestFn === timeoutDefer) {
        fn.call(context);
    } else {
        return requestFn.call(window, bind(fn, context));
    }
}

// @function cancelAnimFrame(id: Number): undefined
// Cancels a previous `requestAnimFrame`. See also [window.cancelAnimationFrame](https://developer.mozilla.org/docs/Web/API/window/cancelAnimationFrame).
function cancelAnimFrame(id) {
    if (id) {
        cancelFn.call(window, id);
    }
}

var loader = {
    js: function js(url) {
        var handler = { _resolved: false };
        handler.callbacks = [];
        handler.error = [];
        handler.then = function (cb) {
            handler.callbacks.push(cb);
            if (handler._resolved) {
                return handler.resolve();
            }
            return handler;
        };
        handler.catch = function (cb) {
            handler.error.push(cb);
            if (handler._resolved) {
                return handler.reject();
            }
            return handler;
        };
        handler.resolve = function (_argv) {
            // var _argv;
            handler._resolved = true;
            while (handler.callbacks.length) {
                var cb = handler.callbacks.shift();
                var retval;
                try {
                    _argv = cb(_argv);
                } catch (e) {
                    console.log(e);
                    handler.reject(e);
                    break;
                }
            }
            return handler;
        };

        handler.reject = function (e) {
            while (handler.error.length) {
                var cb = handler.error.shift();
                cb(e);
            }
            console.log(e);
            console.trace();
            return handler;
        };

        if (url == undefined) {
            handler._resolved = true;
            return handler;
        }

        var element = document.createElement('script');

        element.onload = function () {
            handler.resolve(url);
        };
        element.onerror = function () {
            handler.catch.apply(arguments);
        };

        element.async = true;
        var parent = 'body';
        var attr = 'src';
        element[attr] = url;
        document[parent].appendChild(element);

        console.log("AHOY APPENDED", url);

        return handler;
    }
};

var Util = (Object.freeze || Object)({
	extend: extend,
	create: create,
	bind: bind,
	lastId: lastId,
	stamp: stamp,
	throttle: throttle,
	wrapNum: wrapNum,
	falseFn: falseFn,
	formatNum: formatNum,
	isNumeric: isNumeric,
	trim: trim,
	splitWords: splitWords,
	setOptions: setOptions,
	getParamString: getParamString,
	template: template,
	isArray: isArray,
	indexOf: indexOf,
	emptyImageUrl: emptyImageUrl,
	requestFn: requestFn,
	cancelFn: cancelFn,
	requestAnimFrame: requestAnimFrame,
	cancelAnimFrame: cancelAnimFrame,
	loader: loader
});

// @class Class
// @aka L.Class

// @section
// @uninheritable

// Thanks to John Resig and Dean Edwards for inspiration!

function Class() {}

Class.extend = function (props) {

	// @function extend(props: Object): Function
	// [Extends the current class](#class-inheritance) given the properties to be included.
	// Returns a Javascript function that is a class constructor (to be called with `new`).
	var NewClass = function NewClass() {

		// call the constructor
		if (this.initialize) {
			this.initialize.apply(this, arguments);
		}

		// call all constructor hooks
		this.callInitHooks();
	};

	var parentProto = NewClass.__super__ = this.prototype;

	var proto = create(parentProto);
	proto.constructor = NewClass;

	NewClass.prototype = proto;

	// inherit parent's statics
	for (var i in this) {
		if (this.hasOwnProperty(i) && i !== 'prototype') {
			NewClass[i] = this[i];
		}
	}

	// mix static properties into the class
	if (props.statics) {
		extend(NewClass, props.statics);
		delete props.statics;
	}

	// mix includes into the prototype
	if (props.includes) {
		checkDeprecatedMixinEvents(props.includes);
		extend.apply(null, [proto].concat(props.includes));
		delete props.includes;
	}

	// merge options
	if (proto.options) {
		props.options = extend(create(proto.options), props.options);
	}

	// mix given properties into the prototype
	extend(proto, props);

	proto._initHooks = [];

	// add method for calling all hooks
	proto.callInitHooks = function () {

		if (this._initHooksCalled) {
			return;
		}

		if (parentProto.callInitHooks) {
			parentProto.callInitHooks.call(this);
		}

		this._initHooksCalled = true;

		for (var i = 0, len = proto._initHooks.length; i < len; i++) {
			proto._initHooks[i].call(this);
		}
	};

	return NewClass;
};

// @function include(properties: Object): this
// [Includes a mixin](#class-includes) into the current class.
Class.include = function (props) {
	extend(this.prototype, props);
	return this;
};

// @function mergeOptions(options: Object): this
// [Merges `options`](#class-options) into the defaults of the class.
Class.mergeOptions = function (options) {
	extend(this.prototype.options, options);
	return this;
};

// @function addInitHook(fn: Function): this
// Adds a [constructor hook](#class-constructor-hooks) to the class.
Class.addInitHook = function (fn) {
	// (Function) || (String, args...)
	var args = Array.prototype.slice.call(arguments, 1);

	var init = typeof fn === 'function' ? fn : function () {
		this[fn].apply(this, args);
	};

	this.prototype._initHooks = this.prototype._initHooks || [];
	this.prototype._initHooks.push(init);
	return this;
};

function checkDeprecatedMixinEvents(includes) {
	if (!cozy || !cozy.Mixin) {
		return;
	}

	includes = cozy.Util.isArray(includes) ? includes : [includes];

	// for (var i = 0; i < includes.length; i++) {
	// 	if (includes[i] === cozy.Mixin.Events) {
	// 		console.warn('Deprecated include of cozy.Mixin.Events: ' +
	// 			'this property will be removed in future releases, ' +
	// 			'please inherit from cozy.Evented instead.', new Error().stack);
	// 	}
	// }
}

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

/*
 * @class Evented
 * @aka L.Evented
 * @inherits Class
 *
 * A set of methods shared between event-powered classes (like `Map` and `Marker`). Generally, events allow you to execute some function when something happens with an object (e.g. the user clicks on the map, causing the map to fire `'click'` event).
 *
 * @example
 *
 * ```js
 * map.on('click', function(e) {
 * 	alert(e.latlng);
 * } );
 * ```
 *
 * Leaflet deals with event listeners by reference, so if you want to add a listener and then remove it, define it as a function:
 *
 * ```js
 * function onClick(e) { ... }
 *
 * map.on('click', onClick);
 * map.off('click', onClick);
 * ```
 */

var Evented = Class.extend({

	/* @method on(type: String, fn: Function, context?: Object): this
  * Adds a listener function (`fn`) to a particular event type of the object. You can optionally specify the context of the listener (object the this keyword will point to). You can also pass several space-separated types (e.g. `'click dblclick'`).
  *
  * @alternative
  * @method on(eventMap: Object): this
  * Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
  */
	on: function on(types, fn, context) {

		// types can be a map of types/handlers
		if ((typeof types === 'undefined' ? 'undefined' : _typeof(types)) === 'object') {
			for (var type in types) {
				// we don't process space-separated events here for performance;
				// it's a hot path since Layer uses the on(obj) syntax
				this._on(type, types[type], fn);
			}
		} else {
			// types can be a string of space-separated words
			types = splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				this._on(types[i], fn, context);
			}
		}

		return this;
	},

	/* @method off(type: String, fn?: Function, context?: Object): this
  * Removes a previously added listener function. If no function is specified, it will remove all the listeners of that particular event from the object. Note that if you passed a custom context to `on`, you must pass the same context to `off` in order to remove the listener.
  *
  * @alternative
  * @method off(eventMap: Object): this
  * Removes a set of type/listener pairs.
  *
  * @alternative
  * @method off: this
  * Removes all listeners to all events on the object.
  */
	off: function off(types, fn, context) {

		if (!types) {
			// clear all listeners if called without arguments
			delete this._events;
		} else if ((typeof types === 'undefined' ? 'undefined' : _typeof(types)) === 'object') {
			for (var type in types) {
				this._off(type, types[type], fn);
			}
		} else {
			types = splitWords(types);

			for (var i = 0, len = types.length; i < len; i++) {
				this._off(types[i], fn, context);
			}
		}

		return this;
	},

	// attach listener (without syntactic sugar now)
	_on: function _on(type, fn, context) {
		this._events = this._events || {};

		/* get/init listeners for type */
		var typeListeners = this._events[type];
		if (!typeListeners) {
			typeListeners = [];
			this._events[type] = typeListeners;
		}

		if (context === this) {
			// Less memory footprint.
			context = undefined;
		}
		var newListener = { fn: fn, ctx: context },
		    listeners = typeListeners;

		// check if fn already there
		for (var i = 0, len = listeners.length; i < len; i++) {
			if (listeners[i].fn === fn && listeners[i].ctx === context) {
				return;
			}
		}

		listeners.push(newListener);
	},

	_off: function _off(type, fn, context) {
		var listeners, i, len;

		if (!this._events) {
			return;
		}

		listeners = this._events[type];

		if (!listeners) {
			return;
		}

		if (!fn) {
			// Set all removed listeners to noop so they are not called if remove happens in fire
			for (i = 0, len = listeners.length; i < len; i++) {
				listeners[i].fn = falseFn;
			}
			// clear all listeners for a type if function isn't specified
			delete this._events[type];
			return;
		}

		if (context === this) {
			context = undefined;
		}

		if (listeners) {

			// find fn and remove it
			for (i = 0, len = listeners.length; i < len; i++) {
				var l = listeners[i];
				if (l.ctx !== context) {
					continue;
				}
				if (l.fn === fn) {

					// set the removed listener to noop so that's not called if remove happens in fire
					l.fn = falseFn;

					if (this._firingCount) {
						/* copy array in case events are being fired */
						this._events[type] = listeners = listeners.slice();
					}
					listeners.splice(i, 1);

					return;
				}
			}
		}
	},

	// @method fire(type: String, data?: Object, propagate?: Boolean): this
	// Fires an event of the specified type. You can optionally provide an data
	// object — the first argument of the listener function will contain its
	// properties. The event can optionally be propagated to event parents.
	fire: function fire(type, data, propagate) {
		if (!this.listens(type, propagate)) {
			return this;
		}

		var event = extend({}, data, { type: type, target: this });

		if (this._events) {
			var listeners = this._events[type];

			if (listeners) {
				this._firingCount = this._firingCount + 1 || 1;
				for (var i = 0, len = listeners.length; i < len; i++) {
					var l = listeners[i];
					l.fn.call(l.ctx || this, event);
				}

				this._firingCount--;
			}
		}

		if (propagate) {
			// propagate the event to parents (set with addEventParent)
			this._propagateEvent(event);
		}

		return this;
	},

	// @method listens(type: String): Boolean
	// Returns `true` if a particular event type has any listeners attached to it.
	listens: function listens(type, propagate) {
		var listeners = this._events && this._events[type];
		if (listeners && listeners.length) {
			return true;
		}

		if (propagate) {
			// also check parents for listeners if event propagates
			for (var id in this._eventParents) {
				if (this._eventParents[id].listens(type, propagate)) {
					return true;
				}
			}
		}
		return false;
	},

	// @method once(…): this
	// Behaves as [`on(…)`](#evented-on), except the listener will only get fired once and then removed.
	once: function once(types, fn, context) {

		if ((typeof types === 'undefined' ? 'undefined' : _typeof(types)) === 'object') {
			for (var type in types) {
				this.once(type, types[type], fn);
			}
			return this;
		}

		var handler = bind(function () {
			this.off(types, fn, context).off(types, handler, context);
		}, this);

		// add a listener that's executed once and removed after that
		return this.on(types, fn, context).on(types, handler, context);
	},

	// @method addEventParent(obj: Evented): this
	// Adds an event parent - an `Evented` that will receive propagated events
	addEventParent: function addEventParent(obj) {
		this._eventParents = this._eventParents || {};
		this._eventParents[stamp(obj)] = obj;
		return this;
	},

	// @method removeEventParent(obj: Evented): this
	// Removes an event parent, so it will stop receiving propagated events
	removeEventParent: function removeEventParent(obj) {
		if (this._eventParents) {
			delete this._eventParents[stamp(obj)];
		}
		return this;
	},

	_propagateEvent: function _propagateEvent(e) {
		for (var id in this._eventParents) {
			this._eventParents[id].fire(e.type, extend({ layer: e.target }, e), true);
		}
	}
});

var proto = Evented.prototype;

// aliases; we should ditch those eventually

// @method addEventListener(…): this
// Alias to [`on(…)`](#evented-on)
proto.addEventListener = proto.on;

// @method removeEventListener(…): this
// Alias to [`off(…)`](#evented-off)

// @method clearAllEventListeners(…): this
// Alias to [`off()`](#evented-off)
proto.removeEventListener = proto.clearAllEventListeners = proto.off;

// @method addOneTimeEventListener(…): this
// Alias to [`once(…)`](#evented-once)
proto.addOneTimeEventListener = proto.once;

// @method fireEvent(…): this
// Alias to [`fire(…)`](#evented-fire)
proto.fireEvent = proto.fire;

// @method hasEventListeners(…): Boolean
// Alias to [`listens(…)`](#evented-listens)
proto.hasEventListeners = proto.listens;

/*
 * @namespace Browser
 * @aka L.Browser
 *
 * A namespace with static properties for browser/feature detection used by Leaflet internally.
 *
 * @example
 *
 * ```js
 * if (L.Browser.ielt9) {
 *   alert('Upgrade your browser, dude!');
 * }
 * ```
 */

var style$1 = document.documentElement.style;

// @property ie: Boolean; `true` for all Internet Explorer versions (not Edge).
var ie = 'ActiveXObject' in window;

// @property ielt9: Boolean; `true` for Internet Explorer versions less than 9.
var ielt9 = ie && !document.addEventListener;

// @property edge: Boolean; `true` for the Edge web browser.
var edge = 'msLaunchUri' in navigator && !('documentMode' in document);

// @property webkit: Boolean;
// `true` for webkit-based browsers like Chrome and Safari (including mobile versions).
var webkit = userAgentContains('webkit');

// @property android: Boolean
// `true` for any browser running on an Android platform.
var android = userAgentContains('android');

// @property android23: Boolean; `true` for browsers running on Android 2 or Android 3.
var android23 = userAgentContains('android 2') || userAgentContains('android 3');

// @property opera: Boolean; `true` for the Opera browser
var opera = !!window.opera;

// @property chrome: Boolean; `true` for the Chrome browser.
var chrome = userAgentContains('chrome');

// @property gecko: Boolean; `true` for gecko-based browsers like Firefox.
var gecko = userAgentContains('gecko') && !webkit && !opera && !ie;

// @property safari: Boolean; `true` for the Safari browser.
var safari = !chrome && userAgentContains('safari');

var phantom = userAgentContains('phantom');

// @property opera12: Boolean
// `true` for the Opera browser supporting CSS transforms (version 12 or later).
var opera12 = 'OTransition' in style$1;

// @property win: Boolean; `true` when the browser is running in a Windows platform
var win = navigator.platform.indexOf('Win') === 0;

// @property ie3d: Boolean; `true` for all Internet Explorer versions supporting CSS transforms.
var ie3d = ie && 'transition' in style$1;

// @property webkit3d: Boolean; `true` for webkit-based browsers supporting CSS transforms.
var webkit3d = 'WebKitCSSMatrix' in window && 'm11' in new window.WebKitCSSMatrix() && !android23;

// @property gecko3d: Boolean; `true` for gecko-based browsers supporting CSS transforms.
var gecko3d = 'MozPerspective' in style$1;

// @property any3d: Boolean
// `true` for all browsers supporting CSS transforms.
var any3d = !window.L_DISABLE_3D && (ie3d || webkit3d || gecko3d) && !opera12 && !phantom;

// @property mobile: Boolean; `true` for all browsers running in a mobile device.
var mobile = typeof orientation !== 'undefined' || userAgentContains('mobile');

// @property mobileWebkit: Boolean; `true` for all webkit-based browsers in a mobile device.
var mobileWebkit = mobile && webkit;

// @property mobileWebkit3d: Boolean
// `true` for all webkit-based browsers in a mobile device supporting CSS transforms.
var mobileWebkit3d = mobile && webkit3d;

// @property msPointer: Boolean
// `true` for browsers implementing the Microsoft touch events model (notably IE10).
var msPointer = !window.PointerEvent && window.MSPointerEvent;

// @property pointer: Boolean
// `true` for all browsers supporting [pointer events](https://msdn.microsoft.com/en-us/library/dn433244%28v=vs.85%29.aspx).
var pointer = !!(window.PointerEvent || msPointer);

// @property touch: Boolean
// `true` for all browsers supporting [touch events](https://developer.mozilla.org/docs/Web/API/Touch_events).
// This does not necessarily mean that the browser is running in a computer with
// a touchscreen, it only means that the browser is capable of understanding
// touch events.
var touch = !window.L_NO_TOUCH && (pointer || 'ontouchstart' in window || window.DocumentTouch && document instanceof window.DocumentTouch);

// @property mobileOpera: Boolean; `true` for the Opera browser in a mobile device.
var mobileOpera = mobile && opera;

// @property mobileGecko: Boolean
// `true` for gecko-based browsers running in a mobile device.
var mobileGecko = mobile && gecko;

// @property retina: Boolean
// `true` for browsers on a high-resolution "retina" screen.
var retina = (window.devicePixelRatio || window.screen.deviceXDPI / window.screen.logicalXDPI) > 1;

// @property canvas: Boolean
// `true` when the browser supports [`<canvas>`](https://developer.mozilla.org/docs/Web/API/Canvas_API).
var canvas = function () {
    return !!document.createElement('canvas').getContext;
}();

// @property svg: Boolean
// `true` when the browser supports [SVG](https://developer.mozilla.org/docs/Web/SVG).
// export var svg = !!(document.createElementNS && svgCreate('svg').createSVGRect);
var svg = true;

// @property vml: Boolean
// `true` if the browser supports [VML](https://en.wikipedia.org/wiki/Vector_Markup_Language).
var vml = !svg && function () {
    try {
        var div = document.createElement('div');
        div.innerHTML = '<v:shape adj="1"/>';

        var shape = div.firstChild;
        shape.style.behavior = 'url(#default#VML)';

        return shape && _typeof(shape.adj) === 'object';
    } catch (e) {
        return false;
    }
}();

var columnCount = 'columnCount' in style$1;
var classList = document.documentElement.classList !== undefined;

function userAgentContains(str) {
    return navigator.userAgent.toLowerCase().indexOf(str) >= 0;
}



var Browser = (Object.freeze || Object)({
	ie: ie,
	ielt9: ielt9,
	edge: edge,
	webkit: webkit,
	android: android,
	android23: android23,
	opera: opera,
	chrome: chrome,
	gecko: gecko,
	safari: safari,
	phantom: phantom,
	opera12: opera12,
	win: win,
	ie3d: ie3d,
	webkit3d: webkit3d,
	gecko3d: gecko3d,
	any3d: any3d,
	mobile: mobile,
	mobileWebkit: mobileWebkit,
	mobileWebkit3d: mobileWebkit3d,
	msPointer: msPointer,
	pointer: pointer,
	touch: touch,
	mobileOpera: mobileOpera,
	mobileGecko: mobileGecko,
	retina: retina,
	canvas: canvas,
	svg: svg,
	vml: vml,
	columnCount: columnCount,
	classList: classList
});

/*
 * @class Point
 * @aka L.Point
 *
 * Represents a point with `x` and `y` coordinates in pixels.
 *
 * @example
 *
 * ```js
 * var point = L.point(200, 300);
 * ```
 *
 * All Leaflet methods and options that accept `Point` objects also accept them in a simple Array form (unless noted otherwise), so these lines are equivalent:
 *
 * ```js
 * map.panBy([200, 300]);
 * map.panBy(L.point(200, 300));
 * ```
 */

function Point(x, y, round) {
	// @property x: Number; The `x` coordinate of the point
	this.x = round ? Math.round(x) : x;
	// @property y: Number; The `y` coordinate of the point
	this.y = round ? Math.round(y) : y;
}

Point.prototype = {

	// @method clone(): Point
	// Returns a copy of the current point.
	clone: function clone() {
		return new Point(this.x, this.y);
	},

	// @method add(otherPoint: Point): Point
	// Returns the result of addition of the current and the given points.
	add: function add(point) {
		// non-destructive, returns a new point
		return this.clone()._add(toPoint(point));
	},

	_add: function _add(point) {
		// destructive, used directly for performance in situations where it's safe to modify existing point
		this.x += point.x;
		this.y += point.y;
		return this;
	},

	// @method subtract(otherPoint: Point): Point
	// Returns the result of subtraction of the given point from the current.
	subtract: function subtract(point) {
		return this.clone()._subtract(toPoint(point));
	},

	_subtract: function _subtract(point) {
		this.x -= point.x;
		this.y -= point.y;
		return this;
	},

	// @method divideBy(num: Number): Point
	// Returns the result of division of the current point by the given number.
	divideBy: function divideBy(num) {
		return this.clone()._divideBy(num);
	},

	_divideBy: function _divideBy(num) {
		this.x /= num;
		this.y /= num;
		return this;
	},

	// @method multiplyBy(num: Number): Point
	// Returns the result of multiplication of the current point by the given number.
	multiplyBy: function multiplyBy(num) {
		return this.clone()._multiplyBy(num);
	},

	_multiplyBy: function _multiplyBy(num) {
		this.x *= num;
		this.y *= num;
		return this;
	},

	// @method scaleBy(scale: Point): Point
	// Multiply each coordinate of the current point by each coordinate of
	// `scale`. In linear algebra terms, multiply the point by the
	// [scaling matrix](https://en.wikipedia.org/wiki/Scaling_%28geometry%29#Matrix_representation)
	// defined by `scale`.
	scaleBy: function scaleBy(point) {
		return new Point(this.x * point.x, this.y * point.y);
	},

	// @method unscaleBy(scale: Point): Point
	// Inverse of `scaleBy`. Divide each coordinate of the current point by
	// each coordinate of `scale`.
	unscaleBy: function unscaleBy(point) {
		return new Point(this.x / point.x, this.y / point.y);
	},

	// @method round(): Point
	// Returns a copy of the current point with rounded coordinates.
	round: function round() {
		return this.clone()._round();
	},

	_round: function _round() {
		this.x = Math.round(this.x);
		this.y = Math.round(this.y);
		return this;
	},

	// @method floor(): Point
	// Returns a copy of the current point with floored coordinates (rounded down).
	floor: function floor() {
		return this.clone()._floor();
	},

	_floor: function _floor() {
		this.x = Math.floor(this.x);
		this.y = Math.floor(this.y);
		return this;
	},

	// @method ceil(): Point
	// Returns a copy of the current point with ceiled coordinates (rounded up).
	ceil: function ceil() {
		return this.clone()._ceil();
	},

	_ceil: function _ceil() {
		this.x = Math.ceil(this.x);
		this.y = Math.ceil(this.y);
		return this;
	},

	// @method distanceTo(otherPoint: Point): Number
	// Returns the cartesian distance between the current and the given points.
	distanceTo: function distanceTo(point) {
		point = toPoint(point);

		var x = point.x - this.x,
		    y = point.y - this.y;

		return Math.sqrt(x * x + y * y);
	},

	// @method equals(otherPoint: Point): Boolean
	// Returns `true` if the given point has the same coordinates.
	equals: function equals(point) {
		point = toPoint(point);

		return point.x === this.x && point.y === this.y;
	},

	// @method contains(otherPoint: Point): Boolean
	// Returns `true` if both coordinates of the given point are less than the corresponding current point coordinates (in absolute values).
	contains: function contains(point) {
		point = toPoint(point);

		return Math.abs(point.x) <= Math.abs(this.x) && Math.abs(point.y) <= Math.abs(this.y);
	},

	// @method toString(): String
	// Returns a string representation of the point for debugging purposes.
	toString: function toString() {
		return 'Point(' + formatNum(this.x) + ', ' + formatNum(this.y) + ')';
	}
};

// @factory L.point(x: Number, y: Number, round?: Boolean)
// Creates a Point object with the given `x` and `y` coordinates. If optional `round` is set to true, rounds the `x` and `y` values.

// @alternative
// @factory L.point(coords: Number[])
// Expects an array of the form `[x, y]` instead.

// @alternative
// @factory L.point(coords: Object)
// Expects a plain object of the form `{x: Number, y: Number}` instead.
function toPoint(x, y, round) {
	if (x instanceof Point) {
		return x;
	}
	if (isArray(x)) {
		return new Point(x[0], x[1]);
	}
	if (x === undefined || x === null) {
		return x;
	}
	if ((typeof x === 'undefined' ? 'undefined' : _typeof(x)) === 'object' && 'x' in x && 'y' in x) {
		return new Point(x.x, x.y);
	}
	return new Point(x, y, round);
}

/*
 * Extends L.DomEvent to provide touch support for Internet Explorer and Windows-based devices.
 */

var POINTER_DOWN = msPointer ? 'MSPointerDown' : 'pointerdown';
var POINTER_MOVE = msPointer ? 'MSPointerMove' : 'pointermove';
var POINTER_UP = msPointer ? 'MSPointerUp' : 'pointerup';
var POINTER_CANCEL = msPointer ? 'MSPointerCancel' : 'pointercancel';
var TAG_WHITE_LIST = ['INPUT', 'SELECT', 'OPTION'];
var _pointers = {};
var _pointerDocListener = false;

// DomEvent.DoubleTap needs to know about this
var _pointersCount = 0;

// Provides a touch events wrapper for (ms)pointer events.
// ref http://www.w3.org/TR/pointerevents/ https://www.w3.org/Bugs/Public/show_bug.cgi?id=22890

function addPointerListener(obj, type, handler, id) {
	if (type === 'touchstart') {
		_addPointerStart(obj, handler, id);
	} else if (type === 'touchmove') {
		_addPointerMove(obj, handler, id);
	} else if (type === 'touchend') {
		_addPointerEnd(obj, handler, id);
	}

	return this;
}

function removePointerListener(obj, type, id) {
	var handler = obj['_leaflet_' + type + id];

	if (type === 'touchstart') {
		obj.removeEventListener(POINTER_DOWN, handler, false);
	} else if (type === 'touchmove') {
		obj.removeEventListener(POINTER_MOVE, handler, false);
	} else if (type === 'touchend') {
		obj.removeEventListener(POINTER_UP, handler, false);
		obj.removeEventListener(POINTER_CANCEL, handler, false);
	}

	return this;
}

function _addPointerStart(obj, handler, id) {
	var onDown = bind(function (e) {
		if (e.pointerType !== 'mouse' && e.pointerType !== e.MSPOINTER_TYPE_MOUSE && e.pointerType !== e.MSPOINTER_TYPE_MOUSE) {
			// In IE11, some touch events needs to fire for form controls, or
			// the controls will stop working. We keep a whitelist of tag names that
			// need these events. For other target tags, we prevent default on the event.
			if (TAG_WHITE_LIST.indexOf(e.target.tagName) < 0) {
				preventDefault(e);
			} else {
				return;
			}
		}

		_handlePointer(e, handler);
	});

	obj['_leaflet_touchstart' + id] = onDown;
	obj.addEventListener(POINTER_DOWN, onDown, false);

	// need to keep track of what pointers and how many are active to provide e.touches emulation
	if (!_pointerDocListener) {
		// we listen documentElement as any drags that end by moving the touch off the screen get fired there
		document.documentElement.addEventListener(POINTER_DOWN, _globalPointerDown, true);
		document.documentElement.addEventListener(POINTER_MOVE, _globalPointerMove, true);
		document.documentElement.addEventListener(POINTER_UP, _globalPointerUp, true);
		document.documentElement.addEventListener(POINTER_CANCEL, _globalPointerUp, true);

		_pointerDocListener = true;
	}
}

function _globalPointerDown(e) {
	_pointers[e.pointerId] = e;
	_pointersCount++;
}

function _globalPointerMove(e) {
	if (_pointers[e.pointerId]) {
		_pointers[e.pointerId] = e;
	}
}

function _globalPointerUp(e) {
	delete _pointers[e.pointerId];
	_pointersCount--;
}

function _handlePointer(e, handler) {
	e.touches = [];
	for (var i in _pointers) {
		e.touches.push(_pointers[i]);
	}
	e.changedTouches = [e];

	handler(e);
}

function _addPointerMove(obj, handler, id) {
	var onMove = function onMove(e) {
		// don't fire touch moves when mouse isn't down
		if ((e.pointerType === e.MSPOINTER_TYPE_MOUSE || e.pointerType === 'mouse') && e.buttons === 0) {
			return;
		}

		_handlePointer(e, handler);
	};

	obj['_leaflet_touchmove' + id] = onMove;
	obj.addEventListener(POINTER_MOVE, onMove, false);
}

function _addPointerEnd(obj, handler, id) {
	var onUp = function onUp(e) {
		_handlePointer(e, handler);
	};

	obj['_leaflet_touchend' + id] = onUp;
	obj.addEventListener(POINTER_UP, onUp, false);
	obj.addEventListener(POINTER_CANCEL, onUp, false);
}

/*
 * Extends the event handling code with double tap support for mobile browsers.
 */

var _touchstart = msPointer ? 'MSPointerDown' : pointer ? 'pointerdown' : 'touchstart';
var _touchend = msPointer ? 'MSPointerUp' : pointer ? 'pointerup' : 'touchend';
var _pre = '_leaflet_';

// inspired by Zepto touch code by Thomas Fuchs
function addDoubleTapListener(obj, handler, id) {
	var last,
	    touch$$1,
	    doubleTap = false,
	    delay = 250;

	function onTouchStart(e) {
		var count;

		if (pointer) {
			if (!edge || e.pointerType === 'mouse') {
				return;
			}
			count = _pointersCount;
		} else {
			count = e.touches.length;
		}

		if (count > 1) {
			return;
		}

		var now = Date.now(),
		    delta = now - (last || now);

		touch$$1 = e.touches ? e.touches[0] : e;
		doubleTap = delta > 0 && delta <= delay;
		last = now;
	}

	function onTouchEnd(e) {
		if (doubleTap && !touch$$1.cancelBubble) {
			if (pointer) {
				if (!edge || e.pointerType === 'mouse') {
					return;
				}
				// work around .type being readonly with MSPointer* events
				var newTouch = {},
				    prop,
				    i;

				for (i in touch$$1) {
					prop = touch$$1[i];
					newTouch[i] = prop && prop.bind ? prop.bind(touch$$1) : prop;
				}
				touch$$1 = newTouch;
			}
			touch$$1.type = 'dblclick';
			handler(touch$$1);
			last = null;
		}
	}

	obj[_pre + _touchstart + id] = onTouchStart;
	obj[_pre + _touchend + id] = onTouchEnd;
	obj[_pre + 'dblclick' + id] = handler;

	obj.addEventListener(_touchstart, onTouchStart, false);
	obj.addEventListener(_touchend, onTouchEnd, false);

	// On some platforms (notably, chrome<55 on win10 + touchscreen + mouse),
	// the browser doesn't fire touchend/pointerup events but does fire
	// native dblclicks. See #4127.
	// Edge 14 also fires native dblclicks, but only for pointerType mouse, see #5180.
	obj.addEventListener('dblclick', handler, false);

	return this;
}

function removeDoubleTapListener(obj, id) {
	var touchstart = obj[_pre + _touchstart + id],
	    touchend = obj[_pre + _touchend + id],
	    dblclick = obj[_pre + 'dblclick' + id];

	obj.removeEventListener(_touchstart, touchstart, false);
	obj.removeEventListener(_touchend, touchend, false);
	if (!edge) {
		obj.removeEventListener('dblclick', dblclick, false);
	}

	return this;
}

/*
 * @namespace DomEvent
 * Utility functions to work with the [DOM events](https://developer.mozilla.org/docs/Web/API/Event), used by Leaflet internally.
 */

// Inspired by John Resig, Dean Edwards and YUI addEvent implementations.

// @function on(el: HTMLElement, types: String, fn: Function, context?: Object): this
// Adds a listener function (`fn`) to a particular DOM event type of the
// element `el`. You can optionally specify the context of the listener
// (object the `this` keyword will point to). You can also pass several
// space-separated types (e.g. `'click dblclick'`).

// @alternative
// @function on(el: HTMLElement, eventMap: Object, context?: Object): this
// Adds a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`
function on(obj, types, fn, context) {

	if ((typeof types === 'undefined' ? 'undefined' : _typeof(types)) === 'object') {
		for (var type in types) {
			addOne(obj, type, types[type], fn);
		}
	} else {
		types = splitWords(types);

		for (var i = 0, len = types.length; i < len; i++) {
			addOne(obj, types[i], fn, context);
		}
	}

	return this;
}

var eventsKey = '_leaflet_events';

// @function off(el: HTMLElement, types: String, fn: Function, context?: Object): this
// Removes a previously added listener function. If no function is specified,
// it will remove all the listeners of that particular DOM event from the element.
// Note that if you passed a custom context to on, you must pass the same
// context to `off` in order to remove the listener.

// @alternative
// @function off(el: HTMLElement, eventMap: Object, context?: Object): this
// Removes a set of type/listener pairs, e.g. `{click: onClick, mousemove: onMouseMove}`

// @alternative
// @function off(el: HTMLElement): this
// Removes all known event listeners
function off(obj, types, fn, context) {

	if ((typeof types === 'undefined' ? 'undefined' : _typeof(types)) === 'object') {
		for (var type in types) {
			removeOne(obj, type, types[type], fn);
		}
	} else if (types) {
		types = splitWords(types);

		for (var i = 0, len = types.length; i < len; i++) {
			removeOne(obj, types[i], fn, context);
		}
	} else {
		for (var j in obj[eventsKey]) {
			removeOne(obj, j, obj[eventsKey][j]);
		}
		delete obj[eventsKey];
	}
}

function addOne(obj, type, fn, context) {
	var id = type + stamp(fn) + (context ? '_' + stamp(context) : '');

	if (obj[eventsKey] && obj[eventsKey][id]) {
		return this;
	}

	var handler = function handler(e) {
		return fn.call(context || obj, e || window.event);
	};

	var originalHandler = handler;

	if (pointer && type.indexOf('touch') === 0) {
		// Needs DomEvent.Pointer.js
		addPointerListener(obj, type, handler, id);
	} else if (touch && type === 'dblclick' && addDoubleTapListener && !(pointer && chrome)) {
		// Chrome >55 does not need the synthetic dblclicks from addDoubleTapListener
		// See #5180
		addDoubleTapListener(obj, handler, id);
	} else if ('addEventListener' in obj) {

		if (type === 'mousewheel') {
			obj.addEventListener('onwheel' in obj ? 'wheel' : 'mousewheel', handler, false);
		} else if (type === 'mouseenter' || type === 'mouseleave') {
			handler = function handler(e) {
				e = e || window.event;
				if (isExternalTarget(obj, e)) {
					originalHandler(e);
				}
			};
			obj.addEventListener(type === 'mouseenter' ? 'mouseover' : 'mouseout', handler, false);
		} else {
			if (type === 'click' && android) {
				handler = function handler(e) {
					filterClick(e, originalHandler);
				};
			}
			obj.addEventListener(type, handler, false);
		}
	} else if ('attachEvent' in obj) {
		obj.attachEvent('on' + type, handler);
	}

	obj[eventsKey] = obj[eventsKey] || {};
	obj[eventsKey][id] = handler;
}

function removeOne(obj, type, fn, context) {

	var id = type + stamp(fn) + (context ? '_' + stamp(context) : ''),
	    handler = obj[eventsKey] && obj[eventsKey][id];

	if (!handler) {
		return this;
	}

	if (pointer && type.indexOf('touch') === 0) {
		removePointerListener(obj, type, id);
	} else if (touch && type === 'dblclick' && removeDoubleTapListener) {
		removeDoubleTapListener(obj, id);
	} else if ('removeEventListener' in obj) {

		if (type === 'mousewheel') {
			obj.removeEventListener('onwheel' in obj ? 'wheel' : 'mousewheel', handler, false);
		} else {
			obj.removeEventListener(type === 'mouseenter' ? 'mouseover' : type === 'mouseleave' ? 'mouseout' : type, handler, false);
		}
	} else if ('detachEvent' in obj) {
		obj.detachEvent('on' + type, handler);
	}

	obj[eventsKey][id] = null;
}

// @function stopPropagation(ev: DOMEvent): this
// Stop the given event from propagation to parent elements. Used inside the listener functions:
// ```js
// L.DomEvent.on(div, 'click', function (ev) {
// 	L.DomEvent.stopPropagation(ev);
// });
// ```
function stopPropagation(e) {

	if (e.stopPropagation) {
		e.stopPropagation();
	} else if (e.originalEvent) {
		// In case of Leaflet event.
		e.originalEvent._stopped = true;
	} else {
		e.cancelBubble = true;
	}
	skipped(e);

	return this;
}

// @function disableScrollPropagation(el: HTMLElement): this
// Adds `stopPropagation` to the element's `'mousewheel'` events (plus browser variants).
function disableScrollPropagation(el) {
	return addOne(el, 'mousewheel', stopPropagation);
}

// @function disableClickPropagation(el: HTMLElement): this
// Adds `stopPropagation` to the element's `'click'`, `'doubleclick'`,
// `'mousedown'` and `'touchstart'` events (plus browser variants).
function disableClickPropagation(el) {
	on(el, 'mousedown touchstart dblclick', stopPropagation);
	addOne(el, 'click', fakeStop);
	return this;
}

// @function preventDefault(ev: DOMEvent): this
// Prevents the default action of the DOM Event `ev` from happening (such as
// following a link in the href of the a element, or doing a POST request
// with page reload when a `<form>` is submitted).
// Use it inside listener functions.
function preventDefault(e) {
	if (e.preventDefault) {
		e.preventDefault();
	} else {
		e.returnValue = false;
	}
	return this;
}

// @function stop(ev): this
// Does `stopPropagation` and `preventDefault` at the same time.
function stop(e) {
	preventDefault(e);
	stopPropagation(e);
	return this;
}

// @function getMousePosition(ev: DOMEvent, container?: HTMLElement): Point
// Gets normalized mouse position from a DOM event relative to the
// `container` or to the whole page if not specified.
function getMousePosition(e, container) {
	if (!container) {
		return new Point(e.clientX, e.clientY);
	}

	var rect = container.getBoundingClientRect();

	return new Point(e.clientX - rect.left - container.clientLeft, e.clientY - rect.top - container.clientTop);
}

// Chrome on Win scrolls double the pixels as in other platforms (see #4538),
// and Firefox scrolls device pixels, not CSS pixels
var wheelPxFactor = win && chrome ? 2 : gecko ? window.devicePixelRatio : 1;

// @function getWheelDelta(ev: DOMEvent): Number
// Gets normalized wheel delta from a mousewheel DOM event, in vertical
// pixels scrolled (negative if scrolling down).
// Events from pointing devices without precise scrolling are mapped to
// a best guess of 60 pixels.
function getWheelDelta(e) {
	return edge ? e.wheelDeltaY / 2 : // Don't trust window-geometry-based delta
	e.deltaY && e.deltaMode === 0 ? -e.deltaY / wheelPxFactor : // Pixels
	e.deltaY && e.deltaMode === 1 ? -e.deltaY * 20 : // Lines
	e.deltaY && e.deltaMode === 2 ? -e.deltaY * 60 : // Pages
	e.deltaX || e.deltaZ ? 0 : // Skip horizontal/depth wheel events
	e.wheelDelta ? (e.wheelDeltaY || e.wheelDelta) / 2 : // Legacy IE pixels
	e.detail && Math.abs(e.detail) < 32765 ? -e.detail * 20 : // Legacy Moz lines
	e.detail ? e.detail / -32765 * 60 : // Legacy Moz pages
	0;
}

var skipEvents = {};

function fakeStop(e) {
	// fakes stopPropagation by setting a special event flag, checked/reset with skipped(e)
	skipEvents[e.type] = true;
}

function skipped(e) {
	var events = skipEvents[e.type];
	// reset when checking, as it's only used in map container and propagates outside of the map
	skipEvents[e.type] = false;
	return events;
}

// check if element really left/entered the event target (for mouseenter/mouseleave)
function isExternalTarget(el, e) {

	var related = e.relatedTarget;

	if (!related) {
		return true;
	}

	try {
		while (related && related !== el) {
			related = related.parentNode;
		}
	} catch (err) {
		return false;
	}
	return related !== el;
}

var lastClick;

// this is a horrible workaround for a bug in Android where a single touch triggers two click events
function filterClick(e, handler) {
	var timeStamp = e.timeStamp || e.originalEvent && e.originalEvent.timeStamp,
	    elapsed = lastClick && timeStamp - lastClick;

	// are they closer together than 500ms yet more than 100ms?
	// Android typically triggers them ~300ms apart while multiple listeners
	// on the same event should be triggered far faster;
	// or check if click is simulated on the element, and if it is, reject any non-simulated events

	if (elapsed && elapsed > 100 && elapsed < 500 || e.target._simulatedClick && !e._simulated) {
		stop(e);
		return;
	}
	lastClick = timeStamp;

	handler(e);
}



var DomEvent = (Object.freeze || Object)({
	on: on,
	off: off,
	stopPropagation: stopPropagation,
	disableScrollPropagation: disableScrollPropagation,
	disableClickPropagation: disableClickPropagation,
	preventDefault: preventDefault,
	stop: stop,
	getMousePosition: getMousePosition,
	getWheelDelta: getWheelDelta,
	fakeStop: fakeStop,
	skipped: skipped,
	isExternalTarget: isExternalTarget,
	addListener: on,
	removeListener: off
});

/*
 * @namespace DomUtil
 *
 * Utility functions to work with the [DOM](https://developer.mozilla.org/docs/Web/API/Document_Object_Model)
 * tree, used by Leaflet internally.
 *
 * Most functions expecting or returning a `HTMLElement` also work for
 * SVG elements. The only difference is that classes refer to CSS classes
 * in HTML and SVG classes in SVG.
 */

if (!Element.prototype.matches) {
    var ep = Element.prototype;

    if (ep.webkitMatchesSelector) // Chrome <34, SF<7.1, iOS<8
        ep.matches = ep.webkitMatchesSelector;

    if (ep.msMatchesSelector) // IE9/10/11 & Edge
        ep.matches = ep.msMatchesSelector;

    if (ep.mozMatchesSelector) // FF<34
        ep.matches = ep.mozMatchesSelector;
}

// @property TRANSFORM: String
// Vendor-prefixed fransform style name (e.g. `'webkitTransform'` for WebKit).
var TRANSFORM = testProp(['transform', 'WebkitTransform', 'OTransform', 'MozTransform', 'msTransform']);

// webkitTransition comes first because some browser versions that drop vendor prefix don't do
// the same for the transitionend event, in particular the Android 4.1 stock browser

// @property TRANSITION: String
// Vendor-prefixed transform style name.
var TRANSITION = testProp(['webkitTransition', 'transition', 'OTransition', 'MozTransition', 'msTransition']);

var TRANSITION_END = TRANSITION === 'webkitTransition' || TRANSITION === 'OTransition' ? TRANSITION + 'End' : 'transitionend';

// @function get(id: String|HTMLElement): HTMLElement
// Returns an element given its DOM id, or returns the element itself
// if it was passed directly.
function get$1(id) {
    return typeof id === 'string' ? document.getElementById(id) : id;
}

// @function getStyle(el: HTMLElement, styleAttrib: String): String
// Returns the value for a certain style attribute on an element,
// including computed values or values set through CSS.
function getStyle(el, style) {
    var value = el.style[style] || el.currentStyle && el.currentStyle[style];

    if ((!value || value === 'auto') && document.defaultView) {
        var css = document.defaultView.getComputedStyle(el, null);
        value = css ? css[style] : null;
    }
    return value === 'auto' ? null : value;
}

// @function create(tagName: String, className?: String, container?: HTMLElement): HTMLElement
// Creates an HTML element with `tagName`, sets its class to `className`, and optionally appends it to `container` element.
function create$1(tagName, className, container) {
    var el = document.createElement(tagName);
    el.className = className || '';

    if (container) {
        container.appendChild(el);
    }
    return el;
}

// @function remove(el: HTMLElement)
// Removes `el` from its parent element
function remove(el) {
    var parent = el.parentNode;
    if (parent) {
        parent.removeChild(el);
    }
}

// @function empty(el: HTMLElement)
// Removes all of `el`'s children elements from `el`
function empty(el) {
    while (el.firstChild) {
        el.removeChild(el.firstChild);
    }
}

// @function toFront(el: HTMLElement)
// Makes `el` the last child of its parent, so it renders in front of the other children.
function toFront(el) {
    el.parentNode.appendChild(el);
}

// @function toBack(el: HTMLElement)
// Makes `el` the first child of its parent, so it renders behind the other children.
function toBack(el) {
    var parent = el.parentNode;
    parent.insertBefore(el, parent.firstChild);
}

// @function hasClass(el: HTMLElement, name: String): Boolean
// Returns `true` if the element's class attribute contains `name`.
function hasClass(el, name) {
    if (el.classList !== undefined) {
        return el.classList.contains(name);
    }
    var className = getClass(el);
    return className.length > 0 && new RegExp('(^|\\s)' + name + '(\\s|$)').test(className);
}

// @function addClass(el: HTMLElement, name: String)
// Adds `name` to the element's class attribute.
function addClass(el, name) {
    if (el.classList !== undefined) {
        var classes = splitWords(name);
        for (var i = 0, len = classes.length; i < len; i++) {
            el.classList.add(classes[i]);
        }
    } else if (!hasClass(el, name)) {
        var className = getClass(el);
        setClass(el, (className ? className + ' ' : '') + name);
    }
}

// @function removeClass(el: HTMLElement, name: String)
// Removes `name` from the element's class attribute.
function removeClass(el, name) {
    if (el.classList !== undefined) {
        el.classList.remove(name);
    } else {
        setClass(el, trim((' ' + getClass(el) + ' ').replace(' ' + name + ' ', ' ')));
    }
}

// @function setClass(el: HTMLElement, name: String)
// Sets the element's class.
function setClass(el, name) {
    if (el.className.baseVal === undefined) {
        el.className = name;
    } else {
        // in case of SVG element
        el.className.baseVal = name;
    }
}

// @function getClass(el: HTMLElement): String
// Returns the element's class.
function getClass(el) {
    return el.className.baseVal === undefined ? el.className : el.className.baseVal;
}

// @function setOpacity(el: HTMLElement, opacity: Number)
// Set the opacity of an element (including old IE support).
// `opacity` must be a number from `0` to `1`.
function setOpacity(el, value) {
    if ('opacity' in el.style) {
        el.style.opacity = value;
    } else if ('filter' in el.style) {
        _setOpacityIE(el, value);
    }
}

function _setOpacityIE(el, value) {
    var filter = false,
        filterName = 'DXImageTransform.Microsoft.Alpha';

    // filters collection throws an error if we try to retrieve a filter that doesn't exist
    try {
        filter = el.filters.item(filterName);
    } catch (e) {
        // don't set opacity to 1 if we haven't already set an opacity,
        // it isn't needed and breaks transparent pngs.
        if (value === 1) {
            return;
        }
    }

    value = Math.round(value * 100);

    if (filter) {
        filter.Enabled = value !== 100;
        filter.Opacity = value;
    } else {
        el.style.filter += ' progid:' + filterName + '(opacity=' + value + ')';
    }
}

// @function testProp(props: String[]): String|false
// Goes through the array of style names and returns the first name
// that is a valid style name for an element. If no such name is found,
// it returns false. Useful for vendor-prefixed styles like `transform`.
function testProp(props) {
    var style = document.documentElement.style;

    for (var i = 0; i < props.length; i++) {
        if (props[i] in style) {
            return props[i];
        }
    }
    return false;
}

function isPropertySupported(prop) {
    var style = document.documentElement.style;
    return prop in style;
}

// @function setTransform(el: HTMLElement, offset: Point, scale?: Number)
// Resets the 3D CSS transform of `el` so it is translated by `offset` pixels
// and optionally scaled by `scale`. Does not have an effect if the
// browser doesn't support 3D CSS transforms.
function setTransform(el, offset, scale) {
    var pos = offset || new Point(0, 0);

    el.style[TRANSFORM] = (ie3d ? 'translate(' + pos.x + 'px,' + pos.y + 'px)' : 'translate3d(' + pos.x + 'px,' + pos.y + 'px,0)') + (scale ? ' scale(' + scale + ')' : '');
}

// @function setPosition(el: HTMLElement, position: Point)
// Sets the position of `el` to coordinates specified by `position`,
// using CSS translate or top/left positioning depending on the browser
// (used by Leaflet internally to position its layers).
function setPosition(el, point) {

    /*eslint-disable */
    el._leaflet_pos = point;
    /*eslint-enable */

    if (any3d) {
        setTransform(el, point);
    } else {
        el.style.left = point.x + 'px';
        el.style.top = point.y + 'px';
    }
}

// @function getPosition(el: HTMLElement): Point
// Returns the coordinates of an element previously positioned with setPosition.
function getPosition(el) {
    // this method is only used for elements previously positioned using setPosition,
    // so it's safe to cache the position for performance

    return el._leaflet_pos || new Point(0, 0);
}

// @function disableTextSelection()
// Prevents the user from generating `selectstart` DOM events, usually generated
// when the user drags the mouse through a page with text. Used internally
// by Leaflet to override the behaviour of any click-and-drag interaction on
// the map. Affects drag interactions on the whole document.

// @function enableTextSelection()
// Cancels the effects of a previous [`L.DomUtil.disableTextSelection`](#domutil-disabletextselection).
var disableTextSelection;
var enableTextSelection;
var _userSelect;
if ('onselectstart' in document) {
    disableTextSelection = function disableTextSelection() {
        on(window, 'selectstart', preventDefault);
    };
    enableTextSelection = function enableTextSelection() {
        off(window, 'selectstart', preventDefault);
    };
} else {
    var userSelectProperty = testProp(['userSelect', 'WebkitUserSelect', 'OUserSelect', 'MozUserSelect', 'msUserSelect']);

    disableTextSelection = function disableTextSelection() {
        if (userSelectProperty) {
            var style = document.documentElement.style;
            _userSelect = style[userSelectProperty];
            style[userSelectProperty] = 'none';
        }
    };
    enableTextSelection = function enableTextSelection() {
        if (userSelectProperty) {
            document.documentElement.style[userSelectProperty] = _userSelect;
            _userSelect = undefined;
        }
    };
}

// @function disableImageDrag()
// As [`L.DomUtil.disableTextSelection`](#domutil-disabletextselection), but
// for `dragstart` DOM events, usually generated when the user drags an image.
function disableImageDrag() {
    on(window, 'dragstart', preventDefault);
}

// @function enableImageDrag()
// Cancels the effects of a previous [`L.DomUtil.disableImageDrag`](#domutil-disabletextselection).
function enableImageDrag() {
    off(window, 'dragstart', preventDefault);
}

var _outlineElement;
var _outlineStyle;
// @function preventOutline(el: HTMLElement)
// Makes the [outline](https://developer.mozilla.org/docs/Web/CSS/outline)
// of the element `el` invisible. Used internally by Leaflet to prevent
// focusable elements from displaying an outline when the user performs a
// drag interaction on them.
function preventOutline(element) {
    while (element.tabIndex === -1) {
        element = element.parentNode;
    }
    if (!element || !element.style) {
        return;
    }
    restoreOutline();
    _outlineElement = element;
    _outlineStyle = element.style.outline;
    element.style.outline = 'none';
    on(window, 'keydown', restoreOutline);
}

// @function restoreOutline()
// Cancels the effects of a previous [`L.DomUtil.preventOutline`]().
function restoreOutline() {
    if (!_outlineElement) {
        return;
    }
    _outlineElement.style.outline = _outlineStyle;
    _outlineElement = undefined;
    _outlineStyle = undefined;
    off(window, 'keydown', restoreOutline);
}

var DomUtil = (Object.freeze || Object)({
	TRANSFORM: TRANSFORM,
	TRANSITION: TRANSITION,
	TRANSITION_END: TRANSITION_END,
	get: get$1,
	getStyle: getStyle,
	create: create$1,
	remove: remove,
	empty: empty,
	toFront: toFront,
	toBack: toBack,
	hasClass: hasClass,
	addClass: addClass,
	removeClass: removeClass,
	setClass: setClass,
	getClass: getClass,
	setOpacity: setOpacity,
	testProp: testProp,
	isPropertySupported: isPropertySupported,
	setTransform: setTransform,
	setPosition: setPosition,
	getPosition: getPosition,
	disableTextSelection: disableTextSelection,
	enableTextSelection: enableTextSelection,
	disableImageDrag: disableImageDrag,
	enableImageDrag: enableImageDrag,
	preventOutline: preventOutline,
	restoreOutline: restoreOutline
});

/**
 * Checks if `value` is the
 * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
 * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an object, else `false`.
 * @example
 *
 * _.isObject({});
 * // => true
 *
 * _.isObject([1, 2, 3]);
 * // => true
 *
 * _.isObject(_.noop);
 * // => true
 *
 * _.isObject(null);
 * // => false
 */
function isObject(value) {
  var type = typeof value;
  return value != null && (type == 'object' || type == 'function');
}

var isObject_1 = isObject;

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

var _freeGlobal = freeGlobal;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = _freeGlobal || freeSelf || Function('return this')();

var _root = root;

/** Built-in value references. */
var Symbol$1 = _root.Symbol;

var _Symbol = Symbol$1;

/** Used for built-in method references. */
var objectProto = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty = objectProto.hasOwnProperty;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString = objectProto.toString;

/** Built-in value references. */
var symToStringTag$1 = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * A specialized version of `baseGetTag` which ignores `Symbol.toStringTag` values.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the raw `toStringTag`.
 */
function getRawTag(value) {
  var isOwn = hasOwnProperty.call(value, symToStringTag$1),
      tag = value[symToStringTag$1];

  try {
    value[symToStringTag$1] = undefined;
    var unmasked = true;
  } catch (e) {}

  var result = nativeObjectToString.call(value);
  if (unmasked) {
    if (isOwn) {
      value[symToStringTag$1] = tag;
    } else {
      delete value[symToStringTag$1];
    }
  }
  return result;
}

var _getRawTag = getRawTag;

/** Used for built-in method references. */
var objectProto$1 = Object.prototype;

/**
 * Used to resolve the
 * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
 * of values.
 */
var nativeObjectToString$1 = objectProto$1.toString;

/**
 * Converts `value` to a string using `Object.prototype.toString`.
 *
 * @private
 * @param {*} value The value to convert.
 * @returns {string} Returns the converted string.
 */
function objectToString(value) {
  return nativeObjectToString$1.call(value);
}

var _objectToString = objectToString;

/** `Object#toString` result references. */
var nullTag = '[object Null]';
var undefinedTag = '[object Undefined]';

/** Built-in value references. */
var symToStringTag = _Symbol ? _Symbol.toStringTag : undefined;

/**
 * The base implementation of `getTag` without fallbacks for buggy environments.
 *
 * @private
 * @param {*} value The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
function baseGetTag(value) {
  if (value == null) {
    return value === undefined ? undefinedTag : nullTag;
  }
  return (symToStringTag && symToStringTag in Object(value))
    ? _getRawTag(value)
    : _objectToString(value);
}

var _baseGetTag = baseGetTag;

/**
 * Checks if `value` is object-like. A value is object-like if it's not `null`
 * and has a `typeof` result of "object".
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
 * @example
 *
 * _.isObjectLike({});
 * // => true
 *
 * _.isObjectLike([1, 2, 3]);
 * // => true
 *
 * _.isObjectLike(_.noop);
 * // => false
 *
 * _.isObjectLike(null);
 * // => false
 */
function isObjectLike(value) {
  return value != null && typeof value == 'object';
}

var isObjectLike_1 = isObjectLike;

/** `Object#toString` result references. */
var asyncTag = '[object AsyncFunction]';
var funcTag = '[object Function]';
var genTag = '[object GeneratorFunction]';
var proxyTag = '[object Proxy]';

/**
 * Checks if `value` is classified as a `Function` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a function, else `false`.
 * @example
 *
 * _.isFunction(_);
 * // => true
 *
 * _.isFunction(/abc/);
 * // => false
 */
function isFunction(value) {
  if (!isObject_1(value)) {
    return false;
  }
  // The use of `Object#toString` avoids issues with the `typeof` operator
  // in Safari 9 which returns 'object' for typed arrays and other constructors.
  var tag = _baseGetTag(value);
  return tag == funcTag || tag == genTag || tag == asyncTag || tag == proxyTag;
}

var isFunction_1 = isFunction;

/** Used to detect overreaching core-js shims. */
var coreJsData = _root['__core-js_shared__'];

var _coreJsData = coreJsData;

/** Used to detect methods masquerading as native. */
var maskSrcKey = (function() {
  var uid = /[^.]+$/.exec(_coreJsData && _coreJsData.keys && _coreJsData.keys.IE_PROTO || '');
  return uid ? ('Symbol(src)_1.' + uid) : '';
}());

/**
 * Checks if `func` has its source masked.
 *
 * @private
 * @param {Function} func The function to check.
 * @returns {boolean} Returns `true` if `func` is masked, else `false`.
 */
function isMasked(func) {
  return !!maskSrcKey && (maskSrcKey in func);
}

var _isMasked = isMasked;

/** Used for built-in method references. */
var funcProto$1 = Function.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString$1 = funcProto$1.toString;

/**
 * Converts `func` to its source code.
 *
 * @private
 * @param {Function} func The function to convert.
 * @returns {string} Returns the source code.
 */
function toSource(func) {
  if (func != null) {
    try {
      return funcToString$1.call(func);
    } catch (e) {}
    try {
      return (func + '');
    } catch (e) {}
  }
  return '';
}

var _toSource = toSource;

/**
 * Used to match `RegExp`
 * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
 */
var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

/** Used to detect host constructors (Safari). */
var reIsHostCtor = /^\[object .+?Constructor\]$/;

/** Used for built-in method references. */
var funcProto = Function.prototype;
var objectProto$4 = Object.prototype;

/** Used to resolve the decompiled source of functions. */
var funcToString = funcProto.toString;

/** Used to check objects for own properties. */
var hasOwnProperty$3 = objectProto$4.hasOwnProperty;

/** Used to detect if a method is native. */
var reIsNative = RegExp('^' +
  funcToString.call(hasOwnProperty$3).replace(reRegExpChar, '\\$&')
  .replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$'
);

/**
 * The base implementation of `_.isNative` without bad shim checks.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a native function,
 *  else `false`.
 */
function baseIsNative(value) {
  if (!isObject_1(value) || _isMasked(value)) {
    return false;
  }
  var pattern = isFunction_1(value) ? reIsNative : reIsHostCtor;
  return pattern.test(_toSource(value));
}

var _baseIsNative = baseIsNative;

/**
 * Gets the value at `key` of `object`.
 *
 * @private
 * @param {Object} [object] The object to query.
 * @param {string} key The key of the property to get.
 * @returns {*} Returns the property value.
 */
function getValue(object, key) {
  return object == null ? undefined : object[key];
}

var _getValue = getValue;

/**
 * Gets the native function at `key` of `object`.
 *
 * @private
 * @param {Object} object The object to query.
 * @param {string} key The key of the method to get.
 * @returns {*} Returns the function if it's native, else `undefined`.
 */
function getNative(object, key) {
  var value = _getValue(object, key);
  return _baseIsNative(value) ? value : undefined;
}

var _getNative = getNative;

var defineProperty$1 = (function() {
  try {
    var func = _getNative(Object, 'defineProperty');
    func({}, '', {});
    return func;
  } catch (e) {}
}());

var _defineProperty = defineProperty$1;

/**
 * The base implementation of `assignValue` and `assignMergeValue` without
 * value checks.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function baseAssignValue(object, key, value) {
  if (key == '__proto__' && _defineProperty) {
    _defineProperty(object, key, {
      'configurable': true,
      'enumerable': true,
      'value': value,
      'writable': true
    });
  } else {
    object[key] = value;
  }
}

var _baseAssignValue = baseAssignValue;

/**
 * Performs a
 * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * comparison between two values to determine if they are equivalent.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to compare.
 * @param {*} other The other value to compare.
 * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
 * @example
 *
 * var object = { 'a': 1 };
 * var other = { 'a': 1 };
 *
 * _.eq(object, object);
 * // => true
 *
 * _.eq(object, other);
 * // => false
 *
 * _.eq('a', 'a');
 * // => true
 *
 * _.eq('a', Object('a'));
 * // => false
 *
 * _.eq(NaN, NaN);
 * // => true
 */
function eq(value, other) {
  return value === other || (value !== value && other !== other);
}

var eq_1 = eq;

/** Used for built-in method references. */
var objectProto$3 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$2 = objectProto$3.hasOwnProperty;

/**
 * Assigns `value` to `key` of `object` if the existing value is not equivalent
 * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
 * for equality comparisons.
 *
 * @private
 * @param {Object} object The object to modify.
 * @param {string} key The key of the property to assign.
 * @param {*} value The value to assign.
 */
function assignValue(object, key, value) {
  var objValue = object[key];
  if (!(hasOwnProperty$2.call(object, key) && eq_1(objValue, value)) ||
      (value === undefined && !(key in object))) {
    _baseAssignValue(object, key, value);
  }
}

var _assignValue = assignValue;

/**
 * Copies properties of `source` to `object`.
 *
 * @private
 * @param {Object} source The object to copy properties from.
 * @param {Array} props The property identifiers to copy.
 * @param {Object} [object={}] The object to copy properties to.
 * @param {Function} [customizer] The function to customize copied values.
 * @returns {Object} Returns `object`.
 */
function copyObject(source, props, object, customizer) {
  var isNew = !object;
  object || (object = {});

  var index = -1,
      length = props.length;

  while (++index < length) {
    var key = props[index];

    var newValue = customizer
      ? customizer(object[key], source[key], key, object, source)
      : undefined;

    if (newValue === undefined) {
      newValue = source[key];
    }
    if (isNew) {
      _baseAssignValue(object, key, newValue);
    } else {
      _assignValue(object, key, newValue);
    }
  }
  return object;
}

var _copyObject = copyObject;

/**
 * This method returns the first argument it receives.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Util
 * @param {*} value Any value.
 * @returns {*} Returns `value`.
 * @example
 *
 * var object = { 'a': 1 };
 *
 * console.log(_.identity(object) === object);
 * // => true
 */
function identity(value) {
  return value;
}

var identity_1 = identity;

/**
 * A faster alternative to `Function#apply`, this function invokes `func`
 * with the `this` binding of `thisArg` and the arguments of `args`.
 *
 * @private
 * @param {Function} func The function to invoke.
 * @param {*} thisArg The `this` binding of `func`.
 * @param {Array} args The arguments to invoke `func` with.
 * @returns {*} Returns the result of `func`.
 */
function apply(func, thisArg, args) {
  switch (args.length) {
    case 0: return func.call(thisArg);
    case 1: return func.call(thisArg, args[0]);
    case 2: return func.call(thisArg, args[0], args[1]);
    case 3: return func.call(thisArg, args[0], args[1], args[2]);
  }
  return func.apply(thisArg, args);
}

var _apply = apply;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax$1 = Math.max;

/**
 * A specialized version of `baseRest` which transforms the rest array.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @param {Function} transform The rest array transform.
 * @returns {Function} Returns the new function.
 */
function overRest(func, start, transform) {
  start = nativeMax$1(start === undefined ? (func.length - 1) : start, 0);
  return function() {
    var args = arguments,
        index = -1,
        length = nativeMax$1(args.length - start, 0),
        array = Array(length);

    while (++index < length) {
      array[index] = args[start + index];
    }
    index = -1;
    var otherArgs = Array(start + 1);
    while (++index < start) {
      otherArgs[index] = args[index];
    }
    otherArgs[start] = transform(array);
    return _apply(func, this, otherArgs);
  };
}

var _overRest = overRest;

/**
 * Creates a function that returns `value`.
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Util
 * @param {*} value The value to return from the new function.
 * @returns {Function} Returns the new constant function.
 * @example
 *
 * var objects = _.times(2, _.constant({ 'a': 1 }));
 *
 * console.log(objects);
 * // => [{ 'a': 1 }, { 'a': 1 }]
 *
 * console.log(objects[0] === objects[1]);
 * // => true
 */
function constant(value) {
  return function() {
    return value;
  };
}

var constant_1 = constant;

/**
 * The base implementation of `setToString` without support for hot loop shorting.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var baseSetToString = !_defineProperty ? identity_1 : function(func, string) {
  return _defineProperty(func, 'toString', {
    'configurable': true,
    'enumerable': false,
    'value': constant_1(string),
    'writable': true
  });
};

var _baseSetToString = baseSetToString;

/** Used to detect hot functions by number of calls within a span of milliseconds. */
var HOT_COUNT = 800;
var HOT_SPAN = 16;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeNow = Date.now;

/**
 * Creates a function that'll short out and invoke `identity` instead
 * of `func` when it's called `HOT_COUNT` or more times in `HOT_SPAN`
 * milliseconds.
 *
 * @private
 * @param {Function} func The function to restrict.
 * @returns {Function} Returns the new shortable function.
 */
function shortOut(func) {
  var count = 0,
      lastCalled = 0;

  return function() {
    var stamp = nativeNow(),
        remaining = HOT_SPAN - (stamp - lastCalled);

    lastCalled = stamp;
    if (remaining > 0) {
      if (++count >= HOT_COUNT) {
        return arguments[0];
      }
    } else {
      count = 0;
    }
    return func.apply(undefined, arguments);
  };
}

var _shortOut = shortOut;

/**
 * Sets the `toString` method of `func` to return `string`.
 *
 * @private
 * @param {Function} func The function to modify.
 * @param {Function} string The `toString` result.
 * @returns {Function} Returns `func`.
 */
var setToString = _shortOut(_baseSetToString);

var _setToString = setToString;

/**
 * The base implementation of `_.rest` which doesn't validate or coerce arguments.
 *
 * @private
 * @param {Function} func The function to apply a rest parameter to.
 * @param {number} [start=func.length-1] The start position of the rest parameter.
 * @returns {Function} Returns the new function.
 */
function baseRest(func, start) {
  return _setToString(_overRest(func, start, identity_1), func + '');
}

var _baseRest = baseRest;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER = 9007199254740991;

/**
 * Checks if `value` is a valid array-like length.
 *
 * **Note:** This method is loosely based on
 * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
 * @example
 *
 * _.isLength(3);
 * // => true
 *
 * _.isLength(Number.MIN_VALUE);
 * // => false
 *
 * _.isLength(Infinity);
 * // => false
 *
 * _.isLength('3');
 * // => false
 */
function isLength(value) {
  return typeof value == 'number' &&
    value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}

var isLength_1 = isLength;

/**
 * Checks if `value` is array-like. A value is considered array-like if it's
 * not a function and has a `value.length` that's an integer greater than or
 * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
 * @example
 *
 * _.isArrayLike([1, 2, 3]);
 * // => true
 *
 * _.isArrayLike(document.body.children);
 * // => true
 *
 * _.isArrayLike('abc');
 * // => true
 *
 * _.isArrayLike(_.noop);
 * // => false
 */
function isArrayLike(value) {
  return value != null && isLength_1(value.length) && !isFunction_1(value);
}

var isArrayLike_1 = isArrayLike;

/** Used as references for various `Number` constants. */
var MAX_SAFE_INTEGER$1 = 9007199254740991;

/** Used to detect unsigned integer values. */
var reIsUint = /^(?:0|[1-9]\d*)$/;

/**
 * Checks if `value` is a valid array-like index.
 *
 * @private
 * @param {*} value The value to check.
 * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
 * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
 */
function isIndex(value, length) {
  length = length == null ? MAX_SAFE_INTEGER$1 : length;
  return !!length &&
    (typeof value == 'number' || reIsUint.test(value)) &&
    (value > -1 && value % 1 == 0 && value < length);
}

var _isIndex = isIndex;

/**
 * Checks if the given arguments are from an iteratee call.
 *
 * @private
 * @param {*} value The potential iteratee value argument.
 * @param {*} index The potential iteratee index or key argument.
 * @param {*} object The potential iteratee object argument.
 * @returns {boolean} Returns `true` if the arguments are from an iteratee call,
 *  else `false`.
 */
function isIterateeCall(value, index, object) {
  if (!isObject_1(object)) {
    return false;
  }
  var type = typeof index;
  if (type == 'number'
        ? (isArrayLike_1(object) && _isIndex(index, object.length))
        : (type == 'string' && index in object)
      ) {
    return eq_1(object[index], value);
  }
  return false;
}

var _isIterateeCall = isIterateeCall;

/**
 * Creates a function like `_.assign`.
 *
 * @private
 * @param {Function} assigner The function to assign values.
 * @returns {Function} Returns the new assigner function.
 */
function createAssigner(assigner) {
  return _baseRest(function(object, sources) {
    var index = -1,
        length = sources.length,
        customizer = length > 1 ? sources[length - 1] : undefined,
        guard = length > 2 ? sources[2] : undefined;

    customizer = (assigner.length > 3 && typeof customizer == 'function')
      ? (length--, customizer)
      : undefined;

    if (guard && _isIterateeCall(sources[0], sources[1], guard)) {
      customizer = length < 3 ? undefined : customizer;
      length = 1;
    }
    object = Object(object);
    while (++index < length) {
      var source = sources[index];
      if (source) {
        assigner(object, source, index, customizer);
      }
    }
    return object;
  });
}

var _createAssigner = createAssigner;

/** Used for built-in method references. */
var objectProto$5 = Object.prototype;

/**
 * Checks if `value` is likely a prototype object.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
 */
function isPrototype(value) {
  var Ctor = value && value.constructor,
      proto = (typeof Ctor == 'function' && Ctor.prototype) || objectProto$5;

  return value === proto;
}

var _isPrototype = isPrototype;

/**
 * The base implementation of `_.times` without support for iteratee shorthands
 * or max array length checks.
 *
 * @private
 * @param {number} n The number of times to invoke `iteratee`.
 * @param {Function} iteratee The function invoked per iteration.
 * @returns {Array} Returns the array of results.
 */
function baseTimes(n, iteratee) {
  var index = -1,
      result = Array(n);

  while (++index < n) {
    result[index] = iteratee(index);
  }
  return result;
}

var _baseTimes = baseTimes;

/** `Object#toString` result references. */
var argsTag = '[object Arguments]';

/**
 * The base implementation of `_.isArguments`.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 */
function baseIsArguments(value) {
  return isObjectLike_1(value) && _baseGetTag(value) == argsTag;
}

var _baseIsArguments = baseIsArguments;

/** Used for built-in method references. */
var objectProto$7 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$5 = objectProto$7.hasOwnProperty;

/** Built-in value references. */
var propertyIsEnumerable = objectProto$7.propertyIsEnumerable;

/**
 * Checks if `value` is likely an `arguments` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an `arguments` object,
 *  else `false`.
 * @example
 *
 * _.isArguments(function() { return arguments; }());
 * // => true
 *
 * _.isArguments([1, 2, 3]);
 * // => false
 */
var isArguments = _baseIsArguments(function() { return arguments; }()) ? _baseIsArguments : function(value) {
  return isObjectLike_1(value) && hasOwnProperty$5.call(value, 'callee') &&
    !propertyIsEnumerable.call(value, 'callee');
};

var isArguments_1 = isArguments;

/**
 * Checks if `value` is classified as an `Array` object.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is an array, else `false`.
 * @example
 *
 * _.isArray([1, 2, 3]);
 * // => true
 *
 * _.isArray(document.body.children);
 * // => false
 *
 * _.isArray('abc');
 * // => false
 *
 * _.isArray(_.noop);
 * // => false
 */
var isArray$1 = Array.isArray;

var isArray_1 = isArray$1;

/**
 * This method returns `false`.
 *
 * @static
 * @memberOf _
 * @since 4.13.0
 * @category Util
 * @returns {boolean} Returns `false`.
 * @example
 *
 * _.times(2, _.stubFalse);
 * // => [false, false]
 */
function stubFalse() {
  return false;
}

var stubFalse_1 = stubFalse;

var isBuffer_1 = createCommonjsModule(function (module, exports) {
/** Detect free variable `exports`. */
var freeExports = 'object' == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Built-in value references. */
var Buffer = moduleExports ? _root.Buffer : undefined;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

/**
 * Checks if `value` is a buffer.
 *
 * @static
 * @memberOf _
 * @since 4.3.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
 * @example
 *
 * _.isBuffer(new Buffer(2));
 * // => true
 *
 * _.isBuffer(new Uint8Array(2));
 * // => false
 */
var isBuffer = nativeIsBuffer || stubFalse_1;

module.exports = isBuffer;
});

/** `Object#toString` result references. */
var argsTag$1 = '[object Arguments]';
var arrayTag = '[object Array]';
var boolTag = '[object Boolean]';
var dateTag = '[object Date]';
var errorTag = '[object Error]';
var funcTag$1 = '[object Function]';
var mapTag = '[object Map]';
var numberTag = '[object Number]';
var objectTag = '[object Object]';
var regexpTag = '[object RegExp]';
var setTag = '[object Set]';
var stringTag = '[object String]';
var weakMapTag = '[object WeakMap]';

var arrayBufferTag = '[object ArrayBuffer]';
var dataViewTag = '[object DataView]';
var float32Tag = '[object Float32Array]';
var float64Tag = '[object Float64Array]';
var int8Tag = '[object Int8Array]';
var int16Tag = '[object Int16Array]';
var int32Tag = '[object Int32Array]';
var uint8Tag = '[object Uint8Array]';
var uint8ClampedTag = '[object Uint8ClampedArray]';
var uint16Tag = '[object Uint16Array]';
var uint32Tag = '[object Uint32Array]';

/** Used to identify `toStringTag` values of typed arrays. */
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] =
typedArrayTags[int8Tag] = typedArrayTags[int16Tag] =
typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] =
typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] =
typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag$1] = typedArrayTags[arrayTag] =
typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] =
typedArrayTags[dataViewTag] = typedArrayTags[dateTag] =
typedArrayTags[errorTag] = typedArrayTags[funcTag$1] =
typedArrayTags[mapTag] = typedArrayTags[numberTag] =
typedArrayTags[objectTag] = typedArrayTags[regexpTag] =
typedArrayTags[setTag] = typedArrayTags[stringTag] =
typedArrayTags[weakMapTag] = false;

/**
 * The base implementation of `_.isTypedArray` without Node.js optimizations.
 *
 * @private
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 */
function baseIsTypedArray(value) {
  return isObjectLike_1(value) &&
    isLength_1(value.length) && !!typedArrayTags[_baseGetTag(value)];
}

var _baseIsTypedArray = baseIsTypedArray;

/**
 * The base implementation of `_.unary` without support for storing metadata.
 *
 * @private
 * @param {Function} func The function to cap arguments for.
 * @returns {Function} Returns the new capped function.
 */
function baseUnary(func) {
  return function(value) {
    return func(value);
  };
}

var _baseUnary = baseUnary;

var _nodeUtil = createCommonjsModule(function (module, exports) {
/** Detect free variable `exports`. */
var freeExports = 'object' == 'object' && exports && !exports.nodeType && exports;

/** Detect free variable `module`. */
var freeModule = freeExports && 'object' == 'object' && module && !module.nodeType && module;

/** Detect the popular CommonJS extension `module.exports`. */
var moduleExports = freeModule && freeModule.exports === freeExports;

/** Detect free variable `process` from Node.js. */
var freeProcess = moduleExports && _freeGlobal.process;

/** Used to access faster Node.js helpers. */
var nodeUtil = (function() {
  try {
    return freeProcess && freeProcess.binding && freeProcess.binding('util');
  } catch (e) {}
}());

module.exports = nodeUtil;
});

/* Node.js helper references. */
var nodeIsTypedArray = _nodeUtil && _nodeUtil.isTypedArray;

/**
 * Checks if `value` is classified as a typed array.
 *
 * @static
 * @memberOf _
 * @since 3.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
 * @example
 *
 * _.isTypedArray(new Uint8Array);
 * // => true
 *
 * _.isTypedArray([]);
 * // => false
 */
var isTypedArray = nodeIsTypedArray ? _baseUnary(nodeIsTypedArray) : _baseIsTypedArray;

var isTypedArray_1 = isTypedArray;

/** Used for built-in method references. */
var objectProto$6 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$4 = objectProto$6.hasOwnProperty;

/**
 * Creates an array of the enumerable property names of the array-like `value`.
 *
 * @private
 * @param {*} value The value to query.
 * @param {boolean} inherited Specify returning inherited property names.
 * @returns {Array} Returns the array of property names.
 */
function arrayLikeKeys(value, inherited) {
  var isArr = isArray_1(value),
      isArg = !isArr && isArguments_1(value),
      isBuff = !isArr && !isArg && isBuffer_1(value),
      isType = !isArr && !isArg && !isBuff && isTypedArray_1(value),
      skipIndexes = isArr || isArg || isBuff || isType,
      result = skipIndexes ? _baseTimes(value.length, String) : [],
      length = result.length;

  for (var key in value) {
    if ((inherited || hasOwnProperty$4.call(value, key)) &&
        !(skipIndexes && (
           // Safari 9 has enumerable `arguments.length` in strict mode.
           key == 'length' ||
           // Node.js 0.10 has enumerable non-index properties on buffers.
           (isBuff && (key == 'offset' || key == 'parent')) ||
           // PhantomJS 2 has enumerable non-index properties on typed arrays.
           (isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset')) ||
           // Skip index properties.
           _isIndex(key, length)
        ))) {
      result.push(key);
    }
  }
  return result;
}

var _arrayLikeKeys = arrayLikeKeys;

/**
 * Creates a unary function that invokes `func` with its argument transformed.
 *
 * @private
 * @param {Function} func The function to wrap.
 * @param {Function} transform The argument transform.
 * @returns {Function} Returns the new function.
 */
function overArg(func, transform) {
  return function(arg) {
    return func(transform(arg));
  };
}

var _overArg = overArg;

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeKeys = _overArg(Object.keys, Object);

var _nativeKeys = nativeKeys;

/** Used for built-in method references. */
var objectProto$8 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$6 = objectProto$8.hasOwnProperty;

/**
 * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
 *
 * @private
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 */
function baseKeys(object) {
  if (!_isPrototype(object)) {
    return _nativeKeys(object);
  }
  var result = [];
  for (var key in Object(object)) {
    if (hasOwnProperty$6.call(object, key) && key != 'constructor') {
      result.push(key);
    }
  }
  return result;
}

var _baseKeys = baseKeys;

/**
 * Creates an array of the own enumerable property names of `object`.
 *
 * **Note:** Non-object values are coerced to objects. See the
 * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
 * for more details.
 *
 * @static
 * @since 0.1.0
 * @memberOf _
 * @category Object
 * @param {Object} object The object to query.
 * @returns {Array} Returns the array of property names.
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 *   this.b = 2;
 * }
 *
 * Foo.prototype.c = 3;
 *
 * _.keys(new Foo);
 * // => ['a', 'b'] (iteration order is not guaranteed)
 *
 * _.keys('hi');
 * // => ['0', '1']
 */
function keys(object) {
  return isArrayLike_1(object) ? _arrayLikeKeys(object) : _baseKeys(object);
}

var keys_1 = keys;

/** Used for built-in method references. */
var objectProto$2 = Object.prototype;

/** Used to check objects for own properties. */
var hasOwnProperty$1 = objectProto$2.hasOwnProperty;

/**
 * Assigns own enumerable string keyed properties of source objects to the
 * destination object. Source objects are applied from left to right.
 * Subsequent sources overwrite property assignments of previous sources.
 *
 * **Note:** This method mutates `object` and is loosely based on
 * [`Object.assign`](https://mdn.io/Object/assign).
 *
 * @static
 * @memberOf _
 * @since 0.10.0
 * @category Object
 * @param {Object} object The destination object.
 * @param {...Object} [sources] The source objects.
 * @returns {Object} Returns `object`.
 * @see _.assignIn
 * @example
 *
 * function Foo() {
 *   this.a = 1;
 * }
 *
 * function Bar() {
 *   this.c = 3;
 * }
 *
 * Foo.prototype.b = 2;
 * Bar.prototype.d = 4;
 *
 * _.assign({ 'a': 0 }, new Foo, new Bar);
 * // => { 'a': 1, 'c': 3 }
 */
var assign = _createAssigner(function(object, source) {
  if (_isPrototype(source) || isArrayLike_1(source)) {
    _copyObject(source, keys_1(source), object);
    return;
  }
  for (var key in source) {
    if (hasOwnProperty$1.call(source, key)) {
      _assignValue(object, key, source[key]);
    }
  }
});

var assign_1 = assign;

var document$1 = typeof window !== 'undefined' && typeof window.document !== 'undefined' ? window.document : {};
var keyboardAllowed = typeof Element !== 'undefined' && 'ALLOW_KEYBOARD_INPUT' in Element;

var fn = function () {
  var val;

  var fnMap = [['requestFullscreen', 'exitFullscreen', 'fullscreenElement', 'fullscreenEnabled', 'fullscreenchange', 'fullscreenerror'],
  // New WebKit
  ['webkitRequestFullscreen', 'webkitExitFullscreen', 'webkitFullscreenElement', 'webkitFullscreenEnabled', 'webkitfullscreenchange', 'webkitfullscreenerror'],
  // Old WebKit (Safari 5.1)
  ['webkitRequestFullScreen', 'webkitCancelFullScreen', 'webkitCurrentFullScreenElement', 'webkitCancelFullScreen', 'webkitfullscreenchange', 'webkitfullscreenerror'], ['mozRequestFullScreen', 'mozCancelFullScreen', 'mozFullScreenElement', 'mozFullScreenEnabled', 'mozfullscreenchange', 'mozfullscreenerror'], ['msRequestFullscreen', 'msExitFullscreen', 'msFullscreenElement', 'msFullscreenEnabled', 'MSFullscreenChange', 'MSFullscreenError']];

  var i = 0;
  var l = fnMap.length;
  var ret = {};

  for (; i < l; i++) {
    val = fnMap[i];
    if (val && val[1] in document$1) {
      for (i = 0; i < val.length; i++) {
        ret[fnMap[0][i]] = val[i];
      }
      return ret;
    }
  }

  return false;
}();

var eventNameMap = {
  change: fn.fullscreenchange,
  error: fn.fullscreenerror
};

var screenfull = {
  request: function request(elem) {
    var request = fn.requestFullscreen;

    elem = elem || document$1.documentElement;

    // Work around Safari 5.1 bug: reports support for
    // keyboard in fullscreen even though it doesn't.
    // Browser sniffing, since the alternative with
    // setTimeout is even worse.
    if (/5\.1[.\d]* Safari/.test(navigator.userAgent)) {
      elem[request]();
    } else {
      elem[request](keyboardAllowed && Element.ALLOW_KEYBOARD_INPUT);
    }
  },
  exit: function exit() {
    document$1[fn.exitFullscreen]();
  },
  toggle: function toggle(elem) {
    if (this.isFullscreen) {
      this.exit();
    } else {
      this.request(elem);
    }
  },
  onchange: function onchange(callback) {
    this.on('change', callback);
  },
  onerror: function onerror(callback) {
    this.on('error', callback);
  },
  on: function on(event, callback) {
    var eventName = eventNameMap[event];
    if (eventName) {
      document$1.addEventListener(eventName, callback, false);
    }
  },
  off: function off(event, callback) {
    var eventName = eventNameMap[event];
    if (eventName) {
      document$1.removeEventListener(eventName, callback, false);
    }
  },
  raw: fn
};

Object.defineProperties(screenfull, {
  isFullscreen: {
    get: function get() {
      return Boolean(document$1[fn.fullscreenElement]);
    }
  },
  element: {
    enumerable: true,
    get: function get() {
      return document$1[fn.fullscreenElement];
    }
  },
  enabled: {
    enumerable: true,
    get: function get() {
      // Coerce to boolean in case of old WebKit
      return Boolean(document$1[fn.fullscreenEnabled]);
    }
  }
});

// import {Class} from '../core/Class';
var Reader = Evented.extend({
  options: {
    regions: ['header', 'toolbar.top', 'toolbar.left', 'main', 'toolbar.right', 'toolbar.bottom', 'footer'],
    metadata: {},
    flow: 'auto',
    engine: 'epubjs',
    fontSizeLarge: '140%',
    fontSizeSmall: '90%',
    fontSizeDefault: '100%',
    trackResize: true,
    text_size: 100,
    mobileMediaQuery: '(min-device-width : 300px) and (max-device-width : 600px)',
    forceScrolledDocHeight: 1200,
    theme: 'default',
    rootfilePath: '',
    themes: []
  },

  initialize: function initialize(id, options) {
    var self = this;

    if (localStorage.getItem('cozy.options')) {
      options = assign_1(options, JSON.parse(localStorage.getItem('cozy.options')));
    }
    options = setOptions(this, options);

    this._checkFeatureCompatibility();

    this.metadata = this.options.metadata; // initial seed

    this._initContainer(id);
    this._initLayout();

    if (this.options.themes && this.options.themes.length > 0) {
      this.options.themes.forEach(function (theme) {
        if (theme.href) {
          return;
        }
        var klass = theme.klass;
        var rules = {};
        for (var rule in theme.rules) {
          var new_rule = '.' + klass;
          if (rule == 'body') {
            new_rule = 'body' + new_rule;
          } else {
            new_rule += ' ' + rule;
          }
          rules[new_rule] = theme.rules[rule];
        }
        theme.rules = rules;
      });
    }

    this._updateTheme();

    // hack for https://github.com/Leaflet/Leaflet/issues/1980
    // this._onResize = Util.bind(this._onResize, this);

    this._initEvents();

    this.callInitHooks();

    this._mode = this.options.mode;
  },

  start: function start(target, cb) {
    var self = this;

    if (typeof target == 'function' && cb === undefined) {
      cb = target;
      target = undefined;
    }

    loader.js(this.options.engine_href).then(function () {
      self._start(target, cb);
      self._loaded = true;
    });
  },

  _start: function _start(target, cb) {
    var self = this;
    target = target || 0;

    // self.open(function() {
    //   self.draw(target, cb);
    // });

    self.open(target, cb);
  },

  reopen: function reopen(options, target) {
    /* NOP */
  },

  saveOptions: function saveOptions(options) {
    var saved_options = {};
    assign_1(saved_options, options);
    if (saved_options.flow == 'auto') {
      // do not save
      delete saved_options.flow;
    }
    localStorage.setItem('cozy.options', JSON.stringify(saved_options));
  },

  _updateTheme: function _updateTheme() {
    removeClass(this._container, 'cozy-theme-' + (this._container.dataset.theme || 'default'));
    addClass(this._container, 'cozy-theme-' + this.options.theme);
    this._container.dataset.theme = this.options.theme;
  },

  draw: function draw(target) {
    // NOOP
  },

  next: function next() {
    // NOOP
  },

  prev: function prev() {
    // NOOP
  },

  display: function display(index) {
    // NOOP
  },

  gotoPage: function gotoPage(target) {
    // NOOP
  },

  goBack: function goBack() {
    history.back();
  },

  goForward: function goForward() {
    history.forward();
  },

  requestFullscreen: function requestFullscreen() {
    if (screenfull.enabled) {
      // this._preResize();
      screenfull.toggle(this._container);
    }
  },

  _preResize: function _preResize() {},

  _initContainer: function _initContainer(id) {
    var container = this._container = get$1(id);

    if (!container) {
      throw new Error('Reader container not found.');
    } else if (container._cozy_id) {
      throw new Error('Reader container is already initialized.');
    }

    on(container, 'scroll', this._onScroll, this);
    this._containerId = stamp(container);
  },

  _initLayout: function _initLayout() {
    var container = this._container;

    this._fadeAnimated = this.options.fadeAnimation && any3d;

    addClass(container, 'cozy-container' + (touch ? ' cozy-touch' : '') + (retina ? ' cozy-retina' : '') + (ielt9 ? ' cozy-oldie' : '') + (safari ? ' cozy-safari' : '') + (this._fadeAnimated ? ' cozy-fade-anim' : '') + ' cozy-engine-' + this.options.engine + ' cozy-theme-' + this.options.theme);

    var position = getStyle(container, 'position');

    this._initPanes();

    if (!columnCount) {
      this.options.flow = 'scrolled-doc';
    }
  },

  _initPanes: function _initPanes() {
    var self = this;

    var panes = this._panes = {};

    var l = 'cozy-';
    var container = this._container;

    var prefix = 'cozy-module-';

    addClass(container, 'cozy-container');
    panes['top'] = create$1('div', prefix + 'top', container);
    panes['main'] = create$1('div', prefix + 'main', container);
    panes['bottom'] = create$1('div', prefix + 'bottom', container);

    panes['left'] = create$1('div', prefix + 'left', panes['main']);
    panes['book-cover'] = create$1('div', prefix + 'book-cover', panes['main']);
    panes['right'] = create$1('div', prefix + 'right', panes['main']);
    panes['book'] = create$1('div', prefix + 'book', panes['book-cover']);
    panes['loader'] = create$1('div', prefix + 'book-loading', panes['book']);
    panes['epub'] = create$1('div', prefix + 'book-epub', panes['book']);
    this._initBookLoader();
  },

  _checkIfLoaded: function _checkIfLoaded() {
    if (!this._loaded) {
      throw new Error('Set map center and zoom first.');
    }
  },

  // DOM event handling

  // @section Interaction events
  _initEvents: function _initEvents(remove$$1) {
    this._targets = {};
    this._targets[stamp(this._container)] = this;

    var onOff = remove$$1 ? off : on;

    // @event click: MouseEvent
    // Fired when the user clicks (or taps) the map.
    // @event dblclick: MouseEvent
    // Fired when the user double-clicks (or double-taps) the map.
    // @event mousedown: MouseEvent
    // Fired when the user pushes the mouse button on the map.
    // @event mouseup: MouseEvent
    // Fired when the user releases the mouse button on the map.
    // @event mouseover: MouseEvent
    // Fired when the mouse enters the map.
    // @event mouseout: MouseEvent
    // Fired when the mouse leaves the map.
    // @event mousemove: MouseEvent
    // Fired while the mouse moves over the map.
    // @event contextmenu: MouseEvent
    // Fired when the user pushes the right mouse button on the map, prevents
    // default browser context menu from showing if there are listeners on
    // this event. Also fired on mobile when the user holds a single touch
    // for a second (also called long press).
    // @event keypress: KeyboardEvent
    // Fired when the user presses a key from the keyboard while the map is focused.
    // onOff(this._container, 'click dblclick mousedown mouseup ' +
    //   'mouseover mouseout mousemove contextmenu keypress', this._handleDOMEvent, this);

    // if (this.options.trackResize) {
    //   var self = this;
    //   var fn = debounce(function(){ self.invalidateSize({}); }, 150);
    //   onOff(window, 'resize', fn, this);
    // }

    if (any3d && this.options.transform3DLimit) {
      (remove$$1 ? this.off : this.on).call(this, 'moveend', this._onMoveEnd);
    }

    var self = this;
    if (screenfull.enabled) {
      screenfull.on('change', function () {
        // setTimeout(function() {
        //   self.invalidateSize({});
        // }, 100);
        console.log('AHOY: Am I fullscreen?', screenfull.isFullscreen ? 'YES' : 'NO');
      });
    }

    self.on("updateLocation", function (location) {
      var location_href = location.start;

      if (self._ignoreHistory) {
        self._ignoreHistory = false;
      } else {
        var tmp_href = window.location.href.split("#");
        tmp_href[1] = location_href.substr(8, location_href.length - 8 - 1);
        history.pushState({ cfi: location_href }, '', tmp_href.join('#'));
      }

      // window.location.hash = '#' + location_href.substr(8, location_href.length - 8 - 1);
    });

    window.addEventListener('popstate', function (event) {
      if (event.isTrusted && event.state !== null) {
        self._ignoreHistory = true;
        self.gotoPage(event.state.cfi);
      }
    });

    document.addEventListener('keydown', function (event) {
      var keyName = event.key;
      var target = event.target;

      // check if the activeElement is ".special-panel"
      var check = document.activeElement;
      while (check.localName != 'body') {
        if (check.classList.contains('special-panel')) {
          return;
        }
        check = check.parentElement;
      }

      var IGNORE_TARGETS = ['input', 'target'];
      if (IGNORE_TARGETS.indexOf(target.localName) >= 0) {
        return;
      }

      self.fire('keyDown', { keyName: keyName, shiftKey: event.shiftKey });
    });

    self.on('keyDown', function (data) {
      switch (data.keyName) {
        case 'ArrowRight':
        case 'PageDown':
          self.next();
          break;
        case 'ArrowLeft':
        case 'PageUp':
          self.prev();
          break;
        case 'Home':
          self._scroll('HOME');
          break;
        case 'End':
          self._scroll('END');
          break;
      }
    });
  },

  // _onResize: function() {
  //   if ( ! this._resizeRequest ) {
  //     this._resizeRequest = Util.requestAnimFrame(function() {
  //       this.invalidateSize({})
  //     }, this);
  //   }
  // },

  _onScroll: function _onScroll() {
    this._container.scrollTop = 0;
    this._container.scrollLeft = 0;
  },

  _handleDOMEvent: function _handleDOMEvent(e) {
    if (!this._loaded || skipped(e)) {
      return;
    }

    var type = e.type === 'keypress' && e.keyCode === 13 ? 'click' : e.type;

    if (type === 'mousedown') {
      // prevents outline when clicking on keyboard-focusable element
      preventOutline(e.target || e.srcElement);
    }

    this._fireDOMEvent(e, type);
  },

  _fireDOMEvent: function _fireDOMEvent(e, type, targets) {

    if (e.type === 'click') {
      // Fire a synthetic 'preclick' event which propagates up (mainly for closing popups).
      // @event preclick: MouseEvent
      // Fired before mouse click on the map (sometimes useful when you
      // want something to happen on click before any existing click
      // handlers start running).
      var synth = extend({}, e);
      synth.type = 'preclick';
      this._fireDOMEvent(synth, synth.type, targets);
    }

    if (e._stopped) {
      return;
    }

    // Find the layer the event is propagating from and its parents.
    targets = (targets || []).concat(this._findEventTargets(e, type));

    if (!targets.length) {
      return;
    }

    var target = targets[0];
    if (type === 'contextmenu' && target.listens(type, true)) {
      preventDefault(e);
    }

    var data = {
      originalEvent: e
    };

    if (e.type !== 'keypress') {
      var isMarker = target.options && 'icon' in target.options;
      data.containerPoint = isMarker ? this.latLngToContainerPoint(target.getLatLng()) : this.mouseEventToContainerPoint(e);
      data.layerPoint = this.containerPointToLayerPoint(data.containerPoint);
      data.latlng = isMarker ? target.getLatLng() : this.layerPointToLatLng(data.layerPoint);
    }

    for (var i = 0; i < targets.length; i++) {
      targets[i].fire(type, data, true);
      if (data.originalEvent._stopped || targets[i].options.nonBubblingEvents && indexOf(targets[i].options.nonBubblingEvents, type) !== -1) {
        return;
      }
    }
  },

  getFixedBookPanelSize: function getFixedBookPanelSize() {
    // have to make the book
    var style = window.getComputedStyle(this._panes['book']);
    var h = this._panes['book'].clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    var w = this._panes['book'].clientWidth - parseFloat(style.paddingRight) - parseFloat(style.paddingLeft);
    return { height: Math.floor(h * 1.00), width: Math.floor(w * 1.00) };
  },

  invalidateSize: function invalidateSize(options) {
    // TODO: IS THIS EVER USED?
    var self = this;

    if (!self._drawn) {
      return;
    }

    cancelAnimFrame(this._resizeRequest);

    if (!this._loaded) {
      return this;
    }

    this.fire('resized');
  },

  _resizeBookPane: function _resizeBookPane() {},

  _setupHooks: function _setupHooks() {},

  _checkFeatureCompatibility: function _checkFeatureCompatibility() {
    if (!isPropertySupported('columnCount') || this._checkMobileDevice()) {
      // force
      this.options.flow = 'scrolled-doc';
    }
    if (this._checkMobileDevice()) {
      // this.options.fontSizeLarge = '160%';
      // this.options.fontSizeSmall ='100%';
      // this.options.fontSizeDefault = '120%';
      this.options.text_size = 120;
    }
  },

  _checkMobileDevice: function _checkMobileDevice() {
    if (this._isMobile === undefined) {
      this._isMobile = false;
      if (this.options.mobileMediaQuery) {
        this._isMobile = window.matchMedia(this.options.mobileMediaQuery).matches;
      }
    }
    return this._isMobile;
  },

  _enableBookLoader: function _enableBookLoader() {
    var delay = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 0;

    var self = this;
    self._clearBookLoaderTimeout();
    if (delay < 0) {
      delay = 0;
      self._force_progress = true;
    }
    self._loader_timeout = setTimeout(function () {
      self._panes['loader'].style.display = 'block';
    }, delay);
  },

  _disableBookLoader: function _disableBookLoader() {
    var force = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

    var self = this;
    self._clearBookLoaderTimeout();
    if (!self._force_progress || force) {
      self._panes['loader'].style.display = 'none';
      self._force_progress = false;
      self._panes['loader-status'].innerHTML = '';
    }
  },

  _clearBookLoaderTimeout: function _clearBookLoaderTimeout() {
    var self = this;
    if (self._loader_timeout) {
      clearTimeout(self._loader_timeout);
      self._loader_timeout = null;
    }
  },

  _initBookLoader: function _initBookLoader() {
    // is this not awesome?
    var template$$1 = this.options.loader_template || this.loaderTemplate();

    var body = new DOMParser().parseFromString(template$$1, "text/html").body;
    while (body.children.length) {
      this._panes['loader'].appendChild(body.children[0]);
    }
    this._panes['loader-status'] = create$1('div', 'cozy-module-book-loading-status', this._panes['loader']);
  },

  loaderTemplate: function loaderTemplate() {
    return '<div class="cozy-loader-spinner">\n    <div class="spinner-backdrop spinner-backdrop--1"></div>\n    <div class="spinner-backdrop spinner-backdrop--2"></div>\n    <div class="spinner-backdrop spinner-backdrop--3"></div>\n    <div class="spinner-backdrop spinner-backdrop--4"></div>\n    <div class="spinner-quarter spinner-quarter--1"></div>\n    <div class="spinner-quarter spinner-quarter--2"></div>\n    <div class="spinner-quarter spinner-quarter--3"></div>\n    <div class="spinner-quarter spinner-quarter--4"></div>\n  </div>';
  },

  EOT: true
});

/*
 * @class Control
 * @aka L.Control
 * @inherits Class
 *
 * L.Control is a base class for implementing reader controls. Handles regioning.
 * All other controls extend from this class.
 */

var Control = Class.extend({
    // @section
    // @aka Control options
    options: {
        // @option region: String = 'topright'
        // The region of the control (one of the reader corners). Possible values are `'topleft'`,
        // `'topright'`, `'bottomleft'` or `'bottomright'`
    },

    initialize: function initialize(options) {
        setOptions(this, options);
        if (options.container) {
            this._container = options.container;
            this._locked = true;
        }
        this._id = new Date().getTime() + '-' + parseInt(Math.random(new Date().getTime()) * 1000, 10);
    },

    /* @section
     * Classes extending L.Control will inherit the following methods:
     *
     * @method getRegion: string
     * Returns the region of the control.
     */
    getRegion: function getRegion() {
        return this.options.region;
    },

    // @method setRegion(region: string): this
    // Sets the region of the control.
    setRegion: function setRegion(region) {
        var reader = this._reader;

        if (reader) {
            reader.removeControl(this);
        }

        this.options.region = region;

        if (reader) {
            reader.addControl(this);
        }

        return this;
    },

    // @method getContainer: HTMLElement
    // Returns the HTMLElement that contains the control.
    getContainer: function getContainer() {
        return this._container;
    },

    // @method addTo(reader: Map): this
    // Adds the control to the given reader.
    addTo: function addTo(reader) {
        this.remove();
        this._reader = reader;

        var container = this._container = this.onAdd(reader);

        addClass(container, 'cozy-control');

        if (!this._locked) {
            var region = this.getRegion();
            var area = reader.getControlRegion(region);
            area.appendChild(container);
        }

        return this;
    },

    // @method remove: this
    // Removes the control from the reader it is currently active on.
    remove: function remove$$1() {
        if (!this._reader) {
            return this;
        }

        if (!this._container) {
            return this;
        }

        if (!this._locked) {
            remove(this._container);
        }

        if (this.onRemove) {
            this.onRemove(this._reader);
        }

        this._reader = null;

        return this;
    },

    _refocusOnMap: function _refocusOnMap(e) {
        // if reader exists and event is not a keyboard event
        if (this._reader && e && e.screenX > 0 && e.screenY > 0) {
            this._reader.getContainer().focus();
        }
    },

    _className: function _className(widget) {
        var className = ['cozy-control'];
        if (this.options.direction) {
            className.push('cozy-control-' + this.options.direction);
        }
        if (widget) {
            className.push('cozy-control-' + widget);
        }
        return className.join(' ');
    }
});

var control = function control(options) {
    return new Control(options);
};

/* @section Extension methods
 * @uninheritable
 *
 * Every control should extend from `L.Control` and (re-)implement the following methods.
 *
 * @method onAdd(reader: Map): HTMLElement
 * Should return the container DOM element for the control and add listeners on relevant reader events. Called on [`control.addTo(reader)`](#control-addTo).
 *
 * @method onRemove(reader: Map)
 * Optional method. Should contain all clean up code that removes the listeners previously added in [`onAdd`](#control-onadd). Called on [`control.remove()`](#control-remove).
 */

/* @namespace Map
 * @section Methods for Layers and Controls
 */
Reader.include({
    // @method addControl(control: Control): this
    // Adds the given control to the reader
    addControl: function addControl(control) {
        control.addTo(this);
        return this;
    },

    // @method removeControl(control: Control): this
    // Removes the given control from the reader
    removeControl: function removeControl(control) {
        control.remove();
        return this;
    },

    getControlContainer: function getControlContainer() {
        var l = 'cozy-';
        if (!this._controlContainer) {
            this._controlContainer = create$1('div', l + 'control-container', this._container);
        }
        return this._controlContainer;
    },

    getControlRegion: function getControlRegion(target) {

        if (!this._panes[target]) {
            // target is dot-delimited string
            // first dot is the panel
            var parts = target.split('.');
            var tmp = [];
            var parent = this._container;
            var x = 0;
            while (parts.length) {
                var slug = parts.shift();
                tmp.push(slug);
                var panel = tmp.join(".");
                var className = 'cozy-panel-' + slug;
                if (!this._panes[panel]) {
                    this._panes[panel] = create$1('div', className, parent);
                }
                parent = this._panes[panel];
                x += 1;
                if (x > 100) {
                    break;
                }
            }
        }
        return this._panes[target];
    },

    getControlRegion_1: function getControlRegion_1(target) {

        var tmp = target.split('.');
        var region = tmp.shift();
        var slot = tmp.pop() || '-slot';

        var container = this._panes[region];
        if (!this._panes[target]) {
            var className = 'cozy-' + region + '--item cozy-slot-' + slot;
            if (!this._panes[region + '.' + slot]) {
                var div = create$1('div', className);
                if (slot == 'left' || slot == 'bottom') {
                    var childElement = this._panes[region].firstChild;
                    this._panes[region].insertBefore(div, childElement);
                } else {
                    this._panes[region].appendChild(div);
                }
                this._panes[region + '.' + slot] = div;
            }
            className = this._classify(tmp);
            this._panes[target] = create$1('div', className, this._panes[region + '.' + slot]);
        }

        return this._panes[target];
    },

    _classify: function _classify(tmp) {
        var l = 'cozy-';
        var className = [];
        for (var i in tmp) {
            className.push(l + tmp[i]);
        }
        className = className.join(' ');
        return className;
    },

    _clearControlRegion: function _clearControlRegion() {
        for (var i in this._controlRegions) {
            remove(this._controlRegions[i]);
        }
        remove(this._controlContainer);
        delete this._controlRegions;
        delete this._controlContainer;
    }
});

var PageControl = Control.extend({
  onAdd: function onAdd(reader) {
    var container = this._container;
    if (container) {
      this._control = container.querySelector("[data-target=" + this.options.direction + "]");
    } else {

      var className = this._className(),
          options = this.options;
      container = create$1('div', className), this._control = this._createButton(this._fill(options.html || options.label), this._fill(options.label), className, container);
    }
    this._bindEvents();

    return container;
  },

  _createButton: function _createButton(html, title, className, container) {
    var link = create$1('a', className, container);
    link.innerHTML = html;
    link.href = '#';
    link.title = title;

    /*
     * Will force screen readers like VoiceOver to read this as "Zoom in - button"
     */
    link.setAttribute('role', 'button');
    link.setAttribute('aria-label', title);

    return link;
  },

  _bindEvents: function _bindEvents() {
    var self = this;
    disableClickPropagation(this._control);
    on(this._control, 'click', stop);
    on(this._control, 'click', this._action, this);

    this._reader.on('reopen', function (data) {
      // update the button text / titles
      var html = self.options.html || self.options.label;
      self._control.innerHTML = self._fill(html);
      self._control.setAttribute('title', self._fill(self.options.label));
      self._control.setAttribute('aria-label', self._fill(self.options.label));
    });
  },

  _unit: function _unit() {
    return this._reader.options.flow == 'scrolled-doc' ? 'Section' : 'Page';
  },

  _fill: function _fill(s) {
    var unit = this._unit();
    return s.replace(/\$\{unit\}/g, unit);
  },

  _label: function _label() {
    return this.options.label + " " + (this._reader.options.flow == 'scrolled-doc') ? 'Section' : 'Page';
  },

  EOT: true
});

var PagePrevious = PageControl.extend({
  options: {
    region: 'edge.left',
    direction: 'previous',
    label: 'Previous ${unit}',
    html: '<i class="icon-chevron-left oi" data-glyph="chevron-left" title="Previous ${unit}" aria-hidden="true"></i>'
  },

  _action: function _action(e) {
    this._reader.prev();
  }
});

var PageNext = PageControl.extend({
  options: {
    region: 'edge.right',
    direction: 'next',
    label: 'Next ${unit}',
    html: '<i class="icon-chevron-right oi" data-glyph="chevron-right" title="Next ${unit}" aria-hidden="true"></i>'
  },

  _action: function _action(e) {
    this._reader.next();
  }
});

var PageFirst = PageControl.extend({
  options: {
    direction: 'first',
    label: 'First ${unit}'
  },
  _action: function _action(e) {
    this._reader.first();
  }
});

var PageLast = PageControl.extend({
  options: {
    direction: 'last',
    label: 'Last ${unit}'
  },
  _action: function _action(e) {
    this._reader.last();
  }
});

var pageNext = function pageNext(options) {
  return new PageNext(options);
};

var pagePrevious = function pagePrevious(options) {
  return new PagePrevious(options);
};

var pageFirst = function pageFirst(options) {
  return new PageFirst(options);
};

var pageLast = function pageLast(options) {
  return new PageLast(options);
};

var activeModal;
// from https://github.com/ghosh/micromodal/blob/master/src/index.js
var FOCUSABLE_ELEMENTS = ['a[href]', 'area[href]', 'input:not([disabled]):not([type="hidden"])', 'select:not([disabled])', 'textarea:not([disabled])', 'button:not([disabled])', 'iframe', 'object', 'embed', '[contenteditable]', '[tabindex]:not([tabindex^="-"])'];

var ACTIONABLE_ELEMENTS = ['a[href]', 'area[href]', 'input[type="submit"]:not([disabled])', 'button:not([disabled])'];

var Modal = Class.extend({
  options: {
    // @option region: String = 'topright'
    // The region of the control (one of the reader edges). Possible values are `'left' ad 'right'`
    region: 'left',
    fraction: 0,
    width: null,
    className: {},
    actions: null,
    callbacks: { onShow: function onShow() {}, onClose: function onClose() {} },
    handlers: {}
  },

  initialize: function initialize(options) {
    options = setOptions(this, options);
    this._id = new Date().getTime() + '-' + parseInt(Math.random(new Date().getTime()) * 1000, 10);
    this._initializedEvents = false;
    this.callbacks = assign_1({}, this.options.callbacks);
    this.actions = this.options.actions ? assign_1({}, this.options.actions) : null;
    this.handlers = assign_1({}, this.options.handlers);
    if (typeof this.options.className == 'string') {
      this.options.className = { container: this.options.className };
    }
  },

  addTo: function addTo(reader) {
    var self = this;
    this._reader = reader;
    var template$$1 = this.options.template;

    var panelHTML = '<div class="cozy-modal modal-slide ' + (this.options.region || 'left') + '" id="modal-' + this._id + '" aria-labelledby="modal-' + this._id + '-title" role="dialog" aria-describedby="modal-' + this._id + '-content" aria-hidden="true">\n      <div class="modal__overlay" tabindex="-1" data-modal-close>\n        <div class="modal__container ' + (this.options.className.container ? this.options.className.container : '') + '" role="dialog" aria-modal="true" aria-labelledby="modal-' + this._id + '-title" aria-describedby="modal-' + this._id + '-content" id="modal-' + this._id + '-container">\n          <div role="document">\n            <header class="modal__header">\n              <h3 class="modal__title" id="modal-' + this._id + '-title">' + this.options.title + '</h3>\n              <button class="modal__close" aria-label="Close modal" aria-controls="modal-' + this._id + '-container" data-modal-close></button>\n            </header>\n            <main class="modal__content ' + (this.options.className.main ? this.options.className.main : '') + '" id="modal-' + this._id + '-content">\n              ' + template$$1 + '\n            </main>';

    if (this.options.actions) {
      panelHTML += '<footer class="modal__footer">';
      for (var i in this.options.actions) {
        var action = this.options.actions[i];
        var button_cls = action.className || 'button--default';
        panelHTML += '<button id="action-' + this._id + '-' + i + '" class="button button--lg ' + button_cls + '">' + action.label + '</button>';
      }
      panelHTML += '</footer>';
    }

    panelHTML += '</div></div></div></div>';

    var body = new DOMParser().parseFromString(panelHTML, "text/html").body;

    this.modal = reader._container.appendChild(body.children[0]);
    this._container = this.modal; // compatibility

    this.container = this.modal.querySelector('.modal__container');
    this._bindEvents();
    return this;
  },

  _bindEvents: function _bindEvents() {
    var _this = this;

    var self = this;
    this.onClick = this.onClick.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
    this.onModalTransition = this.onModalTransition.bind(this);

    this.modal.addEventListener('transitionend', function () {}.bind(this));

    // bind any actions
    if (this.actions) {
      var _loop = function _loop() {
        var action = _this.actions[i];
        var button_id = '#action-' + _this._id + '-' + i;
        var button = _this.modal.querySelector(button_id);
        if (button) {
          on(button, 'click', function (event) {
            event.preventDefault();
            action.callback(event);
            if (action.close) {
              self.closeModal();
            }
          });
        }
      };

      for (var i in this.actions) {
        _loop();
      }
    }
  },

  deactivate: function deactivate() {
    this.closeModal();
  },

  closeModal: function closeModal() {
    var self = this;
    this.modal.setAttribute('aria-hidden', 'true');
    this.removeEventListeners();
    if (this.activeElement) {
      this.activeElement.focus();
    }
    this.callbacks.onClose(this.modal);
  },

  showModal: function showModal() {
    this.activeElement = document.activeElement;
    this._resize();
    this.modal.setAttribute('aria-hidden', 'false');
    this.setFocusToFirstNode();
    this.addEventListeners();
    this.callbacks.onShow(this.modal);
  },

  activate: function activate() {
    return this.showModal();
    var self = this;
    activeModal = this;
    addClass(self._reader._container, 'st-modal-activating');
    this._resize();
    addClass(this._reader._container, 'st-modal-open');
    setTimeout(function () {
      addClass(self._container, 'active');
      removeClass(self._reader._container, 'st-modal-activating');
      self._container.setAttribute('aria-hidden', 'false');
      self.setFocusToFirstNode();
    }, 25);
  },

  addEventListeners: function addEventListeners() {
    // --- do we need touch listeners?
    // this.modal.addEventListener('touchstart', this.onClick)
    // this.modal.addEventListener('touchend', this.onClick)
    this.modal.addEventListener('click', this.onClick);
    document.addEventListener('keydown', this.onKeydown);
    'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend'.split(' ').forEach(function (event) {
      this.modal.addEventListener(event, this.onModalTransition);
    }.bind(this));
  },

  removeEventListeners: function removeEventListeners() {
    this.modal.removeEventListener('touchstart', this.onClick);
    this.modal.removeEventListener('click', this.onClick);
    'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend'.split(' ').forEach(function (event) {
      this.modal.removeEventListener(event, this.onModalTransition);
    }.bind(this));
    document.removeEventListener('keydown', this.onKeydown);
  },

  _resize: function _resize() {
    var container = this._reader._container;
    this.container.style.height = container.offsetHeight + 'px';
    console.log("AHOY MODAL", this.container.style.height);
    if (!this.options.className.container) {
      this.container.style.width = this.options.width || parseInt(container.offsetWidth * this.options.fraction) + 'px';
    }

    var header = this.container.querySelector('header');
    var footer = this.container.querySelector('footer');
    var main = this.container.querySelector('main');
    var height = this.container.clientHeight - header.clientHeight;
    if (footer) {
      height -= footer.clientHeight;
    }
    main.style.height = height + 'px';
  },

  getFocusableNodes: function getFocusableNodes() {
    var nodes = this.modal.querySelectorAll(FOCUSABLE_ELEMENTS);
    return Object.keys(nodes).map(function (key) {
      return nodes[key];
    });
  },

  setFocusToFirstNode: function setFocusToFirstNode() {
    var focusableNodes = this.getFocusableNodes();
    if (focusableNodes.length) {
      focusableNodes[0].focus();
    } else {
      activeModal._container.focus();
    }
  },

  getActionableNodes: function getActionableNodes() {
    var nodes = this.modal.querySelectorAll(ACTIONABLE_ELEMENTS);
    return Object.keys(nodes).map(function (key) {
      return nodes[key];
    });
  },

  onKeydown: function onKeydown(event) {
    if (event.keyCode == 27) {
      this.closeModal();
    }
    if (event.keyCode == 9) {
      this.maintainFocus(event);
    }
  },

  onClick: function onClick(event) {

    var closeAfterAction = false;
    var target = event.target;

    // As far as I can tell, the code below isn't catching direct clicks on
    // items with class='data-modal-close' as they're not ACTIONABLE_ELEMENTS.
    // Adding them to ACTIONABLE_ELEMENTS causes undesirable behavior where
    // their child items also close the modal thanks to the loop below.
    // Children of .modal__overlay include the modal header, border area and
    // padding. We don't want clicks on these closing the modal.
    // Just close the modal now for direct clicks on a '.data-modal-close'.
    if (target.hasAttribute('data-modal-close')) {
      this.closeModal();
      return;
    }

    // if the target isn't an actionable type, walk the DOM until
    // one is found
    var actionableNodes = this.getActionableNodes();
    while (actionableNodes.indexOf(target) < 0 && target != this.modal) {
      target = target.parentElement;
    }

    // no target found, punt
    if (actionableNodes.indexOf(target) < 0) {
      return;
    }

    if (this.handlers.click) {
      var did_match = false;
      for (var selector in this.handlers.click) {
        if (target.matches(selector)) {
          closeAfterAction = this.handlers.click[selector](this, target);
          break;
        }
      }
    }

    if (closeAfterAction || target.hasAttribute('data-modal-close')) this.closeModal();

    event.preventDefault();
  },

  onModalTransition: function onModalTransition(event) {
    if (this.modal.getAttribute('aria-hidden') == 'true') {
      this._reader.fire('modal-closed');
    } else {
      this._reader.fire('modal-opened');
    }
  },

  on: function on$$1(event, selector, handler) {
    if (!this.handlers[event]) {
      this.handlers[event] = {};
    }
    this.handlers[event][selector] = handler;
  },

  maintainFocus: function maintainFocus(event) {
    var focusableNodes = this.getFocusableNodes();
    var focusedItemIndex = focusableNodes.indexOf(document.activeElement);
    if (event.shiftKey && focusedItemIndex === 0) {
      focusableNodes[focusableNodes.length - 1].focus();
      event.preventDefault();
    }

    if (!event.shiftKey && focusedItemIndex === focusableNodes.length - 1) {
      focusableNodes[0].focus();
      event.preventDefault();
    }
  },

  EOT: true
});

Reader.include({
  modal: function modal(options) {
    var modal = new Modal(options);
    return modal.addTo(this);
    // return this;
  },

  EOT: true
});

var Contents = Control.extend({

  defaultTemplate: '<button class="button--sm" data-toggle="open" aria-label="Table of Contents"><i class="icon-menu oi" data-glyph="menu" title="Table of Contents" aria-hidden="true"></i></button>',

  onAdd: function onAdd(reader) {
    var self = this;
    var container = this._container;
    if (container) {
      this._control = container.querySelector("[data-target=" + this.options.direction + "]");
    } else {

      var className = this._className(),
          options = this.options;

      container = create$1('div', className);

      var template = this.options.template || this.defaultTemplate;

      var body = new DOMParser().parseFromString(template, "text/html").body;
      while (body.children.length) {
        container.appendChild(body.children[0]);
      }
    }

    this._control = container.querySelector("[data-toggle=open]");
    this._control.setAttribute('id', 'action-' + this._id);
    container.style.position = 'relative';

    this._reader.on('updateContents', function (data) {

      on(this._control, 'click', function (event) {
        event.preventDefault();
        self._modal.activate();
      }, this);

      this._modal = this._reader.modal({
        template: '<ul></ul>',
        title: 'Contents',
        region: 'left',
        className: 'cozy-modal-contents'
      });

      this._modal.on('click', 'a[href]', function (modal, target) {
        target = target.getAttribute('data-href');
        this._reader.gotoPage(target);
        return true;
      }.bind(this));

      this._setupSkipLink();

      var parent = self._modal._container.querySelector('ul');
      // var s = data.toc.filter(function(value) { return value.parent == null }).map(function(value) { return [ value, 0, parent ] });
      // while ( s.length ) {
      //   var tuple = s.shift();
      //   var chapter = tuple[0];
      //   var tabindex = tuple[1];
      //   var parent = tuple[2];

      //   var option = self._createOption(chapter, tabindex, parent);
      //   data.toc.filter(function(value) { return value.parent == chapter.id }).reverse().forEach(function(chapter_) {
      //     s.unshift([chapter_, tabindex + 1, option]);
      //   });
      // }
      var _process = function _process(items, tabindex, parent) {
        items.forEach(function (item) {
          var option = self._createOption(item, tabindex, parent);
          if (item.subitems.length) {
            _process(item.subitems, tabindex + 1, option);
          }
        });
      };
      _process(data.toc, 0, parent);
    }.bind(this));

    return container;
  },

  _createOption: function _createOption(chapter, tabindex, parent) {

    var option = create$1('li');
    if (chapter.href) {
      var anchor = create$1('a', null, option);
      anchor.textContent = chapter.label;
      // var tab = pad('', tabindex); tab = tab.length ? tab + ' ' : '';
      // option.textContent = tab + chapter.label;
      anchor.setAttribute('href', chapter.href);
      anchor.setAttribute('data-href', chapter.href);
    } else {
      var span = create$1('span', null, option);
      span.textContent = chapter.label;
    }

    if (parent.tagName == 'LI') {
      // need to nest
      var tmp = parent.querySelector('ul');
      if (!tmp) {
        tmp = create$1('ul', null, parent);
      }
      parent = tmp;
    }

    parent.appendChild(option);
    return option;
  },


  _setupSkipLink: function _setupSkipLink() {
    if (!this.options.skipLink) {
      return;
    }

    var target = document.querySelector(this.options.skipLink);
    if (!target) {
      return;
    }

    var link = document.createElement('a');
    link.textContent = 'Skip to contents';
    link.setAttribute('href', '#action-' + this._id);

    var ul = target.querySelector('ul');
    if (ul) {
      // add to list
      target = document.createElement('li');
      ul.appendChild(target);
    }
    target.appendChild(link);
    link.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      this._control.click();
    }.bind(this));
  },

  EOT: true
});

var contents = function contents(options) {
  return new Contents(options);
};

// Title + Chapter

var Title = Control.extend({
  onAdd: function onAdd(reader) {
    var self = this;
    var className = this._className(),
        container = create$1('div', className),
        options = this.options;

    // var template = '<h1><span class="cozy-title">Contents: </span><select size="1" name="contents"></select></label>';
    // var control = new DOMParser().parseFromString(template, "text/html").body.firstChild;

    var h1 = create$1('h1', 'cozy-h1', container);
    setOpacity(h1, 0);
    this._title = create$1('span', 'cozy-title', h1);
    this._divider = create$1('span', 'cozy-divider', h1);
    this._divider.textContent = " · ";
    this._section = create$1('span', 'cozy-section', h1);

    // --- TODO: disable until we can work out how to 
    // --- more reliably match the current section to the contents
    // this._reader.on('updateSection', function(data) {
    //   if ( data && data.label ) {
    //     self._section.textContent = data.label;
    //     DomUtil.setOpacity(self._section, 1.0);
    //     DomUtil.setOpacity(self._divider, 1.0);
    //   } else {
    //     DomUtil.setOpacity(self._section, 0);
    //     DomUtil.setOpacity(self._divider, 0);
    //   }
    // })

    this._reader.on('updateTitle', function (data) {
      if (data) {
        self._title.textContent = data.title || data.bookTitle;
        setOpacity(self._section, 0);
        setOpacity(self._divider, 0);
        setOpacity(h1, 1);
      }
    });

    return container;
  },

  _createButton: function _createButton(html, title, className, container, fn) {
    var link = create$1('a', className, container);
    link.innerHTML = html;
    link.href = '#';
    link.title = title;

    /*
     * Will force screen readers like VoiceOver to read this as "Zoom in - button"
     */
    link.setAttribute('role', 'button');
    link.setAttribute('aria-label', title);

    disableClickPropagation(link);
    on(link, 'click', stop);
    on(link, 'click', fn, this);
    // DomEvent.on(link, 'click', this._refocusOnMap, this);

    return link;
  },

  EOT: true
});

var title = function title(options) {
  return new Title(options);
};

// Title + Chapter

var PublicationMetadata = Control.extend({
  onAdd: function onAdd(reader) {
    var self = this;
    var className = this._className(),
        container = create$1('div', className),
        options = this.options;

    // var template = '<h1><span class="cozy-title">Contents: </span><select size="1" name="contents"></select></label>';
    // var control = new DOMParser().parseFromString(template, "text/html").body.firstChild;

    this._publisher = create$1('div', 'cozy-publisher', container);
    this._rights = create$1('div', 'cozy-rights', container);

    this._reader.on('updateTitle', function (data) {
      if (data) {
        self._publisher.textContent = data.publisher;
        self._rights.textContent = data.rights;
      }
    });

    return container;
  },

  _createButton: function _createButton(html, title, className, container, fn) {
    var link = create$1('a', className, container);
    link.innerHTML = html;
    link.href = '#';
    link.title = title;

    /*
     * Will force screen readers like VoiceOver to read this as "Zoom in - button"
     */
    link.setAttribute('role', 'button');
    link.setAttribute('aria-label', title);

    disableClickPropagation(link);
    on(link, 'click', stop);
    on(link, 'click', fn, this);
    // DomEvent.on(link, 'click', this._refocusOnMap, this);

    return link;
  },

  EOT: true
});

var publicationMetadata = function publicationMetadata(options) {
  return new PublicationMetadata(options);
};

var Preferences = Control.extend({
  options: {
    label: 'Preferences',
    hasThemes: false,
    html: '<i class="icon-cog oi" data-glyph="cog" title="Preferences and Settings" aria-hidden="true"></i>'
  },

  onAdd: function onAdd(reader) {
    var self = this;
    var className = this._className('preferences'),
        container = create$1('div', className),
        options = this.options;

    this._activated = false;
    this._control = this._createButton(options.html || options.label, options.label, className, container, this._action);

    // self.initializeForm();
    this._modal = this._reader.modal({
      // template: '<form></form>',
      title: 'Preferences',
      className: 'cozy-modal-preferences',
      actions: [{
        label: 'Save Changes',
        callback: function callback(event) {
          self.updatePreferences(event);
        }
      }],
      region: 'right'
    });

    return container;
  },

  _action: function _action() {
    var self = this;
    self.initializeForm();
    self._modal.activate();
  },

  _createButton: function _createButton(html, title, className, container, fn) {
    var link = create$1('button', className, container);
    link.innerHTML = html;
    link.title = title;

    /*
     * Will force screen readers like VoiceOver to read this as "Zoom in - button"
     */
    link.setAttribute('role', 'button');
    link.setAttribute('aria-label', title);

    disableClickPropagation(link);
    on(link, 'click', stop);
    on(link, 'click', fn, this);

    return link;
  },

  _createPanel: function _createPanel() {
    var self = this;
    if (this._modal._container.querySelector('form')) {
      return;
    }

    var template$$1 = '';

    var possible_fieldsets = [];
    if (this._reader.metadata.layout == 'pre-paginated') {
      // different panel
    } else {
      possible_fieldsets.push('TextSize');
    }
    possible_fieldsets.push('Display');

    if (this._reader.rootfiles && this._reader.rootfiles.length > 1) {
      // this.options.hasPackagePaths = true;
      possible_fieldsets.push('Rendition');
    }

    if (this._reader.options.themes && this._reader.options.themes.length > 0) {
      this.options.hasThemes = true;
      possible_fieldsets.push('Theme');
    }

    this._fieldsets = [];
    possible_fieldsets.forEach(function (cls) {
      var fieldset = new Preferences.fieldset[cls](this);
      template$$1 += fieldset.template();
      this._fieldsets.push(fieldset);
    }.bind(this));

    if (this.options.fields) {
      this.options.hasFields = true;
      for (var i in this.options.fields) {
        var field = this.options.fields[i];
        var id = "preferences-custom-" + i;
        template$$1 += '<fieldset class="custom-field">\n          <legend>' + field.label + '</legend>\n        ';
        for (var j in field.inputs) {
          var input = field.inputs[j];
          var checked = input.value == field.value ? ' checked="checked"' : '';
          template$$1 += '<label><input id="preferences-custom-' + i + '-' + j + '" type="radio" name="x' + field.name + '" value="' + input.value + '" ' + checked + '/>' + input.label + '</label>';
        }
        if (field.hint) {
          template$$1 += '<p class="hint" style="font-size: 90%">' + field.hint + '</p>';
        }
      }
    }

    template$$1 = '<form>' + template$$1 + '</form>';

    // this._modal = this._reader.modal({
    //   template: template,
    //   title: 'Preferences',
    //   className: 'cozy-modal-preferences',
    //   actions: [
    //     {
    //       label: 'Save Changes',
    //       callback: function(event) {
    //         self.updatePreferences(event);
    //       }
    //     }
    //   ],
    //   region: 'right'
    // });

    this._modal._container.querySelector('main').innerHTML = template$$1;
    this._form = this._modal._container.querySelector('form');
  },

  initializeForm: function initializeForm() {
    this._createPanel();
    this._fieldsets.forEach(function (fieldset) {
      fieldset.initializeForm(this._form);
    }.bind(this));
  },

  updatePreferences: function updatePreferences(event) {
    event.preventDefault();

    var doUpdate = false;
    var new_options = {};
    var saveable_options = {};
    this._fieldsets.forEach(function (fieldset) {
      // doUpdate = doUpdate || fieldset.updateForm(this._form, new_options);
      // assign(new_options, fieldset.updateForm(this._form));
      fieldset.updateForm(this._form, new_options, saveable_options);
    }.bind(this));

    if (this.options.hasFields) {
      for (var i in this.options.fields) {
        var field = this.options.fields[i];
        var id = "preferences-custom-" + i;
        var input = this._form.querySelector('input[name="x' + field.name + '"]:checked');
        if (input.value != field.value) {
          field.value = input.value;
          field.callback(field.value);
        }
      }
    }

    this._modal.deactivate();

    setTimeout(function () {
      this._reader.saveOptions(saveable_options);
      this._reader.reopen(new_options);
    }.bind(this), 100);
  },

  EOT: true
});

Preferences.fieldset = {};

var Fieldset = Class.extend({

  options: {},

  initialize: function initialize(control$$1, options) {
    setOptions(this, options);
    this._control = control$$1;
    this._current = {};
    this._id = new Date().getTime() + '-' + parseInt(Math.random(new Date().getTime()) * 1000, 10);
  },

  template: function template$$1() {},

  EOT: true

});

Preferences.fieldset.TextSize = Fieldset.extend({

  initializeForm: function initializeForm(form) {
    if (!this._input) {
      this._input = form.querySelector('#x' + this._id + '-input');
      this._output = form.querySelector('#x' + this._id + '-output');
      this._preview = form.querySelector('#x' + this._id + '-preview');

      this._input.addEventListener('input', this._updatePreview.bind(this));
      this._input.addEventListener('change', this._updatePreview.bind(this));
    }

    var text_size = this._control._reader.options.text_size || 100;
    if (text_size == 'auto') {
      text_size = 100;
    }
    this._current.text_size = text_size;
    this._input.value = text_size;
    this._updatePreview();
  },

  updateForm: function updateForm(form, options, saveable) {
    // return { text_size: this._input.value };
    options.text_size = saveable.text_size = this._input.value;
    // options.text_size = this._input.value;
    // return ( this._input.value != this._current.text_size );
  },

  template: function template$$1() {
    return '<fieldset class="cozy-fieldset-text_size">\n        <legend>Text Size</legend>\n        <div class="preview--text_size" id="x' + this._id + '-preview">\n          \u2018Yes, that\u2019s it,\u2019 said the Hatter with a sigh: \u2018it\u2019s always tea-time, and we\u2019ve no time to wash the things between whiles.\u2019\n        </div>\n        <p style="white-space: no-wrap">\n          <span>T-</span>\n          <input name="text_size" type="range" id="x' + this._id + '-input" value="100" min="50" max="400" step="10" style="width: 75%; display: inline-block" />\n          <span>T+</span>\n        </p>\n        <p>\n          <span>Text Size: </span>\n          <output for="preferences-input-text_size" id="x' + this._id + '-output">100</output>\n        </p>\n      </fieldset>';
  },

  _updatePreview: function _updatePreview() {
    this._preview.style.fontSize = parseInt(this._input.value, 10) / 100 + 'em';
    this._output.value = this._input.value + '%';
  },

  EOT: true

});

Preferences.fieldset.Display = Fieldset.extend({

  initializeForm: function initializeForm(form) {
    var flow = this._control._reader.options.flow || this._control._reader.metadata.flow || 'auto';
    // if ( flow == 'auto' ) { flow = 'paginated'; }

    var input = form.querySelector('#x' + this._id + '-input-' + flow);
    input.checked = true;
    this._current.flow = flow;
  },

  updateForm: function updateForm(form, options, saveable) {
    var input = form.querySelector('input[name="x' + this._id + '-flow"]:checked');
    options.flow = input.value;
    if (options.flow != 'auto') {
      saveable.flow = options.flow;
    }
    // if ( input.value == 'auto' ) {
    //   // we do NOT want to save flow as a preference
    //   return {};
    // }
    // return { flow: input.value };
  },

  template: function template$$1() {
    var scrolled_help = '';
    if (this._control._reader.metadata.layout != 'pre-paginated') {
      scrolled_help = "<br /><small>This is an experimental feature that may cause display and loading issues for the book when enabled.</small>";
    }
    return '<fieldset>\n            <legend>Display</legend>\n            <label><input name="x' + this._id + '-flow" type="radio" id="x' + this._id + '-input-auto" value="auto" /> Auto<br /><small>Let the reader determine display mode based on your browser dimensions and the type of content you\'re reading</small></label>\n            <label><input name="x' + this._id + '-flow" type="radio" id="x' + this._id + '-input-paginated" value="paginated" /> Page-by-Page</label>\n            <label><input name="x' + this._id + '-flow" type="radio" id="x' + this._id + '-input-scrolled-doc" value="scrolled-doc" /> Scroll' + scrolled_help + '</label>\n          </fieldset>';
  },

  EOT: true

});

Preferences.fieldset.Theme = Fieldset.extend({

  initializeForm: function initializeForm(form) {
    var theme = this._control._reader.options.theme || 'default';

    var input = form.querySelector('#x' + this._id + '-input-theme-' + theme);
    input.checked = true;
    this._current.theme = theme;
  },

  updateForm: function updateForm(form, options, saveable) {
    var input = form.querySelector('input[name="x' + this._id + '-theme"]:checked');
    options.theme = saveable.theme = input.value;
    // return { theme: input.value };
  },

  template: function template$$1() {
    var template$$1 = '<fieldset>\n            <legend>Theme</legend>\n            <label><input name="x' + this._id + '-theme" type="radio" id="x' + this._id + '-input-theme-default" value="default" />Default</label>';

    this._control._reader.options.themes.forEach(function (theme) {
      template$$1 += '<label><input name="x' + this._id + '-theme" type="radio" id="x' + this._id + '-input-theme-' + theme.klass + '" value="' + theme.klass + '" />' + theme.name + '</label>';
    }.bind(this));

    template$$1 += '</fieldset>';

    return template$$1;
  },

  EOT: true

});

Preferences.fieldset.Rendition = Fieldset.extend({

  initializeForm: function initializeForm(form) {
    var rootfiles = this._control._reader.rootfiles;
    var rootfilePath = this._control._reader.options.rootfilePath;
    var expr = rootfilePath ? '[value="' + rootfilePath + '"]' : ":first-child";
    var input = form.querySelector('input[name="x' + this._id + '-rootfilePath"]' + expr);
    input.checked = true;
    this._current.rootfilePath = rootfilePath || rootfiles[0].rootfilePath;
  },

  updateForm: function updateForm(form, options, saveable) {
    var input = form.querySelector('input[name="x' + this._id + '-rootfilePath"]:checked');
    if (input.value != this._current.rootfilePath) {
      options.rootfilePath = input.value;
      this._current.rootfilePath = input.value;
    }
  },

  template: function template$$1() {
    var template$$1 = '<fieldset>\n            <legend>Rendition</legend>\n    ';

    this._control._reader.rootfiles.forEach(function (rootfile, i) {
      template$$1 += '<label><input name="x' + this._id + '-rootfilePath" type="radio" id="x' + this._id + '-input-rootfilePath-' + i + '" value="' + rootfile.rootfilePath + '" />' + (rootfile.label || rootfile.accessMode || rootfile.rootfilePath) + '</label>';
    }.bind(this));

    template$$1 += '</fieldset>';

    return template$$1;
  },

  EOT: true

});

var preferences = function preferences(options) {
  return new Preferences(options);
};

var Widget = Control.extend({

  options: {
    // @option region: String = 'topright'
    // The region of the control (one of the reader corners). Possible values are `'topleft'`,
    // `'topright'`, `'bottomleft'` or `'bottomright'`
  },

  onAdd: function onAdd(reader) {
    var container = this._container;
    if (container) {
      // NOOP
    } else {

      var className = this._className(),
          options = this.options;

      container = create$1('div', className);

      var template = this.options.template || this.defaultTemplate;
      var body = new DOMParser().parseFromString(template, "text/html").body;
      while (body.children.length) {
        container.appendChild(body.children[0]);
      }
    }

    this._onAddExtra(container);
    this._updateTemplate(container);
    this._updateClass(container);
    this._bindEvents(container);

    return container;
  },

  _updateTemplate: function _updateTemplate(container) {
    var data = this.data();
    for (var slot in data) {
      if (data.hasOwnProperty(slot)) {
        var value = data[slot];
        if (typeof value == "function") {
          value = value();
        }
        var node = container.querySelector('[data-slot=' + slot + ']');
        if (node) {
          if (node.hasAttribute('value')) {
            node.setAttribute('value', value);
          } else {
            node.innerHTML = value;
          }
        }
      }
    }
  },

  _updateClass: function _updateClass(container) {
    if (this.options.className) {
      addClass(container, this.options.className);
    }
  },

  _onAddExtra: function _onAddExtra() {},

  _bindEvents: function _bindEvents(container) {
    var control$$1 = container.querySelector("[data-toggle=button]");
    if (!control$$1) {
      return;
    }
    disableClickPropagation(control$$1);
    on(control$$1, 'click', stop);
    on(control$$1, 'click', this._action, this);
  },

  _action: function _action() {},

  data: function data() {
    return this.options.data || {};
  },

  EOT: true
});

Widget.Button = Widget.extend({
  defaultTemplate: '<button data-toggle="button" data-slot="label"></button>',

  _action: function _action() {
    this.options.onClick(this, this._reader);
  },

  EOT: true
});

Widget.Panel = Widget.extend({
  defaultTemplate: '<div><span data-slot="text"></span></div>',

  EOT: true
});

Widget.Toggle = Widget.extend({
  defaultTemplate: '<button data-toggle="button" data-slot="label"></button>',

  _onAddExtra: function _onAddExtra(container) {
    this.state(this.options.states[0].stateName, container);

    return container;
  },

  state: function state(stateName, container) {
    container = container || this._container;
    this._resetState(container);
    this._state = this.options.states.filter(function (s) {
      return s.stateName == stateName;
    })[0];
    this._updateClass(container);
    this._updateTemplate(container);
  },

  _resetState: function _resetState(container) {
    if (!this._state) {
      return;
    }
    if (this._state.className) {
      removeClass(container, this._state.className);
    }
  },

  _updateClass: function _updateClass(container) {
    if (this._state.className) {
      addClass(container, this._state.className);
    }
  },

  _action: function _action() {
    this._state.onClick(this, this._reader);
  },

  data: function data() {
    return this._state.data || {};
  },

  EOT: true
});

// export var widget = function(options) {
//   return new Widget(options);
// }

var widget = {
  button: function button(options) {
    return new Widget.Button(options);
  },
  panel: function panel(options) {
    return new Widget.Panel(options);
  },
  toggle: function toggle(options) {
    return new Widget.Toggle(options);
  }
};

var Citation = Control.extend({
  options: {
    label: 'Citation',
    html: '<span>Get Citation</span>'
  },

  defaultTemplate: '<button class="button--sm cozy-citation" data-toggle="open">Get Citation</button>',

  onAdd: function onAdd(reader) {
    var self = this;
    var container = this._container;
    if (container) {
      this._control = container.querySelector("[data-target=" + this.options.direction + "]");
    } else {

      var className = this._className(),
          options = this.options;

      container = create$1('div', className);

      var template = this.options.template || this.defaultTemplate;

      var body = new DOMParser().parseFromString(template, "text/html").body;
      while (body.children.length) {
        container.appendChild(body.children[0]);
      }
    }

    this._reader.on('updateContents', function (data) {
      self._createPanel();
    });

    this._control = container.querySelector("[data-toggle=open]");
    on(this._control, 'click', function (event) {
      event.preventDefault();
      self._modal.activate();
    }, this);

    return container;
  },

  _action: function _action() {
    var self = this;
    self._modal.activate();
  },

  _createButton: function _createButton(html, title, className, container, fn) {
    var link = create$1('button', className, container);
    link.innerHTML = html;
    link.title = title;

    link.setAttribute('role', 'button');
    link.setAttribute('aria-label', title);

    disableClickPropagation(link);
    on(link, 'click', stop);
    on(link, 'click', fn, this);

    return link;
  },

  _createPanel: function _createPanel() {
    var self = this;

    var template = '<form>\n      <fieldset>\n        <legend>Select Citation Format</legend>\n      </fieldset>\n    </form>\n    <blockquote id="formatted" style="padding: 8px; border-left: 4px solid black; background-color: #fff"></blockquote>\n    <div class="alert alert-info" id="message" style="display: none"></div>';

    this._modal = this._reader.modal({
      template: template,
      title: 'Copy Citation to Clipboard',
      className: 'cozy-modal-citatation',
      actions: [{
        label: 'Copy Citation',
        callback: function callback(event) {
          document.designMode = "on";
          var formatted = self._modal._container.querySelector("#formatted");

          var range = document.createRange();
          range.selectNode(formatted);
          var sel = window.getSelection();
          sel.removeAllRanges();
          sel.addRange(range);

          // formatted.select();

          try {
            var flag = document.execCommand('copy');
          } catch (err) {
            console.log("AHOY COPY FAILED", err);
          }

          self._message.innerHTML = 'Success! Citation copied to your clipboard.';
          self._message.style.display = 'block';
          sel.removeAllRanges();
          range.detach();
          document.designMode = "off";
        }
      }],
      region: 'left',
      fraction: 1.0
    });

    this._form = this._modal._container.querySelector('form');
    var fieldset = this._form.querySelector('fieldset');

    var citations = this.options.citations || this._reader.metadata.citations;

    citations.forEach(function (citation, index) {
      var label = create$1('label', null, fieldset);
      var input = create$1('input', null, label);
      input.setAttribute('name', 'format');
      input.setAttribute('value', citation.format);
      input.setAttribute('type', 'radio');
      if (index == 0) {
        input.setAttribute('checked', 'checked');
      }
      var text = document.createTextNode(" " + citation.format);
      label.appendChild(text);
      input.setAttribute('data-text', citation.text);
    });

    this._formatted = this._modal._container.querySelector("#formatted");
    this._message = this._modal._container.querySelector("#message");
    on(this._form, 'change', function (event) {
      var target = event.target;
      if (target.tagName == 'INPUT') {
        this._initializeForm();
      }
    }, this);

    this._initializeForm();
  },

  _initializeForm: function _initializeForm() {
    var formatted = this._formatCitation();
    this._formatted.innerHTML = formatted;
    this._message.style.display = 'none';
    this._message.innerHTML = '';
  },

  _formatCitation: function _formatCitation(format) {
    if (format == null) {
      var selected = this._form.querySelector("input:checked");
      format = selected.value;
    }
    var selected = this._form.querySelector("input[value=" + format + "]");
    return selected.getAttribute('data-text');
    // return selected.dataset.text;
  },

  EOT: true
});

var citation = function citation(options) {
  return new Citation(options);
};

var Search = Control.extend({
  options: {
    label: 'Search',
    html: '<span>Search</span>'
  },

  defaultTemplate: '<form class="search">\n    <label class="u-screenreader" for="cozy-search-string">Search in this text</label>\n    <input id="cozy-search-string" name="search" type="text" placeholder="Search in this text..."/>\n    <button class="button--sm" data-toggle="open" aria-label="Search"><i class="icon-magnifying-glass oi" data-glyph="magnifying-glass" title="Search" aria-hidden="true"></i></button>\n  </form>',

  onAdd: function onAdd(reader) {
    var self = this;
    var container = this._container;
    if (container) {
      this._control = container.querySelector("[data-target=" + this.options.direction + "]");
    } else {

      var className = this._className(),
          options = this.options;

      container = create$1('div', className);

      var template = this.options.template || this.defaultTemplate;

      var body = new DOMParser().parseFromString(template, "text/html").body;
      while (body.children.length) {
        container.appendChild(body.children[0]);
      }
    }

    this._control = container.querySelector("[data-toggle=open]");
    container.style.position = 'relative';

    this._data = null;
    this._canceled = false;
    this._processing = false;

    this._reader.on('ready', function () {

      this._modal = this._reader.modal({
        template: '<article></article>',
        title: 'Search Results',
        className: { container: 'cozy-modal-search' },
        region: 'left'
      });

      this._modal.callbacks.onClose = function () {
        if (self._processing) {
          self._canceled = true;
        }
      };

      this._article = this._modal._container.querySelector('article');

      this._modal.on('click', 'a[href]', function (modal, target) {
        target = target.getAttribute('href');
        this._reader.gotoPage(target);
        return true;
      }.bind(this));
    }.bind(this));

    on(this._control, 'click', function (event) {
      event.preventDefault();

      var searchString = this._container.querySelector("#cozy-search-string").value;
      searchString = searchString.replace(/^\s*/, '').replace(/\s*$/, '');

      if (!searchString) {
        // just punt
        return;
      }

      if (searchString == this.searchString) {
        // cached results
        self.openModalResults();
      } else {
        this.searchString = searchString;
        self.openModalWaiting();
        self.submitQuery();
      }
    }, this);

    return container;
  },

  openModalWaiting: function openModalWaiting() {
    this._processing = true;
    this._emptyArticle();
    var value = this.searchString;
    this._article.innerHTML = '<p>Submitting query for <em>' + value + '</em>...</p>' + this._reader.loaderTemplate();
    this._modal.activate();
  },

  openModalResults: function openModalResults() {
    if (this._canceled) {
      this._canceled = false;
      return;
    }
    this._buildResults();
    this._modal.activate();
  },

  submitQuery: function submitQuery() {
    var self = this;

    var url = this.options.searchUrl + this.searchString;

    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    request.onload = function () {
      if (this.status >= 200 && this.status < 400) {
        // Success!
        var data = JSON.parse(this.response);
        console.log("SEARCH DATA", data);

        self._data = data;
      } else {
        // We reached our target server, but it returned an error

        self._data = null;
        console.log(this.response);
      }

      self.openModalResults();
    };

    request.onerror = function () {
      // There was a connection error of some sort
      self._data = null;
      self.openModalResults();
    };

    request.send();
  },

  _emptyArticle: function _emptyArticle() {
    while (this._article && this._article.hasChildNodes()) {
      this._article.removeChild(this._article.lastChild);
    }
  },

  _buildResults: function _buildResults() {
    var self = this;
    var content;

    this._processing = false;

    self._emptyArticle();

    var reader = this._reader;
    reader.annotations.reset();

    if (this._data) {
      var highlight = true;
      if (this._data.highlight_off == "yes") {
        highlight = false;
      }
      if (this._data.search_results.length) {
        content = create$1('ul');

        this._data.search_results.forEach(function (result) {
          var option = create$1('li');
          var anchor = create$1('a', null, option);
          var cfiRange = "epubcfi(" + result.cfi + ")";

          if (result.snippet) {
            if (result.title) {
              var chapterTitle = create$1('i');
              chapterTitle.textContent = result.title + ": ";
              anchor.appendChild(chapterTitle);
            }
            anchor.appendChild(document.createTextNode(result.snippet));

            anchor.setAttribute("href", cfiRange);
            content.appendChild(option);
          }
          if (highlight) {
            reader.annotations.highlight(cfiRange);
          }
        });
      } else {
        content = create$1("p");
        content.textContent = 'No results found for "' + self.searchString + '"';
      }
    } else {
      content = create$1("p");
      content.textContent = 'There was a problem processing this query.';
    }

    self._article.appendChild(content);
  },

  EOT: true
});

var search = function search(options) {
  return new Search(options);
};

// Title + Chapter

var BibliographicInformation = Control.extend({
  options: {
    label: 'Info',
    direction: 'left',
    html: '<span class="oi" data-glyph="info">Info</span>'
  },

  defaultTemplate: '<button class="button--sm cozy-bib-info oi" data-glyph="info" data-toggle="open" aria-label="Bibliographic Information"> Info</button>',

  onAdd: function onAdd(reader) {
    var self = this;
    var container = this._container;
    if (container) {
      this._control = container.querySelector("[data-target=" + this.options.direction + "]");
    } else {

      var className = this._className(),
          options = this.options;

      container = create$1('div', className);

      var template = this.options.template || this.defaultTemplate;

      var body = new DOMParser().parseFromString(template, "text/html").body;
      while (body.children.length) {
        container.appendChild(body.children[0]);
      }
    }

    this._reader.on('updateContents', function (data) {
      self._createPanel();
    });

    this._control = container.querySelector("[data-toggle=open]");
    on(this._control, 'click', function (event) {
      event.preventDefault();
      self._modal.activate();
    }, this);

    return container;
  },

  _createPanel: function _createPanel() {
    var self = this;

    var template = '<dl>\n    </dl>';

    this._modal = this._reader.modal({
      template: template,
      title: 'Info',
      region: 'left',
      fraction: 1.0
    });

    var dl = this._modal._container.querySelector('dl');

    var metadata_fields = [['title', 'Title'], ['creator', 'Author'], ['pubdate', 'Publication Date'], ['modified_date', 'Modified Date'], ['publisher', 'Publisher'], ['rights', 'Rights'], ['doi', 'DOI'], ['description', 'Description']];

    var metadata_fields_seen = {};

    var metadata = this._reader.metadata;

    for (var idx in metadata_fields) {
      var key = metadata_fields[idx][0];
      var label = metadata_fields[idx][1];
      if (metadata[key]) {
        var value = metadata[key];
        if (key == 'pubdate' || key == 'modified_date') {
          value = this._formatDate(value);
          if (!value) {
            continue;
          }
          // value = d.toISOString().slice(0,10); // for YYYY-MM-DD
        }
        metadata_fields_seen[key] = true;
        var dt = create$1('dt', 'cozy-bib-info-label', dl);
        dt.innerHTML = label;
        var dd = create$1('dd', 'cozy-bib-info-value cozy-bib-info-value-' + key, dl);
        dd.innerHTML = value;
      }
    }
  },

  _formatDate: function _formatDate(value) {
    var match = value.match(/\d{4}/);
    if (match) {
      return match[0];
    }
    return null;
  },

  EOT: true
});

var bibliographicInformation = function bibliographicInformation(options) {
  return new BibliographicInformation(options);
};

var Download = Control.extend({
  options: {
    label: 'Download Book',
    html: '<span>Download Book</span>'
  },

  defaultTemplate: '<button class="button--sm cozy-download oi" data-toggle="open" data-glyph="data-transfer-download"> Download Book</button>',

  onAdd: function onAdd(reader) {
    var self = this;
    var container = this._container;
    if (container) {
      this._control = container.querySelector("[data-target=" + this.options.direction + "]");
    } else {

      var className = this._className(),
          options = this.options;

      container = create$1('div', className);

      var template = this.options.template || this.defaultTemplate;

      var body = new DOMParser().parseFromString(template, "text/html").body;
      while (body.children.length) {
        container.appendChild(body.children[0]);
      }
    }

    this._reader.on('updateContents', function (data) {
      self._createPanel();
    });

    this._control = container.querySelector("[data-toggle=open]");
    on(this._control, 'click', function (event) {
      event.preventDefault();
      self._modal.activate();
    }, this);

    return container;
  },

  _createPanel: function _createPanel() {
    var self = this;

    var template = '<form>\n      <fieldset>\n        <legend>Choose File Format</legend>\n      </fieldset>\n    </form>';

    this._modal = this._reader.modal({
      template: template,
      title: 'Download Book',
      className: 'cozy-modal-download',
      actions: [{
        label: 'Download',
        callback: function callback(event) {
          var selected = self._form.querySelector("input:checked");
          var href = selected.getAttribute('data-href');
          self._configureDownloadForm(href);
          self._form.submit();
        }
      }],
      region: 'left',
      fraction: 1.0
    });

    this._form = this._modal._container.querySelector('form');
    var fieldset = this._form.querySelector('fieldset');
    this._reader.options.download_links.forEach(function (link, index) {
      var label = create$1('label', null, fieldset);
      var input = create$1('input', null, label);
      input.setAttribute('name', 'format');
      input.setAttribute('value', link.format);
      input.setAttribute('data-href', link.href);
      input.setAttribute('type', 'radio');
      if (index == 0) {
        input.setAttribute('checked', 'checked');
      }
      var text = link.format;
      if (link.size) {
        text += " (" + link.size + ")";
      }
      var text = document.createTextNode(" " + text);
      label.appendChild(text);
    });
  },

  _configureDownloadForm: function _configureDownloadForm(href) {
    var self = this;
    self._form.setAttribute('method', 'GET');
    self._form.setAttribute('action', href);
    self._form.setAttribute('target', '_blank');
  },

  EOT: true
});

var download = function download(options) {
  return new Download(options);
};

var Navigator = Control.extend({
  onAdd: function onAdd(reader) {
    var container = this._container;
    if (container) {} else {

      var className = this._className('navigator'),
          options = this.options;

      container = create$1('div', className);
    }
    this._setup(container);

    this._reader.on('updateLocations', function (locations) {
      // if ( ! this._reader.currentLocation() || ! this._reader.currentLocation().start ) {
      //   console.log("AHOY updateLocations NO START", this._reader.currentLocation().then);
      //   setTimeout(function() {
      //     this._initializeNavigator(locations);
      //   }.bind(this), 100);
      //   return;
      // }
      this._initializeNavigator(locations);
    }.bind(this));

    return container;
  },

  _setup: function _setup(container) {
    this._control = container.querySelector("input[type=range]");
    if (!this._control) {
      this._createControl(container);
    }
    this._background = container.querySelector(".cozy-navigator-range__background");
    this._status = container.querySelector(".cozy-navigator-range__status");
    this._spanCurrentPercentage = container.querySelector(".currentPercentage");
    this._spanCurrentLocation = container.querySelector(".currentLocation");
    this._spanTotalLocations = container.querySelector(".totalLocations");

    this._bindEvents();
  },

  _createControl: function _createControl(container) {
    var template = '<div class="cozy-navigator-range">\n        <label class="u-screenreader" for="cozy-navigator-range-input">Location: </label>\n        <input class="cozy-navigator-range__input" id="cozy-navigator-range-input" type="range" name="locations-range-value" min="0" max="100" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0% \u2022\xA0Location 0 of ?" value="0" data-background-position="0" />\n        <div class="cozy-navigator-range__background"></div>\n      </div>\n      <div class="cozy-navigator-range__status"><span class="currentPercentage">0%</span> \u2022 Location <span class="currentLocation">0</span> of <span class="totalLocations">?</span></div>\n    ';

    var body = new DOMParser().parseFromString(template, "text/html").body;
    while (body.children.length) {
      container.appendChild(body.children[0]);
    }

    this._control = container.querySelector("input[type=range]");
  },

  _bindEvents: function _bindEvents() {
    var self = this;

    this._control.addEventListener("input", function () {
      self._update();
    }, false);
    this._control.addEventListener("change", function () {
      self._action();
    }, false);
    this._control.addEventListener("mousedown", function () {
      self._mouseDown = true;
    }, false);
    this._control.addEventListener("mouseup", function () {
      self._mouseDown = false;
    }, false);
    this._control.addEventListener("keydown", function () {
      self._mouseDown = true;
    }, false);
    this._control.addEventListener("keyup", function () {
      self._mouseDown = false;
    }, false);

    this._reader.on('relocated', function (location) {
      if (!self._initiated) {
        return;
      }
      if (!self._mouseDown) {
        self._control.value = Math.ceil(self._reader.locations.percentageFromCfi(self._reader.currentLocation().start.cfi) * 100);
        self._update();
      }
    });
  },

  _action: function _action() {
    var value = this._control.value;
    var locations = this._reader.locations;
    var cfi = locations.cfiFromPercentage(value / 100);
    this._reader.gotoPage(cfi);
  },

  _update: function _update() {
    var self = this;

    var current = this._reader.currentLocation();
    if (!current || !current.start) {
      setTimeout(function () {
        this._update();
      }.bind(this), 100);
    }

    var rangeBg = this._background;
    var range = self._control;

    var value = parseInt(range.value, 10);
    var percentage = value;

    rangeBg.setAttribute('style', 'background-position: ' + -percentage + '% 0%, left top;');
    self._control.setAttribute('data-background-position', Math.ceil(percentage));

    this._spanCurrentPercentage.innerHTML = percentage + '%';
    if (current && current.start) {
      var current_location = this._reader.locations.locationFromCfi(current.start.cfi);
      this._spanCurrentLocation.innerHTML = current_location;
    }
    self._last_delta = self._last_value > value;self._last_value = value;
  },

  _initializeNavigator: function _initializeNavigator(locations) {
    console.log("AHOY updateLocations PROCESSING LOCATION");
    this._initiated = true;
    this._total = this._reader.locations.total;
    if (this._reader.currentLocation().start) {
      this._control.value = Math.ceil(this._reader.locations.percentageFromCfi(this._reader.currentLocation().start.cfi) * 100);
      this._last_value = this._control.value;
    } else {
      this._last_value = this._control.value;
    }

    this._spanTotalLocations.innerHTML = this._total;

    this._update();
    setTimeout(function () {
      addClass(this._container, 'initialized');
    }.bind(this), 0);
  },

  EOT: true
});

var navigator$1 = function navigator(options) {
  return new Navigator(options);
};

// import {Zoom, zoom} from './Control.Zoom';
// import {Attribution, attribution} from './Control.Attribution';

Control.PageNext = PageNext;
Control.PagePrevious = PagePrevious;
Control.PageFirst = PageFirst;
Control.PageLast = PageLast;
control.pagePrevious = pagePrevious;
control.pageNext = pageNext;
control.pageFirst = pageFirst;
control.pageLast = pageLast;

Control.Contents = Contents;
control.contents = contents;

Control.Title = Title;
control.title = title;

Control.PublicationMetadata = PublicationMetadata;
control.publicationMetadata = publicationMetadata;

Control.Preferences = Preferences;
control.preferences = preferences;

Control.Widget = Widget;
control.widget = widget;

Control.Citation = Citation;
control.citation = citation;

Control.Search = Search;
control.search = search;

Control.BibliographicInformation = BibliographicInformation;
control.bibliographicInformation = bibliographicInformation;

Control.Download = Download;
control.download = download;

Control.Navigator = Navigator;
control.navigator = navigator$1;

var Bus = Evented.extend({});

var instance;
var bus = function bus() {
  return instance || (instance = new Bus());
};

var Mixin = { Events: Evented.prototype };

// var ePub = window.ePub;
// export {ePub};

function ePub(href, options) {
	if (window.require !== undefined) {
		window.ePub = require("ePub");
	}
	return window.ePub(href, options);
}

if (!process) {
  var process = {
    "cwd" : function () { return '/' }
  };
}

function assertPath(path) {
  if (typeof path !== 'string') {
    throw new TypeError('Path must be a string. Received ' + path);
  }
}

// Resolves . and .. elements in a path with directory names
function normalizeStringPosix(path, allowAboveRoot) {
  var res = '';
  var lastSlash = -1;
  var dots = 0;
  var code;
  for (var i = 0; i <= path.length; ++i) {
    if (i < path.length)
      code = path.charCodeAt(i);
    else if (code === 47/*/*/)
      break;
    else
      code = 47/*/*/;
    if (code === 47/*/*/) {
      if (lastSlash === i - 1 || dots === 1) {
        // NOOP
      } else if (lastSlash !== i - 1 && dots === 2) {
        if (res.length < 2 ||
            res.charCodeAt(res.length - 1) !== 46/*.*/ ||
            res.charCodeAt(res.length - 2) !== 46/*.*/) {
          if (res.length > 2) {
            var start = res.length - 1;
            var j = start;
            for (; j >= 0; --j) {
              if (res.charCodeAt(j) === 47/*/*/)
                break;
            }
            if (j !== start) {
              if (j === -1)
                res = '';
              else
                res = res.slice(0, j);
              lastSlash = i;
              dots = 0;
              continue;
            }
          } else if (res.length === 2 || res.length === 1) {
            res = '';
            lastSlash = i;
            dots = 0;
            continue;
          }
        }
        if (allowAboveRoot) {
          if (res.length > 0)
            res += '/..';
          else
            res = '..';
        }
      } else {
        if (res.length > 0)
          res += '/' + path.slice(lastSlash + 1, i);
        else
          res = path.slice(lastSlash + 1, i);
      }
      lastSlash = i;
      dots = 0;
    } else if (code === 46/*.*/ && dots !== -1) {
      ++dots;
    } else {
      dots = -1;
    }
  }
  return res;
}

function _format(sep, pathObject) {
  var dir = pathObject.dir || pathObject.root;
  var base = pathObject.base ||
    ((pathObject.name || '') + (pathObject.ext || ''));
  if (!dir) {
    return base;
  }
  if (dir === pathObject.root) {
    return dir + base;
  }
  return dir + sep + base;
}

var posix = {
  // path.resolve([from ...], to)
  resolve: function resolve() {
    var resolvedPath = '';
    var resolvedAbsolute = false;
    var cwd;

    for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
      var path;
      if (i >= 0)
        path = arguments[i];
      else {
        if (cwd === undefined)
          cwd = process.cwd();
        path = cwd;
      }

      assertPath(path);

      // Skip empty entries
      if (path.length === 0) {
        continue;
      }

      resolvedPath = path + '/' + resolvedPath;
      resolvedAbsolute = path.charCodeAt(0) === 47/*/*/;
    }

    // At this point the path should be resolved to a full absolute path, but
    // handle relative paths to be safe (might happen when process.cwd() fails)

    // Normalize the path
    resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);

    if (resolvedAbsolute) {
      if (resolvedPath.length > 0)
        return '/' + resolvedPath;
      else
        return '/';
    } else if (resolvedPath.length > 0) {
      return resolvedPath;
    } else {
      return '.';
    }
  },


  normalize: function normalize(path) {
    assertPath(path);

    if (path.length === 0)
      return '.';

    var isAbsolute = path.charCodeAt(0) === 47;
    var trailingSeparator = path.charCodeAt(path.length - 1) === 47;

    // Normalize the path
    path = normalizeStringPosix(path, !isAbsolute);

    if (path.length === 0 && !isAbsolute)
      path = '.';
    if (path.length > 0 && trailingSeparator)
      path += '/';

    if (isAbsolute)
      return '/' + path;
    return path;
  },


  isAbsolute: function isAbsolute(path) {
    assertPath(path);
    return path.length > 0 && path.charCodeAt(0) === 47/*/*/;
  },


  join: function join() {
    if (arguments.length === 0)
      return '.';
    var joined;
    for (var i = 0; i < arguments.length; ++i) {
      var arg = arguments[i];
      assertPath(arg);
      if (arg.length > 0) {
        if (joined === undefined)
          joined = arg;
        else
          joined += '/' + arg;
      }
    }
    if (joined === undefined)
      return '.';
    return posix.normalize(joined);
  },


  relative: function relative(from, to) {
    assertPath(from);
    assertPath(to);

    if (from === to)
      return '';

    from = posix.resolve(from);
    to = posix.resolve(to);

    if (from === to)
      return '';

    // Trim any leading backslashes
    var fromStart = 1;
    for (; fromStart < from.length; ++fromStart) {
      if (from.charCodeAt(fromStart) !== 47/*/*/)
        break;
    }
    var fromEnd = from.length;
    var fromLen = (fromEnd - fromStart);

    // Trim any leading backslashes
    var toStart = 1;
    for (; toStart < to.length; ++toStart) {
      if (to.charCodeAt(toStart) !== 47/*/*/)
        break;
    }
    var toEnd = to.length;
    var toLen = (toEnd - toStart);

    // Compare paths to find the longest common path from root
    var length = (fromLen < toLen ? fromLen : toLen);
    var lastCommonSep = -1;
    var i = 0;
    for (; i <= length; ++i) {
      if (i === length) {
        if (toLen > length) {
          if (to.charCodeAt(toStart + i) === 47/*/*/) {
            // We get here if `from` is the exact base path for `to`.
            // For example: from='/foo/bar'; to='/foo/bar/baz'
            return to.slice(toStart + i + 1);
          } else if (i === 0) {
            // We get here if `from` is the root
            // For example: from='/'; to='/foo'
            return to.slice(toStart + i);
          }
        } else if (fromLen > length) {
          if (from.charCodeAt(fromStart + i) === 47/*/*/) {
            // We get here if `to` is the exact base path for `from`.
            // For example: from='/foo/bar/baz'; to='/foo/bar'
            lastCommonSep = i;
          } else if (i === 0) {
            // We get here if `to` is the root.
            // For example: from='/foo'; to='/'
            lastCommonSep = 0;
          }
        }
        break;
      }
      var fromCode = from.charCodeAt(fromStart + i);
      var toCode = to.charCodeAt(toStart + i);
      if (fromCode !== toCode)
        break;
      else if (fromCode === 47/*/*/)
        lastCommonSep = i;
    }

    var out = '';
    // Generate the relative path based on the path difference between `to`
    // and `from`
    for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
      if (i === fromEnd || from.charCodeAt(i) === 47/*/*/) {
        if (out.length === 0)
          out += '..';
        else
          out += '/..';
      }
    }

    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0)
      return out + to.slice(toStart + lastCommonSep);
    else {
      toStart += lastCommonSep;
      if (to.charCodeAt(toStart) === 47/*/*/)
        ++toStart;
      return to.slice(toStart);
    }
  },


  _makeLong: function _makeLong(path) {
    return path;
  },


  dirname: function dirname(path) {
    assertPath(path);
    if (path.length === 0)
      return '.';
    var code = path.charCodeAt(0);
    var hasRoot = (code === 47/*/*/);
    var end = -1;
    var matchedSlash = true;
    for (var i = path.length - 1; i >= 1; --i) {
      code = path.charCodeAt(i);
      if (code === 47/*/*/) {
        if (!matchedSlash) {
          end = i;
          break;
        }
      } else {
        // We saw the first non-path separator
        matchedSlash = false;
      }
    }

    if (end === -1)
      return hasRoot ? '/' : '.';
    if (hasRoot && end === 1)
      return '//';
    return path.slice(0, end);
  },


  basename: function basename(path, ext) {
    if (ext !== undefined && typeof ext !== 'string')
      throw new TypeError('"ext" argument must be a string');
    assertPath(path);

    var start = 0;
    var end = -1;
    var matchedSlash = true;
    var i;

    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
      if (ext.length === path.length && ext === path)
        return '';
      var extIdx = ext.length - 1;
      var firstNonSlashEnd = -1;
      for (i = path.length - 1; i >= 0; --i) {
        var code = path.charCodeAt(i);
        if (code === 47/*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            start = i + 1;
            break;
          }
        } else {
          if (firstNonSlashEnd === -1) {
            // We saw the first non-path separator, remember this index in case
            // we need it if the extension ends up not matching
            matchedSlash = false;
            firstNonSlashEnd = i + 1;
          }
          if (extIdx >= 0) {
            // Try to match the explicit extension
            if (code === ext.charCodeAt(extIdx)) {
              if (--extIdx === -1) {
                // We matched the extension, so mark this as the end of our path
                // component
                end = i;
              }
            } else {
              // Extension does not match, so our result is the entire path
              // component
              extIdx = -1;
              end = firstNonSlashEnd;
            }
          }
        }
      }

      if (start === end)
        end = firstNonSlashEnd;
      else if (end === -1)
        end = path.length;
      return path.slice(start, end);
    } else {
      for (i = path.length - 1; i >= 0; --i) {
        if (path.charCodeAt(i) === 47/*/*/) {
          // If we reached a path separator that was not part of a set of path
          // separators at the end of the string, stop now
          if (!matchedSlash) {
            start = i + 1;
            break;
          }
        } else if (end === -1) {
          // We saw the first non-path separator, mark this as the end of our
          // path component
          matchedSlash = false;
          end = i + 1;
        }
      }

      if (end === -1)
        return '';
      return path.slice(start, end);
    }
  },


  extname: function extname(path) {
    assertPath(path);
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;
    for (var i = path.length - 1; i >= 0; --i) {
      var code = path.charCodeAt(i);
      if (code === 47/*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46/*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 ||
        end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        (preDotState === 1 &&
         startDot === end - 1 &&
         startDot === startPart + 1)) {
      return '';
    }
    return path.slice(startDot, end);
  },


  format: function format(pathObject) {
    if (pathObject === null || typeof pathObject !== 'object') {
      throw new TypeError(
        'Parameter "pathObject" must be an object, not ' + typeof(pathObject)
      );
    }
    return _format('/', pathObject);
  },


  parse: function parse(path) {
    assertPath(path);

    var ret = { root: '', dir: '', base: '', ext: '', name: '' };
    if (path.length === 0)
      return ret;
    var code = path.charCodeAt(0);
    var isAbsolute = (code === 47/*/*/);
    var start;
    if (isAbsolute) {
      ret.root = '/';
      start = 1;
    } else {
      start = 0;
    }
    var startDot = -1;
    var startPart = 0;
    var end = -1;
    var matchedSlash = true;
    var i = path.length - 1;

    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    var preDotState = 0;

    // Get non-dir info
    for (; i >= start; --i) {
      code = path.charCodeAt(i);
      if (code === 47/*/*/) {
        // If we reached a path separator that was not part of a set of path
        // separators at the end of the string, stop now
        if (!matchedSlash) {
          startPart = i + 1;
          break;
        }
        continue;
      }
      if (end === -1) {
        // We saw the first non-path separator, mark this as the end of our
        // extension
        matchedSlash = false;
        end = i + 1;
      }
      if (code === 46/*.*/) {
        // If this is our first dot, mark it as the start of our extension
        if (startDot === -1)
          startDot = i;
        else if (preDotState !== 1)
          preDotState = 1;
      } else if (startDot !== -1) {
        // We saw a non-dot and non-path separator before our dot, so we should
        // have a good chance at having a non-empty extension
        preDotState = -1;
      }
    }

    if (startDot === -1 ||
        end === -1 ||
        // We saw a non-dot character immediately before the dot
        preDotState === 0 ||
        // The (right-most) trimmed path component is exactly '..'
        (preDotState === 1 &&
         startDot === end - 1 &&
         startDot === startPart + 1)) {
      if (end !== -1) {
        if (startPart === 0 && isAbsolute)
          ret.base = ret.name = path.slice(1, end);
        else
          ret.base = ret.name = path.slice(startPart, end);
      }
    } else {
      if (startPart === 0 && isAbsolute) {
        ret.name = path.slice(1, startDot);
        ret.base = path.slice(1, end);
      } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
      }
      ret.ext = path.slice(startDot, end);
    }

    if (startPart > 0)
      ret.dir = path.slice(0, startPart - 1);
    else if (isAbsolute)
      ret.dir = '/';

    return ret;
  },


  sep: '/',
  delimiter: ':',
  posix: null
};


var path = posix;

Reader.EpubJS = Reader.extend({

  initialize: function initialize(id, options) {
    Reader.prototype.initialize.apply(this, arguments);
    this._epubjs_ready = false;
    window.xpath = path;
  },

  open: function open(target, callback) {
    var self = this;
    if (typeof target == 'function') {
      callback = target;
      target = undefined;
    }
    if (callback == null) {
      callback = function callback() {};
    }

    // okay, we need to do some hacking to fetch the dang files
    // but this isn't going to be done async
    self.rootfiles = [];
    var request = new XMLHttpRequest();
    request.open('GET', this.options.href + "/META-INF/container.xml");
    request.responseType = 'document';
    request.onload = function () {
      var containerDoc = request.responseXML;
      var rootfiles = containerDoc.querySelectorAll("rootfile");
      if (rootfiles.length > 1) {
        console.log("AHOY ROOTFILES MULTIPLE RENDITIONS", rootfiles.length);
        for (var i = 0; i < rootfiles.length; i++) {
          var rootfile = rootfiles[i];
          var rootfilePath = rootfile.getAttribute('full-path');
          var label = rootfile.getAttribute('rendition:label');
          var layout = rootfile.getAttribute('rendition:layout');
          self.rootfiles.push({
            rootfilePath: rootfilePath,
            label: label,
            layout: layout
          });
        }
      }
    };
    request.send();

    this.options.rootfilePath = this.options.rootfilePath || sessionStorage.getItem('rootfilePath');
    var book_href = this.options.href;
    var book_options = { packagePath: this.options.rootfilePath };
    if (this.options.useArchive) {
      book_href = book_href.replace(/\/(\w+)\/$/, '/$1/$1.sm.epub');
      book_options.openAs = 'epub';
    }
    this._book = ePub(book_href, book_options);
    sessionStorage.removeItem('rootfilePath');
    // this._book = epubjs.ePub(this.options.href);
    this._book.loaded.navigation.then(function (toc) {
      self._contents = toc;
      self.metadata = self._book.package.metadata;
      self.fire('updateContents', toc);
      self.fire('updateTitle', self._book.package.metadata);
    });
    this._book.ready.then(function () {
      self.draw(target, callback);
      if (self.metadata.layout == 'pre-paginated') {
        // fake it with the spine
        var locations = [];
        self._book.spine.each(function (item) {
          locations.push('epubcfi(' + item.cfiBase + '!/4/2)');
          self.locations._locations.push('epubcfi(' + item.cfiBase + '!/4/2)');
        });
        self.locations.total = locations.length;
        var t;
        var f = function f() {
          if (self._rendition && self._rendition.manager && self._rendition.manager.stage) {
            var location = self._rendition.currentLocation();
            if (location && location.start) {
              self.fire('updateLocations', locations);
              clearTimeout(t);
              return;
            }
          }
          t = setTimeout(f, 100);
        };

        t = setTimeout(f, 100);
      } else {
        self._book.locations.generate(1600).then(function (locations) {
          // console.log("AHOY WUT", locations);
          self.fire('updateLocations', locations);
        });
      }
    });
    // .then(callback);
  },

  draw: function draw(target, callback) {
    var self = this;

    if (self._rendition) {
      // self._unbindEvents();
      var container = self._rendition.manager.container;
      Object.keys(self._rendition.hooks).forEach(function (key) {
        console.log("AHOY draw clearing", key);
        self._rendition.hooks[key].clear();
      });
      self._rendition.destroy();
      self._rendition = null;
    }

    this.settings = { flow: this.options.flow };
    this.settings.manager = this.options.manager || 'default';

    if (this.settings.flow == 'auto' && this.metadata.layout == 'pre-paginated') {
      // dumb check to see if the window is _tall_ enough to put
      // two pages side by side
      if (this._container.offsetHeight <= this.options.forceScrolledDocHeight) {
        this.settings.flow = 'scrolled-doc';
        this.settings.manager = 'prepaginated';
      }
    }

    if (this.settings.flow == 'auto' || this.settings.flow == 'paginated') {
      this._panes['epub'].style.overflow = 'hidden';
      this.settings.manager = 'default';
    } else {
      this._panes['epub'].style.overflow = 'auto';
      if (this.settings.manager == 'default') {
        this.settings.manager = 'continuous';
      }
    }

    if (!callback) {
      callback = function callback() {};
    }

    if (this.metadata.layout == 'pre-paginated' && this.settings.manager == 'continuous') {
      this.settings.manager = 'prepaginated';
    }

    // would pre-paginated work better if we scaled the default view from the start? maybe?
    if (false && this.metadata.layout == 'pre-paginated' && this.settings.manager == 'default') {
      this.settings.spread = 'none';
      this._panes['epub'].style.overflow = 'auto';
    }

    self.settings.height = '100%';
    self.settings.width = '100%';
    self.settings['ignoreClass'] = 'annotator-hl';

    self._panes['book'].dataset.manager = this.settings.manager + (this.settings.spread ? '-' + this.settings.spread : '');

    self._drawRendition(target, callback);
  },

  _drawRendition: function _drawRendition(target, callback) {
    var self = this;

    self._rendition = self._book.renderTo(self._panes['epub'], self.settings);
    self._updateFontSize();
    self._bindEvents();
    self._drawn = true;

    if (this.metadata.layout == 'pre-paginated' && this.settings.manager == 'prepaginated') {
      this._panes['epub'].style.overflowX = 'hidden';
    }

    var status_index = 0;
    self._rendition.on('started', function () {

      //var t;
      //t = setInterval(function() {
      //  if ( self._rendition.manager.stage && self.metadata.layout == 'pre-paginated' && self.settings.manager == 'default' ) {
      //    self._rendition.manager.scale(1.75);
      //    clearInterval(t)
      // }
      //}, 100);

      self._rendition.manager.on("building", function (status) {
        if (status) {
          status_index += 1;
          self._panes['loader-status'].innerHTML = '<span>' + Math.round(status_index / status.total * 100.0) + '%</span>';
        } else {
          self._enableBookLoader(-1);
        }
      });
      self._rendition.manager.on("built", function () {
        console.log("AHOY manager built");
        self._disableBookLoader(true);
      });
    });
    // self._rendition.on('attached', attached_callback)

    self._rendition.hooks.content.register(function (contents) {
      self.fire('ready:contents', contents);
      self.fire('readyContents', contents);
      contents.document.addEventListener('keydown', function (event) {
        var keyName = event.key;
        self.fire('keyDown', { keyName: keyName, shiftKey: event.shiftKey, inner: true });
        console.log('inner keydown event: ', keyName);
      });
    });

    if (target && target.start) {
      target = target.start;
    }
    if (!target && window.location.hash) {
      if (window.location.hash.substr(1, 3) == '/6/') {
        target = "epubcfi(" + window.location.hash.substr(1) + ")";
      } else {
        target = window.location.hash.substr(2);
        target = self._book.url.path().resolve(target);
      }
    }

    self.gotoPage(target, function () {
      window._loaded = true;
      self._initializeReaderStyles();

      if (callback) {
        callback();
      }

      self._epubjs_ready = true;

      setTimeout(function () {
        self.fire('opened');
        self.fire('ready');
        clearTimeout(self._queueTimeout);
      }, 100);
    });
  },

  _scroll: function _scroll(delta) {
    var self = this;
    if (self.options.flow == 'XXscrolled-doc') {
      var container = self._rendition.manager.container;
      var rect = container.getBoundingClientRect();
      var scrollTop = container.scrollTop;
      var newScrollTop = scrollTop;
      var scrollBy = rect.height * 0.98;
      switch (delta) {
        case 'PREV':
          newScrollTop = -(scrollTop + scrollBy);
          break;
        case 'NEXT':
          newScrollTop = scrollTop + scrollBy;
          break;
        case 'HOME':
          newScrollTop = 0;
          break;
        case 'END':
          newScrollTop = container.scrollHeight - scrollBy;
          break;
      }
      container.scrollTop = newScrollTop;
      return Math.floor(container.scrollTop) != Math.floor(scrollTop);
    }
    return false;
  },

  _navigate: function _navigate(promise, callback) {
    var self = this;
    console.log("AHOY NAVIGATE", promise);
    self._enableBookLoader(100);
    promise.then(function () {
      console.log("AHOY NAVIGATE FIN");
      self._disableBookLoader();
      if (callback) {
        callback();
      }
    }).catch(function (e) {
      self._disableBookLoader();
      if (callback) {
        callback();
      }
      console.log("AHOY NAVIGATE ERROR", e);
      throw e;
    });
  },

  next: function next() {
    var self = this;
    self._scroll('NEXT') || self._navigate(this._rendition.next());
  },

  prev: function prev() {
    this._scroll('PREV') || this._navigate(this._rendition.prev());
  },

  first: function first() {
    this._navigate(this._rendition.display(0));
  },

  last: function last() {
    var self = this;
    var target = this._book.spine.length - 1;
    this._navigate(this._rendition.display(target));
  },

  gotoPage: function gotoPage(target, callback) {
    if (target != null) {
      var section = this._book.spine.get(target);
      if (!section) {
        // maybe it needs to be resolved
        var guessed = target;
        if (guessed.indexOf("://") < 0) {
          var path1 = path.resolve(this._book.path.directory, this._book.package.navPath);
          var path2 = path.resolve(path.dirname(path1), target);
          guessed = this._book.canonical(path2);
        }
        if (guessed.indexOf("#") !== 0) {
          guessed = guessed.split('#')[0];
        }

        this._book.spine.each(function (item) {
          if (item.canonical == guessed) {
            section = item;
            target = section.href;
            return;
          }
        });

        console.log("AHOY GUESSED", target);
      } else if (target.toString().match(/^\d+$/)) {
        console.log("AHOY USING", section.href);
        target = section.href;
      }

      if (!section) {
        if (!this._epubjs_ready) {
          target = 0;
        } else {
          return;
        }
      }
    }

    console.log("AHOY gotoPage", target);

    var navigating = this._rendition.display(target).then(function () {
      this._rendition.display(target);
    }.bind(this));
    this._navigate(navigating, callback);
  },

  percentageFromCfi: function percentageFromCfi(cfi) {
    return this._book.percentageFromCfi(cfi);
  },

  destroy: function destroy() {
    if (this._rendition) {
      try {
        this._rendition.destroy();
      } catch (e) {}
    }
    this._rendition = null;
    this._drawn = false;
  },

  reopen: function reopen(options, target) {
    // different per reader?
    var target = target || this.currentLocation();
    if (target.start) {
      target = target.start;
    }
    if (target.cfi) {
      target = target.cfi;
    }

    var doUpdate = false;
    if (options === true) {
      doUpdate = true;options = {};
    }
    Object.keys(options).forEach(function (key) {
      doUpdate = doUpdate || options[key] != this.options[key];
    }.bind(this));

    if (!doUpdate) {
      return;
    }

    if (options.rootfilePath && options.rootfilePath != this.options.rootfilePath) {
      // we need to REOPEN THE DANG BOOK
      sessionStorage.setItem('rootfilePath', options.rootfilePath);
      location.reload();
      return;
    }

    extend(this.options, options);

    this.draw(target, function () {
      this._updateFontSize();
      this._updateTheme();
      this._selectTheme(true);
    }.bind(this));
  },

  currentLocation: function currentLocation() {
    if (this._rendition && this._rendition.manager) {
      this._cached_location = this._rendition.currentLocation();
    }
    return this._cached_location;
  },

  _bindEvents: function _bindEvents() {
    var self = this;

    // add a stylesheet to stop images from breaking their columns
    var add_max_img_styles = false;
    if (this._book.package.metadata.layout == 'pre-paginated') {
      // NOOP
    } else if (this.options.flow == 'auto' || this.options.flow == 'paginated') {
      add_max_img_styles = true;
    }

    var custom_stylesheet_rules = [];

    // force 90% height instead of default 60%
    if (this.metadata.layout != 'pre-paginated') {
      this._rendition.hooks.content.register(function (contents) {
        contents.addStylesheetRules({
          "img": {
            "max-width": (this._layout.columnWidth ? this._layout.columnWidth + "px" : "100%") + "!important",
            "max-height": (this._layout.height ? this._layout.height * 0.9 + "px" : "90%") + "!important",
            "object-fit": "contain",
            "page-break-inside": "avoid"
          },
          "svg": {
            "max-width": (this._layout.columnWidth ? this._layout.columnWidth + "px" : "100%") + "!important",
            "max-height": (this._layout.height ? this._layout.height * 0.9 + "px" : "90%") + "!important",
            "page-break-inside": "avoid"
          }
        });
      }.bind(this._rendition));
    } else {
      this._rendition.hooks.content.register(function (contents) {
        contents.addStylesheetRules({
          "img": {
            // "border": "64px solid black !important",
            "box-sizing": "border-box !important"
          },
          "figure": {
            "box-sizing": "border-box !important",
            "margin": "0 !important"
          }
        });
      }.bind(this._rendition));
    }

    this._updateFontSize();

    if (custom_stylesheet_rules.length) {
      this._rendition.hooks.content.register(function (view) {
        view.addStylesheetRules(custom_stylesheet_rules);
      });
    }

    this._rendition.on('resized', function (box) {
      self.fire('resized', box);
    });

    this._rendition.on('relocated', function (location) {
      self.fire('relocated', location);
    });

    this._rendition.on('displayerror', function (err) {
      console.log("AHOY RENDITION DISPLAY ERROR", err);
    });

    this._rendition.on("locationChanged", function (location) {
      var view = this.manager.current();
      var section = view.section;
      var current = this.book.navigation.get(section.href);

      self.fire("updateSection", current);
      self.fire("updateLocation", location);
      self.fire("relocated", location);
    });

    this._rendition.on("rendered", function (section, view) {

      if (view.contents) {
        // view.contents.on("xxlinkClicked", function(href) {
        //   console.log("AHOY CLICKED", href);
        //   var tmp = href.split("#");
        //   href = tmp[0];
        //   var hash = tmp[1]
        //   // var current = self.currentLocation().start.href;
        //   // var section = self._book.spine.get(current.href);
        //   console.log("AHOY CLICKED CHECK", section.canonical, href);
        //   if ( section.canonical.indexOf(href) < 0 ) {
        //     self.gotoPage(href);
        //     // self._rendition.display(href);

        //   } else if ( hash ) {
        //     // we're already on this page, so we need to scroll to this location
        //     var node = view.contents.content.querySelector('#' + hash);
        //     console.log("AHOY INTERNAL", hash, view.contents, node);
        //   }
        //   // self._rendition.display(href);
        // })
      }

      self.on('keyDown', function (data) {
        if (data.keyName == 'Tab' && data.inner) {
          var container = self._rendition.manager.container;
          var mod;
          var delta;
          var x;var xyz;
          setTimeout(function () {
            var scrollLeft = container.scrollLeft;
            mod = scrollLeft % parseInt(self._rendition.manager.layout.delta, 10);
            if (mod > 0 && mod / self._rendition.manager.layout.delta < 0.99) {
              // var x = Math.floor(event.target.scrollLeft / parseInt(self._rendition.manager.layout.delta, 10)) + 1;
              // var delta = ( x * self._rendition.manager.layout.delta) - event.target.scrollLeft;
              x = Math.floor(container.scrollLeft / parseInt(self._rendition.manager.layout.delta, 10));
              if (data.shiftKey) {
                x -= 0;
              } else {
                x += 1;
              }
              var y = container.scrollLeft;
              delta = x * self._rendition.manager.layout.delta - y;
              xyz = x * self._rendition.manager.layout.delta;
              // if ( data.shiftKey ) { delta *= -1 ; }
              if (true || !data.shiftKey) {
                self._rendition.manager.scrollBy(delta);
              }
            }
            console.log("AHOY DOING THE SCROLLING", data.shiftKey, scrollLeft, mod, x, xyz, delta);
          }, 0);
        }
      });
    });
  },

  _initializeReaderStyles: function _initializeReaderStyles() {
    var self = this;
    var themes = this.options.themes;
    if (themes) {
      themes.forEach(function (theme) {
        self._rendition.themes.register(theme['klass'], theme.href ? theme.href : theme.rules);
      });
    }

    // base for highlights
    this._rendition.themes.override('.epubjs-hl', "fill: yellow; fill-opacity: 0.3; mix-blend-mode: multiply;");
  },

  _selectTheme: function _selectTheme(refresh) {
    var theme = this.options.theme || 'default';
    this._rendition.themes.select(theme);
    if (0 && refresh) {
      var cfi = this.currentLocation().end.cfi;
      this._rendition.manager.clear();
      console.log("AHOY", cfi);
      this._rendition.display(cfi);
    }
  },

  _updateFontSize: function _updateFontSize() {
    var text_size = this.options.text_size == 'auto' ? 100 : this.options.text_size;
    this._rendition.themes.fontSize(text_size + '%');
    // if ( this.options.text_size == 'large' ) {
    //   this._rendition.themes.fontSize(this.options.fontSizeLarge);
    // } else if ( this.options.text_size == 'small' ) {
    //   this._rendition.themes.fontSize(this.options.fontSizeSmall);
    // } else {
    //   this._rendition.themes.fontSize(this.options.fontSizeDefault);
    // }
  },

  EOT: true

});

Object.defineProperty(Reader.EpubJS.prototype, 'metadata', {
  get: function get$$1() {
    // return the combined metadata of configured + book metadata
    return this._metadata;
  },

  set: function set(data) {
    this._metadata = extend({}, data, this.options.metadata);
  }
});

Object.defineProperty(Reader.EpubJS.prototype, 'annotations', {
  get: function get$$1() {
    // return the combined metadata of configured + book metadata
    if (ie) {
      return {
        reset: function reset() {/* NOOP */},
        highlight: function highlight(cfiRange) {/* NOOP */}
      };
    }
    if (!this._rendition.annotations.reset) {
      this._rendition.annotations.reset = function () {
        for (var hash in this._annotations) {
          var cfiRange = decodeURI(hash);
          this.remove(cfiRange);
        }
        this._annotationsBySectionIndex = {};
      }.bind(this._rendition.annotations);
    }
    return this._rendition.annotations;
  }
});

Object.defineProperty(Reader.EpubJS.prototype, 'locations', {
  get: function get$$1() {
    // return the combined metadata of configured + book metadata
    return this._book.locations;
  }
});

window.Reader = Reader;

function createReader$1(id, options) {
  return new Reader.EpubJS(id, options);
}

Reader.Mock = Reader.extend({

  initialize: function initialize(id, options) {
    Reader.prototype.initialize.apply(this, arguments);
  },

  open: function open(target, callback) {
    var self = this;
    this._book = {
      metadata: {
        title: 'The Mock Life',
        creator: 'Alex Mock',
        publisher: 'University Press',
        location: 'Ann Arbor, MI',
        pubdate: '2017-05-23'
      },
      contents: {
        toc: [{ id: 1, href: "/epubs/mock/ops/xhtml/TitlePage.xhtml", label: "Title", parent: null }, { id: 2, href: "/epubs/mock/ops/xhtml/Chapter01.xhtml", label: "Chapter 1", parent: null }, { id: 3, href: "/epubs/mock/ops/xhtml/Chapter02.xhtml", label: "Chapter 2", parent: null }, { id: 4, href: "/epubs/mock/ops/xhtml/Chapter03.xhtml", label: "Chapter 3", parent: null }, { id: 5, href: "/epubs/mock/ops/xhtml/Chapter04.xhtml", label: "Chapter 4", parent: null }, { id: 6, href: "/epubs/mock/ops/xhtml/Chapter05.xhtml", label: "Chapter 5", parent: null }, { id: 7, href: "/epubs/mock/ops/xhtml/Chapter06.xhtml", label: "Chapter 6", parent: null }, { id: 8, href: "/epubs/mock/ops/xhtml/Chapter07.xhtml", label: "Chapter 7", parent: null }, { id: 9, href: "/epubs/mock/ops/xhtml/Index.xhtml", label: "Index", parent: null }]
      }
    };

    this._locations = ['epubcfi(/6/4[TitlePage.xhtml])', 'epubcfi(/6/4[Chapter01.xhtml])', 'epubcfi(/6/4[Chapter02.xhtml])', 'epubcfi(/6/4[Chapter03.xhtml])', 'epubcfi(/6/4[Chapter04.xhtml])', 'epubcfi(/6/4[Chapter05.xhtml])', 'epubcfi(/6/4[Chapter06.xhtml])', 'epubcfi(/6/4[Chapter07.xhtml])', 'epubcfi(/6/4[Chapter08.xhtml])', 'epubcfi(/6/4[Index.xhtml])'];

    this.__currentIndex = 0;

    this.metadata = this._book.metadata;
    this.fire('updateContents', this._book.contents);
    this.fire('updateTitle', this._metadata);
    this.fire('updateLocations', this._locations);
    this.draw(target, callback);
  },

  draw: function draw(target, callback) {
    var self = this;
    this.settings = { flow: this.options.flow };
    this.settings.height = '100%';
    this.settings.width = '99%';
    // this.settings.width = '100%';
    if (this.options.flow == 'auto') {
      this._panes['book'].style.overflow = 'hidden';
    } else {
      this._panes['book'].style.overflow = 'auto';
    }
    if (typeof target == 'function' && cb === undefined) {
      callback = target;
      target = undefined;
    }
    callback();
    self.fire('ready');
  },

  next: function next() {
    // this._rendition.next();
  },

  prev: function prev() {
    // this._rendition.prev();
  },

  first: function first() {
    // this._rendition.display(0);
  },

  last: function last() {},

  gotoPage: function gotoPage(target) {
    if (typeof target == "string") {
      this.__currentIndex = this._locations.indexOf(target);
    } else {
      this.__currentIndex = target;
    }
    this.fire("relocated", this.currentLocation());
  },

  destroy: function destroy() {
    // if ( this._rendition ) {
    //   this._rendition.destroy();
    // }
    // this._rendition = null;
  },

  currentLocation: function currentLocation() {
    var cfi = this._locations[this.__currentIndex];
    return {
      start: { cfi: cfi, href: cfi },
      end: { cfi: cfi, href: cfi }
    };
  },

  _bindEvents: function _bindEvents() {
    var self = this;
  },

  _updateTheme: function _updateTheme() {},

  EOT: true

});

Object.defineProperty(Reader.Mock.prototype, 'metadata', {
  get: function get$$1() {
    // return the combined metadata of configured + book metadata
    return this._metadata;
  },

  set: function set(data) {
    this._metadata = extend({}, data, this.options.metadata);
  }
});

Object.defineProperty(Reader.Mock.prototype, 'locations', {
  get: function get$$1() {
    // return the combined metadata of configured + book metadata
    var self = this;
    return {
      total: self._locations.length,
      locationFromCfi: function locationFromCfi(cfi) {
        return self._locations.indexOf(cfi);
      },
      percentageFromCfi: function percentageFromCfi(cfi) {
        var index = self.locations.locationFromCfi(cfi);
        return index / self.locations.total;
      },
      cfiFromPercentage: function cfiFromPercentage(percentage) {
        var index = Math.ceil(percentage * 10);
        return self._locations[index];
      }
    };
  }
});

Object.defineProperty(Reader.Mock.prototype, 'annotations', {
  get: function get$$1() {
    return {
      reset: function reset() {},
      highlight: function highlight() {}
    };
  }
});

function createReader$2(id, options) {
  return new Reader.Mock(id, options);
}

var engines = {
  epubjs: createReader$1,
  mock: createReader$2
};

var reader = function reader(id, options) {
  options = options || {};
  var engine = options.engine || window.COZY_EPUB_ENGINE || 'epubjs';
  var engine_href = options.engine_href || window.COZY_EPUB_ENGINE_HREF;
  var _this = this;
  var _arguments = arguments;

  options.engine = engine;
  options.engine_href = engine_href;

  return engines[engine].apply(_this, [id, options]);
};

// misc

var oldCozy = window.cozy;
function noConflict() {
  window.cozy = oldCozy;
  return this;
}

exports.version = version;
exports.noConflict = noConflict;
exports.Control = Control;
exports.control = control;
exports.Browser = Browser;
exports.Evented = Evented;
exports.Mixin = Mixin;
exports.Util = Util;
exports.Class = Class;
exports.extend = extend;
exports.bind = bind;
exports.stamp = stamp;
exports.setOptions = setOptions;
exports.bus = bus;
exports.DomEvent = DomEvent;
exports.DomUtil = DomUtil;
exports.reader = reader;

})));
//# sourceMappingURL=cozy-sun-bear.js.map
