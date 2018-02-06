/*
 * Cozy Sun Bear 1.0.0b58ea70, a JS library for interactive books. http://github.com/mlibrary/cozy-sun-bear
 * (c) 2018 Regents of the University of Michigan
 */
(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
	typeof define === 'function' && define.amd ? define(['exports'], factory) :
	(factory((global.cozy = global.cozy || {})));
}(this, (function (exports) { 'use strict';

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
        var handler = {};
        handler.callbacks = [];
        handler.error = [];
        handler.then = function (cb) {
            handler.callbacks.push(cb);
            return handler;
        };
        handler.catch = function (cb) {
            handler.error.push(cb);
            return handler;
        };
        handler.resolve = function (_argv) {
            // var _argv;
            while (handler.callbacks.length) {
                var cb = handler.callbacks.shift();
                var retval;
                try {
                    _argv = cb(_argv);
                } catch (e) {
                    handler.reject(e);
                    break;
                }
            }
        };

        handler.reject = function (e) {
            while (handler.error.length) {
                var cb = handler.error.shift();
                cb(e);
            }
            console.log(e);
            console.trace();
        };

        if (url == undefined) {
            setTimeout(function () {
                handler.resolve(url);
            }, 0);
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

var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

/** Detect free variable `global` from Node.js. */
var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal && commonjsGlobal.Object === Object && commonjsGlobal;

var _freeGlobal = freeGlobal;

/** Detect free variable `self`. */
var freeSelf = typeof self == 'object' && self && self.Object === Object && self;

/** Used as a reference to the global object. */
var root = _freeGlobal || freeSelf || Function('return this')();

var _root = root;

/**
 * Gets the timestamp of the number of milliseconds that have elapsed since
 * the Unix epoch (1 January 1970 00:00:00 UTC).
 *
 * @static
 * @memberOf _
 * @since 2.4.0
 * @category Date
 * @returns {number} Returns the timestamp.
 * @example
 *
 * _.defer(function(stamp) {
 *   console.log(_.now() - stamp);
 * }, _.now());
 * // => Logs the number of milliseconds it took for the deferred invocation.
 */
var now = function() {
  return _root.Date.now();
};

var now_1 = now;

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
var symbolTag = '[object Symbol]';

/**
 * Checks if `value` is classified as a `Symbol` primitive or object.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to check.
 * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
 * @example
 *
 * _.isSymbol(Symbol.iterator);
 * // => true
 *
 * _.isSymbol('abc');
 * // => false
 */
function isSymbol(value) {
  return typeof value == 'symbol' ||
    (isObjectLike_1(value) && _baseGetTag(value) == symbolTag);
}

var isSymbol_1 = isSymbol;

/** Used as references for various `Number` constants. */
var NAN = 0 / 0;

/** Used to match leading and trailing whitespace. */
var reTrim = /^\s+|\s+$/g;

/** Used to detect bad signed hexadecimal string values. */
var reIsBadHex = /^[-+]0x[0-9a-f]+$/i;

/** Used to detect binary string values. */
var reIsBinary = /^0b[01]+$/i;

/** Used to detect octal string values. */
var reIsOctal = /^0o[0-7]+$/i;

/** Built-in method references without a dependency on `root`. */
var freeParseInt = parseInt;

/**
 * Converts `value` to a number.
 *
 * @static
 * @memberOf _
 * @since 4.0.0
 * @category Lang
 * @param {*} value The value to process.
 * @returns {number} Returns the number.
 * @example
 *
 * _.toNumber(3.2);
 * // => 3.2
 *
 * _.toNumber(Number.MIN_VALUE);
 * // => 5e-324
 *
 * _.toNumber(Infinity);
 * // => Infinity
 *
 * _.toNumber('3.2');
 * // => 3.2
 */
function toNumber(value) {
  if (typeof value == 'number') {
    return value;
  }
  if (isSymbol_1(value)) {
    return NAN;
  }
  if (isObject_1(value)) {
    var other = typeof value.valueOf == 'function' ? value.valueOf() : value;
    value = isObject_1(other) ? (other + '') : other;
  }
  if (typeof value != 'string') {
    return value === 0 ? value : +value;
  }
  value = value.replace(reTrim, '');
  var isBinary = reIsBinary.test(value);
  return (isBinary || reIsOctal.test(value))
    ? freeParseInt(value.slice(2), isBinary ? 2 : 8)
    : (reIsBadHex.test(value) ? NAN : +value);
}

var toNumber_1 = toNumber;

/** Error message constants. */
var FUNC_ERROR_TEXT = 'Expected a function';

/* Built-in method references for those with the same name as other `lodash` methods. */
var nativeMax = Math.max;
var nativeMin = Math.min;

/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked. The debounced function comes with a `cancel` method to cancel
 * delayed `func` invocations and a `flush` method to immediately invoke them.
 * Provide `options` to indicate whether `func` should be invoked on the
 * leading and/or trailing edge of the `wait` timeout. The `func` is invoked
 * with the last arguments provided to the debounced function. Subsequent
 * calls to the debounced function return the result of the last `func`
 * invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until to the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `_.debounce` and `_.throttle`.
 *
 * @static
 * @memberOf _
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0] The number of milliseconds to delay.
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', _.debounce(calculateLayout, 150));
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', _.debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }));
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * var debounced = _.debounce(batchLog, 250, { 'maxWait': 1000 });
 * var source = new EventSource('/stream');
 * jQuery(source).on('message', debounced);
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel);
 */
function debounce(func, wait, options) {
  var lastArgs,
      lastThis,
      maxWait,
      result,
      timerId,
      lastCallTime,
      lastInvokeTime = 0,
      leading = false,
      maxing = false,
      trailing = true;

  if (typeof func != 'function') {
    throw new TypeError(FUNC_ERROR_TEXT);
  }
  wait = toNumber_1(wait) || 0;
  if (isObject_1(options)) {
    leading = !!options.leading;
    maxing = 'maxWait' in options;
    maxWait = maxing ? nativeMax(toNumber_1(options.maxWait) || 0, wait) : maxWait;
    trailing = 'trailing' in options ? !!options.trailing : trailing;
  }

  function invokeFunc(time) {
    var args = lastArgs,
        thisArg = lastThis;

    lastArgs = lastThis = undefined;
    lastInvokeTime = time;
    result = func.apply(thisArg, args);
    return result;
  }

  function leadingEdge(time) {
    // Reset any `maxWait` timer.
    lastInvokeTime = time;
    // Start the timer for the trailing edge.
    timerId = setTimeout(timerExpired, wait);
    // Invoke the leading edge.
    return leading ? invokeFunc(time) : result;
  }

  function remainingWait(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime,
        result = wait - timeSinceLastCall;

    return maxing ? nativeMin(result, maxWait - timeSinceLastInvoke) : result;
  }

  function shouldInvoke(time) {
    var timeSinceLastCall = time - lastCallTime,
        timeSinceLastInvoke = time - lastInvokeTime;

    // Either this is the first call, activity has stopped and we're at the
    // trailing edge, the system time has gone backwards and we're treating
    // it as the trailing edge, or we've hit the `maxWait` limit.
    return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
      (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait));
  }

  function timerExpired() {
    var time = now_1();
    if (shouldInvoke(time)) {
      return trailingEdge(time);
    }
    // Restart the timer.
    timerId = setTimeout(timerExpired, remainingWait(time));
  }

  function trailingEdge(time) {
    timerId = undefined;

    // Only invoke if we have `lastArgs` which means `func` has been
    // debounced at least once.
    if (trailing && lastArgs) {
      return invokeFunc(time);
    }
    lastArgs = lastThis = undefined;
    return result;
  }

  function cancel() {
    if (timerId !== undefined) {
      clearTimeout(timerId);
    }
    lastInvokeTime = 0;
    lastArgs = lastCallTime = lastThis = timerId = undefined;
  }

  function flush() {
    return timerId === undefined ? result : trailingEdge(now_1());
  }

  function debounced() {
    var time = now_1(),
        isInvoking = shouldInvoke(time);

    lastArgs = arguments;
    lastThis = this;
    lastCallTime = time;

    if (isInvoking) {
      if (timerId === undefined) {
        return leadingEdge(lastCallTime);
      }
      if (maxing) {
        // Handle invocations in a tight loop.
        timerId = setTimeout(timerExpired, wait);
        return invokeFunc(lastCallTime);
      }
    }
    if (timerId === undefined) {
      timerId = setTimeout(timerExpired, wait);
    }
    return result;
  }
  debounced.cancel = cancel;
  debounced.flush = flush;
  return debounced;
}

var debounce_1 = debounce;

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
    mobileMediaQuery: '(min-device-width : 300px) and (max-device-width : 600px)',
    theme: 'default',
    themes: []
  },

  initialize: function initialize(id, options) {
    var self = this;

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
    this._onResize = bind(this._onResize, this);

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

    self.open(function () {
      self.setBookPanelSize();
      self.draw(target, cb);
      // self.draw(target, function() {
      //   self._panes['loader'].style.display = 'none';
      //   if ( cb ) {
      //     cb();
      //   }
      // });
    });
  },

  switch: function _switch(flow, target) {
    var target = target || this.currentLocation();
    if (flow === undefined) {
      flow = this.options.flow == 'auto' ? 'scrolled-doc' : 'auto';
    }
    this.options.flow = flow;
    this.destroy();
    this.draw(target);
  },

  reopen: function reopen(options, target) {
    var target = target || this.currentLocation();
    extend(this.options, options);
    this.destroy();
    console.log("AHOY REOPENED?");
    return;
    this.draw(target);
    this.fire('reopen');
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
    this._initLoader();
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

    if (this.options.trackResize) {
      var self = this;
      var fn = debounce_1(function () {
        self.invalidateSize({});
      }, 150);
      onOff(window, 'resize', fn, this);
    }

    if (any3d && this.options.transform3DLimit) {
      (remove$$1 ? this.off : this.on).call(this, 'moveend', this._onMoveEnd);
    }

    var self = this;
    if (screenfull.enabled) {
      screenfull.on('change', function () {
        setTimeout(function () {
          self.invalidateSize({});
        }, 100);
        console.log('AHOY: Am I fullscreen?', screenfull.isFullscreen ? 'YES' : 'NO');
      });
    }
  },

  _onResize: function _onResize() {
    if (!this._resizeRequest) {
      this._resizeRequest = requestAnimFrame(function () {
        this.invalidateSize({});
      }, this);
    }
  },

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

  setBookPanelSize: function setBookPanelSize() {
    var panes = this._panes;

    // panes['book'].style.height = (panes['book-cover'].offsetHeight * _padding * 0.99) + 'px';
    // panes['book'].style.width = (panes['book-cover'].offsetWidth * _padding) + 'px';
    // panes['book'].style.width = '100%';
    // panes['book'].style.height = '100%';
    // panes['book'].style.display = 'block';
  },

  getFixedBookPanelSize: function getFixedBookPanelSize() {
    // have to make the book 
    var style = window.getComputedStyle(this._panes['book']);
    var h = this._panes['book'].clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    var w = this._panes['book'].clientWidth - parseFloat(style.paddingRight) - parseFloat(style.paddingLeft);
    return { height: Math.floor(h * 1.00), width: Math.floor(w * 1.00) };
  },

  invalidateSize: function invalidateSize(options) {
    var self = this;

    if (!self._drawn) {
      return;
    }

    cancelAnimFrame(this._resizeRequest);

    if (!this._loaded) {
      return this;
    }

    if (!this._resizeTarget) {
      this._resizeTarget = this.currentLocation();
    }
    // self.destroy();

    var panes = this._panes;
    // panes['book'].style.display = 'none';

    setTimeout(function () {
      self.setBookPanelSize();

      if (self._triggerRedraw) {
        clearTimeout(self._triggerRedraw);
      }

      self._triggerRedraw = setTimeout(function () {
        // self.destroy();
        // self.draw(self._resizeTarget);
        self._resizeBookPane();
        self._resizeRequest = null;
        self._resizeTarget = null;
      }, 150);
    }, 0);
  },

  _resizeBookPane: function _resizeBookPane() {},

  _setupHooks: function _setupHooks() {},

  _checkFeatureCompatibility: function _checkFeatureCompatibility() {
    if (!isPropertySupported('columnCount') || this._checkMobileDevice()) {
      // force
      this.options.flow = 'scrolled-doc';
    }
    if (this._checkMobileDevice()) {
      this.options.fontSizeLarge = '160%';
      this.options.fontSizeSmall = '100%';
      this.options.fontSizeDefault = '120%';
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

  _initLoader: function _initLoader() {
    // is this not awesome?
    var template$$1 = '<div class="socket">\n      <div class="gel center-gel">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c1 r1">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c2 r1">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c3 r1">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c4 r1">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c5 r1">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c6 r1">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      \n      <div class="gel c7 r2">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      \n      <div class="gel c8 r2">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c9 r2">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c10 r2">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c11 r2">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c12 r2">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c13 r2">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c14 r2">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c15 r2">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c16 r2">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c17 r2">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c18 r2">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c19 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c20 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c21 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c22 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c23 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c24 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c25 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c26 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c28 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c29 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c30 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c31 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c32 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c33 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c34 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c35 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c36 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n      <div class="gel c37 r3">\n        <div class="hex-brick h1"></div>\n        <div class="hex-brick h2"></div>\n        <div class="hex-brick h3"></div>\n      </div>\n    </div>';

    var body = new DOMParser().parseFromString(template$$1, "text/html").body;
    while (body.children.length) {
      this._panes['loader'].appendChild(body.children[0]);
    }
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
    this.callbacks = this.options.callbacks;
    this.actions = this.options.actions;
    this.handlers = this.options.handlers;
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
    this.activeElement.focus();
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
        target = target.getAttribute('href');
        this._reader.gotoPage(target);
        return true;
      }.bind(this));

      this._setupSkipLink();

      var parent = self._modal._container.querySelector('ul');
      var s = data.toc.filter(function (value) {
        return value.parent == null;
      }).map(function (value) {
        return [value, 0, parent];
      });
      while (s.length) {
        var tuple = s.shift();
        var chapter = tuple[0];
        var tabindex = tuple[1];
        var parent = tuple[2];

        var option = self._createOption(chapter, tabindex, parent);
        data.toc.filter(function (value) {
          return value.parent == chapter.id;
        }).reverse().forEach(function (chapter_) {
          s.unshift([chapter_, tabindex + 1, option]);
        });
      }
    }.bind(this));

    return container;
  },

  _createOption: function _createOption(chapter, tabindex, parent) {

    var option = create$1('li');
    var anchor = create$1('a', null, option);
    anchor.textContent = chapter.label;
    // var tab = pad('', tabindex); tab = tab.length ? tab + ' ' : '';
    // option.textContent = tab + chapter.label;
    anchor.setAttribute('href', chapter.href);

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
    this._title = create$1('span', 'cozy-title', h1);
    this._divider = create$1('span', 'cozy-divider', h1);
    this._divider.textContent = " · ";
    this._section = create$1('span', 'cozy-section', h1);

    this._reader.on('updateSection', function (data) {
      if (data && data.label) {
        self._section.textContent = data.label;
        setOpacity(self._section, 1.0);
        setOpacity(self._divider, 1.0);
      } else {
        setOpacity(self._section, 0);
        setOpacity(self._divider, 0);
      }
    });

    this._reader.on('updateTitle', function (data) {
      if (data) {
        self._title.textContent = data.title || data.bookTitle;
        setOpacity(self._section, 0);
        setOpacity(self._divider, 0);
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

    this._createPanel();

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
    var template = '<fieldset>\n        <legend>Text Size</legend>\n        <label><input name="text_size" type="radio" id="preferences-input-size-small" value="small" />Small</label>\n        <label><input name="text_size" type="radio" id="preferences-input-size-auto" value="auto" />Default</label>\n        <label><input name="text_size" type="radio" id="preferences-input-size-large" value="large" />Large</label>\n      </fieldset>          \n      <fieldset>\n        <legend>Text Display</legend>\n        <label><input name="flow" type="radio" id="preferences-input-paginated" value="paginated" />Page-by-Page</label>\n        <label><input name="flow" type="radio" id="preferences-input-scrolled-doc" value="scrolled-doc" />Scroll</label>\n      </fieldset>';

    if (this._reader.options.themes && this._reader.options.themes.length > 0) {
      self.options.hasThemes = true;
      template += '<fieldset>\n        <legend>Theme</legend>\n        <label><input name="theme" type="radio" id="preferences-input-theme-default" value="default" />Default</label>';

      this._reader.options.themes.forEach(function (theme) {
        template += '<label><input name="theme" type="radio" id="preferences-input-theme-' + theme.klass + '" value="' + theme.klass + '" />' + theme.name + '</label>';
      });

      template += '</fieldset>';
    }

    template = '<form>' + template + '</form>';

    this._modal = this._reader.modal({
      template: template,
      title: 'Preferences',
      className: 'cozy-modal-preferences',
      actions: [{
        label: 'Save Changes',
        callback: function callback(event) {
          self._updatePreferences(event);
        }
      }],
      region: 'right'
    });

    this._form = this._modal._container.querySelector('form');
    this._initializeForm();

    window.xmodal = this._modal;
  },

  _initializeForm: function _initializeForm() {
    var input, input_id;
    /// input_id = "preferences-input-" + ( this._reader.options.flow == 'scrolled-doc' ? 'scrollable' : 'reflowable' );
    input_id = "preferences-input-" + (this._reader.options.flow == 'auto' ? 'paginated' : 'scrolled-doc');
    input = this._form.querySelector("#" + input_id);
    input.checked = true;

    input_id = "preferences-input-size-" + (this._reader.options.text_size || 'auto');
    input = this._form.querySelector("#" + input_id);
    input.checked = true;

    if (this.options.hasThemes) {
      input_id = "preferences-input-theme-" + (this._reader.options.theme || 'default');
      input = this._form.querySelector("#" + input_id);
      input.checked = true;
    }
  },

  _updatePreferences: function _updatePreferences(event) {
    var self = this;
    event.preventDefault();

    var options = {};
    var input = this._form.querySelector("input[name='flow']:checked");
    options.flow = input.value;
    input = this._form.querySelector("input[name='text_size']:checked");
    options.text_size = input.value;
    if (this.options.hasThemes) {
      input = this._form.querySelector("input[name='theme']:checked");
      options.theme = input.value;
    }
    this._modal.deactivate();
    setTimeout(function () {
      self._reader.reopen(options);
    }, 100);
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

  defaultTemplate: '<form class="search">\n    <label class="u-screenreader" for="cozy-search-string">Search</label>\n    <input id="cozy-search-string" name="search" type="text" placeholder="Enter Search..."/>\n    <button class="button--sm" data-toggle="open" aria-label="Search"><i class="icon-magnifying-glass oi" data-glyph="magnifying-glass" title="Search" aria-hidden="true"></i></button>\n  </form>',

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

    this._modal = this._reader.modal({
      template: '<ul></ul>',
      title: 'Search Results',
      className: 'cozy-modal-search',
      region: 'left'
    });

    this._modal.on('click', 'a[href]', function (modal, target) {
      target = target.getAttribute('href');
      this._reader.gotoPage(target);
      return true;
    }.bind(this));

    on(this._control, 'click', function (event) {
      event.preventDefault();

      var searchString = this._container.querySelector("#cozy-search-string");
      var url = this.options.searchUrl + searchString.value;
      var parent = this._modal._container.querySelector('ul');

      // remove old search results and annotations
      while (parent.hasChildNodes()) {
        parent.removeChild(parent.lastChild);
      }
      reader.annotations.reset();

      $.getJSON(url, function (data) {
        console.log("SEARCH DATA", data);

        data.search_results.forEach(function (result) {
          var option = create$1('li');
          var anchor = create$1('a', null, option);
          var cfiRange = "epubcfi(" + result.cfi + ")";

          if (result.title) {
            var chapterTitle = create$1('i');
            chapterTitle.textContent = result.title + ": ";
            anchor.appendChild(chapterTitle);
          }
          anchor.appendChild(document.createTextNode(result.snippet));

          anchor.setAttribute("href", cfiRange);
          parent.appendChild(option);

          reader.annotations.highlight(cfiRange);
        });
      }).fail(function (jqxhr, textStatus, error) {
        console.log(textStatus);
        console.log(error);
        var noResults = create$1("p");
        noResults.textContent = 'No results found for "' + searchString.value + '"';
        parent.appendChild(noResults);
      }).always(function () {
        self._modal.activate();
      });
    }, this);

    // DomEvent.on(this._modal._container, 'click', function(event) {
    //   event.preventDefault();
    //   var target = event.target;
    //   if ( target.tagName == 'A' ) {
    //     target = target.getAttribute('href');
    //     this._reader.gotoPage(target);
    //   }
    //   this._modal.deactivate();
    // }, this);

    return container;
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

    var dateFormat = new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });

    for (var idx in metadata_fields) {
      var key = metadata_fields[idx][0];
      var label = metadata_fields[idx][1];
      if (metadata[key]) {
        metadata_fields_seen[key] = true;
        var dt = create$1('dt', 'cozy-bib-info-label', dl);
        dt.innerHTML = label;
        var dd = create$1('dd', 'cozy-bib-info-value cozy-bib-info-value-' + key, dl);
        var value = metadata[key];
        if (key == 'pubdate' || key == 'modified_date') {
          var d = new Date(value);
          value = dateFormat.format(d);
          // value = d.toISOString().slice(0,10); // for YYYY-MM-DD
        }
        dd.innerHTML = value;
      }
    }
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
      this._initiated = true;
      this._total = this._reader.locations.total;
      this._control.value = Math.ceil(this._reader.locations.percentageFromCfi(this._reader.currentLocation().start.cfi) * 100);
      this._last_value = this._control.value;

      this._spanTotalLocations.innerHTML = this._total;

      this._update();
      setTimeout(function () {
        addClass(this._container, 'initialized');
      }.bind(this), 0);
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

    var rangeBg = this._background;
    var range = self._control;

    var value = parseInt(range.value, 10);
    var percentage = value;

    rangeBg.setAttribute('style', 'background-position: ' + -percentage + '% 0%, left top;');
    self._control.setAttribute('data-background-position', Math.ceil(percentage));

    this._spanCurrentPercentage.innerHTML = percentage + '%';
    var current = this._reader.currentLocation();
    var current_location = this._reader.locations.locationFromCfi(current.start.cfi);
    this._spanCurrentLocation.innerHTML = current_location;
    self._last_delta = self._last_value > value;self._last_value = value;
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

function ePub(options) {
	if (window.require !== undefined) {
		window.ePub = require("ePub");
	}
	return window.ePub(options);
}

Reader.EpubJS = Reader.extend({

  initialize: function initialize(id, options) {
    Reader.prototype.initialize.apply(this, arguments);
    this._epubjs_ready = false;
  },

  open: function open(callback) {
    var self = this;
    this._book = ePub(this.options.href);
    this._book.loaded.navigation.then(function (toc) {
      self._contents = toc;
      self.metadata = self._book.package.metadata;
      self.fire('updateContents', toc);
      self.fire('updateTitle', self._book.package.metadata);
    });
    this._book.ready.then(function () {
      self._book.locations.generate(1600).then(function (locations) {
        self.fire('updateLocations', locations);
      });
    }).then(callback);
  },

  draw: function draw(target, callback) {
    var self = this;
    this.settings = { flow: this.options.flow };
    this.settings.manager = this.options.manager || 'default';

    if (this.options.flow == 'auto') {
      this._panes['book'].style.overflow = 'hidden';
    } else {
      this._panes['book'].style.overflow = 'auto';
    }

    // start the rendition after all the epub parts 
    // have been loaded
    this._book.ready.then(function () {

      // have to set fixed dimensions to avoid edge clipping
      var size = self.getFixedBookPanelSize();
      self.settings.height = size.height; //  + 'px';
      self.settings.width = size.width; //  + 'px';
      self.settings.height = '100%';
      self.settings.width = '100%';

      self.settings['ignoreClass'] = 'annotator-hl';
      self._rendition = self._book.renderTo(self._panes['book'], self.settings);
      self._updateFontSize();
      self._bindEvents();
      self._drawn = true;

      self._rendition.hooks.content.register(function (contents) {
        self.fire('ready:contents', contents);
        self.fire('readyContents', contents);
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

        self.fire('opened');
        self.fire('ready');
        self._epubjs_ready = true;
      });
    });
  },

  _navigate: function _navigate(promise, callback) {
    var self = this;
    var t = setTimeout(function () {
      self._panes['loader'].style.display = 'block';
    }, 100);
    promise.then(function () {
      clearTimeout(t);
      self._panes['loader'].style.display = 'none';
      if (callback) {
        callback();
      }
    }).catch(function (e) {
      clearTimeout(t);
      self._panes['loader'].style.display = 'none';
      if (callback) {
        callback();
      }
      throw e;
    });
  },

  next: function next() {
    var self = this;
    self._navigate(this._rendition.next());
  },

  prev: function prev() {
    this._navigate(this._rendition.prev());
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
    if (target) {
      var section = this._book.spine.get(target);
      if (!section) {
        if (!this._epubjs_ready) {
          target = 0;
        } else {
          return;
        }
      }
    }

    this._navigate(this._rendition.display(target), callback);
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
    var _this = this;
    var target = target || this.currentLocation();
    if (target.start) {
      target = target.start;
    }
    if (target.cfi) {
      target = target.cfi;
    }

    extend(this.options, options);

    if (this._rendition.settings.flow != options.flow) {
      if (this.options.flow == 'auto') {
        this._panes['book'].style.overflow = 'hidden';
      } else {
        this._panes['book'].style.overflow = 'auto';
      }
      this._rendition.flow(this.options.flow);
    }

    this._updateFontSize();
    this._updateTheme();
    this._selectTheme(true);
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

    // if ( add_max_img_styles ) {
    //   // WHY IN HEAVENS NAME?
    //   // var style = window.getComputedStyle(this._panes['book']);
    //   var style = window.getComputedStyle(this._rendition.manager.container);
    //   var height = parseInt(style.getPropertyValue('height'));
    //   height -= parseInt(style.getPropertyValue('padding-top'));
    //   height -= parseInt(style.getPropertyValue('padding-bottom'));
    //   // height -= 100;
    //   console.log("AHOY", height, style);
    //   custom_stylesheet_rules.push([ 'img', [ 'max-height', height + 'px !important' ], [ 'max-width', '100% !important'], [ 'height', 'auto' ], [ 'width', 'auto' ]]);
    // }

    this._updateFontSize();

    if (custom_stylesheet_rules.length) {
      this._rendition.hooks.content.register(function (view) {
        view.addStylesheetRules(custom_stylesheet_rules);
      });
    }

    this._rendition.on('relocated', function (location) {
      self.fire('relocated', location);
    });

    this._rendition.on("locationChanged", function (location) {
      var view = this.manager.current();
      var section = view.section;
      var current = this.book.navigation.get(section.href);

      var location_href = location.start;
      window.location.hash = '#' + location_href.substr(8, location_href.length - 8 - 1);

      self.fire("updateSection", current);
      self.fire("updateLocation", location);
    });

    this._rendition.on("rendered", function (section, view) {
      if (view.contents) {
        view.contents.on("linkClicked", function (href) {
          self._rendition.display(href);
        });
      }
      if (!self._rendition.manager.__scroll) {
        var ticking;
        self._rendition.manager.container.addEventListener("scroll", function (event) {
          if (!ticking) {
            var mod = event.target.scrollLeft % parseInt(self._rendition.manager.layout.delta, 10);
            if (mod > 0) {
              ticking = true;
              var x = Math.floor(event.target.scrollLeft / parseInt(self._rendition.manager.layout.delta, 10)) + 1;
              var delta = x * self._rendition.manager.layout.delta - event.target.scrollLeft;
              self._rendition.manager.scrollBy(delta);
              setTimeout(function () {
                ticking = false;
              }, 100);
            }
          }
        });
        self._rendition.manager.views.__scroll = true;
      }
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
    if (this.options.text_size == 'large') {
      this._rendition.themes.fontSize(this.options.fontSizeLarge);
    } else if (this.options.text_size == 'small') {
      this._rendition.themes.fontSize(this.options.fontSizeSmall);
    } else {
      this._rendition.themes.fontSize(this.options.fontSizeDefault);
    }
  },

  _resizeBookPane: function _resizeBookPane() {
    var self = this;
    return;
    setTimeout(function () {
      var size = self.getFixedBookPanelSize();
      self.settings.height = size.height + 'px';
      self.settings.width = size.width + 'px';
      self._rendition.manager.resize(size.width, size.height);
    }, 150);
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

  open: function open(callback) {
    var self = this;
    this._book = {
      metadata: {
        title: 'The Mock Life',
        creator: 'Alex Mock',
        publisher: 'University Press',
        location: 'Ann Arbor, MI',
        pubdate: '2017-05-23'
      },
      contents: []
    };

    this._locations = ['epubcfi(/6/4[TitlePage.xhtml])', 'epubcfi(/6/4[Chapter01.xhtml])', 'epubcfi(/6/4[Chapter02.xhtml])', 'epubcfi(/6/4[Chapter03.xhtml])', 'epubcfi(/6/4[Chapter04.xhtml])', 'epubcfi(/6/4[Chapter05.xhtml])', 'epubcfi(/6/4[Chapter06.xhtml])', 'epubcfi(/6/4[Chapter07.xhtml])', 'epubcfi(/6/4[Chapter08.xhtml])', 'epubcfi(/6/4[Index.xhtml])'];

    this.__currentIndex = 0;

    this.metadata = this._book.metadata;
    this.fire('updateContents', this._book.contents);
    this.fire('updateTitle', this._metadata);
    this.fire('updateLocations', this._locations);
    callback();
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
