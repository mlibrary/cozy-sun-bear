import * as Util from '../core/Util';
import {Evented} from '../core/Events';
// import {Class} from '../core/Class';
import * as Browser from '../core/Browser';
import * as DomEvent from '../dom/DomEvent';
import * as DomUtil from '../dom/DomUtil';

import debounce from 'lodash/debounce';

import {screenfull} from '../screenfull';

/*
 * @class Reader
 * @aka cozy.Map
 * @inherits Evented
 *
 * The central class of the API — it is used to create a book on a page and manipulate it.
 *
 * @example
 *
 * ```js
 * // initialize the map on the "map" div with a given center and zoom
 * var map = L.map('map', {
 *  center: [51.505, -0.09],
 *  zoom: 13
 * });
 * ```
 *
 */

var _padding = 1.0;
export var Reader = Evented.extend({
  options: {
    regions: [
      'header',
      'toolbar.top',
      'toolbar.left',
      'main',
      'toolbar.right',
      'toolbar.bottom',
      'footer'
    ],
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

  initialize: function(id, options) {
    var self = this

    options = Util.setOptions(this, options);
    this._checkFeatureCompatibility();

    this.metadata = this.options.metadata; // initial seed

    this._initContainer(id);
    this._initLayout();

    if ( this.options.themes && this.options.themes.length > 0 ) {
        this.options.themes.forEach(function(theme) {
            if ( theme.href ) { return; }
            var klass = theme.klass;
            var rules = {};
            for(var rule in theme.rules) {
                var new_rule = '.' + klass;
                if ( rule == 'body' ) { new_rule = 'body' + new_rule; }
                else { new_rule += ' ' + rule ; }
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

  start: function(target, cb) {
    var self = this;

    if ( typeof(target) == 'function' && cb === undefined ) {
      cb = target;
      target = undefined;
    }

    Util.loader.js(this.options.engine_href).then(function() {
      self._start(target, cb);
      self._loaded = true;
    })
  },

  _start: function(target, cb) {
    var self = this;
    target = target || 0;

    self.open(function() {
      self.draw(target, cb);
    });
  },

  switch: function(flow, target) {
    var target = target || this.currentLocation();
    if ( flow === undefined ) {
      flow = ( this.options.flow == 'auto' ) ? 'scrolled-doc' : 'auto';
    }
    this.options.flow = flow;
    this.destroy();
    this.draw(target);
  },

  reopen: function(options, target) {
    var target = target || this.currentLocation();
    Util.extend(this.options, options);
    this.destroy();
    console.log("AHOY REOPENED?");
    return;
    this.draw(target);
    this.fire('reopen');
  },

  _updateTheme: function() {
    DomUtil.removeClass(this._container, 'cozy-theme-' + ( this._container.dataset.theme || 'default' ));
    DomUtil.addClass(this._container, 'cozy-theme-' + this.options.theme);
    this._container.dataset.theme = this.options.theme;
  },

  draw: function(target) {
    // NOOP
  },

  next: function() {
    // NOOP
  },

  prev: function() {
    // NOOP
  },

  display: function(index) {
    // NOOP
  },

  gotoPage: function(target) {
    // NOOP
  },

  goBack: function() {
    history.back();
  },

  goForward: function() {
    history.forward();
  },

  requestFullscreen: function() {
    if ( screenfull.enabled ) {
      // this._preResize();
      screenfull.toggle(this._container);
    }
  },

  _preResize: function() {

  },

  _initContainer: function (id) {
    var container = this._container = DomUtil.get(id);

    if (!container) {
      throw new Error('Reader container not found.');
    } else if (container._cozy_id) {
      throw new Error('Reader container is already initialized.');
    }

    DomEvent.on(container, 'scroll', this._onScroll, this);
    this._containerId = Util.stamp(container);
  },

  _initLayout: function () {
    var container = this._container;

    this._fadeAnimated = this.options.fadeAnimation && Browser.any3d;

    DomUtil.addClass(container, 'cozy-container' +
      (Browser.touch ? ' cozy-touch' : '') +
      (Browser.retina ? ' cozy-retina' : '') +
      (Browser.ielt9 ? ' cozy-oldie' : '') +
      (Browser.safari ? ' cozy-safari' : '') +
      (this._fadeAnimated ? ' cozy-fade-anim' : '') +
      ' cozy-engine-' + this.options.engine + 
      ' cozy-theme-' + this.options.theme);

    var position = DomUtil.getStyle(container, 'position');

    this._initPanes();

    if ( ! Browser.columnCount ) {
      this.options.flow = 'scrolled-doc';
    }
  },

  _initPanes: function () {
    var self = this;

    var panes = this._panes = {};

    var l = 'cozy-';
    var container = this._container;

    var prefix = 'cozy-module-';

    DomUtil.addClass(container, 'cozy-container');
    panes['top'] = DomUtil.create('div', prefix + 'top', container);
    panes['main'] = DomUtil.create('div', prefix + 'main', container);
    panes['bottom'] = DomUtil.create('div', prefix + 'bottom', container);

    panes['left'] = DomUtil.create('div', prefix + 'left', panes['main']);
    panes['book-cover'] = DomUtil.create('div', prefix + 'book-cover', panes['main']);
    panes['right'] = DomUtil.create('div', prefix + 'right', panes['main']);
    panes['book'] = DomUtil.create('div', prefix + 'book', panes['book-cover']);
    panes['loader'] = DomUtil.create('div', prefix + 'book-loading', panes['book']);
    this._initLoader();
  },

  _checkIfLoaded: function () {
    if (!this._loaded) {
      throw new Error('Set map center and zoom first.');
    }
  },

  // DOM event handling

  // @section Interaction events
  _initEvents: function (remove) {
    this._targets = {};
    this._targets[Util.stamp(this._container)] = this;

    var onOff = remove ? DomEvent.off : DomEvent.on;

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

    if (Browser.any3d && this.options.transform3DLimit) {
      (remove ? this.off : this.on).call(this, 'moveend', this._onMoveEnd);
    }

    var self = this;
    if (screenfull.enabled) {
      screenfull.on('change', function() {
        // setTimeout(function() {
        //   self.invalidateSize({});
        // }, 100);
        console.log('AHOY: Am I fullscreen?', screenfull.isFullscreen ? 'YES' : 'NO');
      });
    }

    self.on("updateLocation", function(location) {
      var location_href = location.start;

      if ( self._ignoreHistory ) {
        self._ignoreHistory = false;
      } else {
        var tmp_href = window.location.href.split("#");
        tmp_href[1] = location_href.substr(8, location_href.length - 8 - 1);
        history.pushState({ cfi: location_href }, '', tmp_href.join('#'));
      }

      // window.location.hash = '#' + location_href.substr(8, location_href.length - 8 - 1);
    })

    window.addEventListener('popstate', function(event) {
      if ( event.isTrusted && event.state !== null ) {
        self._ignoreHistory = true;
        self.gotoPage(event.state.cfi);
      }
    })
  },

  // _onResize: function() {
  //   if ( ! this._resizeRequest ) {
  //     this._resizeRequest = Util.requestAnimFrame(function() {
  //       this.invalidateSize({})
  //     }, this);
  //   }
  // },

  _onScroll: function () {
    this._container.scrollTop  = 0;
    this._container.scrollLeft = 0;
  },

  _handleDOMEvent: function (e) {
    if (!this._loaded || DomEvent.skipped(e)) { return; }

    var type = e.type === 'keypress' && e.keyCode === 13 ? 'click' : e.type;

    if (type === 'mousedown') {
      // prevents outline when clicking on keyboard-focusable element
      DomUtil.preventOutline(e.target || e.srcElement);
    }

    this._fireDOMEvent(e, type);
  },

  _fireDOMEvent: function (e, type, targets) {

    if (e.type === 'click') {
      // Fire a synthetic 'preclick' event which propagates up (mainly for closing popups).
      // @event preclick: MouseEvent
      // Fired before mouse click on the map (sometimes useful when you
      // want something to happen on click before any existing click
      // handlers start running).
      var synth = Util.extend({}, e);
      synth.type = 'preclick';
      this._fireDOMEvent(synth, synth.type, targets);
    }

    if (e._stopped) { return; }

    // Find the layer the event is propagating from and its parents.
    targets = (targets || []).concat(this._findEventTargets(e, type));

    if (!targets.length) { return; }

    var target = targets[0];
    if (type === 'contextmenu' && target.listens(type, true)) {
      DomEvent.preventDefault(e);
    }

    var data = {
      originalEvent: e
    };

    if (e.type !== 'keypress') {
      var isMarker = (target.options && 'icon' in target.options);
      data.containerPoint = isMarker ?
          this.latLngToContainerPoint(target.getLatLng()) : this.mouseEventToContainerPoint(e);
      data.layerPoint = this.containerPointToLayerPoint(data.containerPoint);
      data.latlng = isMarker ? target.getLatLng() : this.layerPointToLatLng(data.layerPoint);
    }

    for (var i = 0; i < targets.length; i++) {
      targets[i].fire(type, data, true);
      if (data.originalEvent._stopped ||
        (targets[i].options.nonBubblingEvents && Util.indexOf(targets[i].options.nonBubblingEvents, type) !== -1)) { return; }
    }
  },

  getFixedBookPanelSize: function() {
    // have to make the book 
    var style = window.getComputedStyle(this._panes['book']);
    var h = this._panes['book'].clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom);
    var w = this._panes['book'].clientWidth - parseFloat(style.paddingRight) - parseFloat(style.paddingLeft);
    return { height: Math.floor(h * 1.00), width: Math.floor(w * 1.00) };
  },

  invalidateSize: function(options) {
    // TODO: IS THIS EVER USED?
    var self = this;

    if ( ! self._drawn ) { return; }

    Util.cancelAnimFrame(this._resizeRequest);

    if (! this._loaded) { return this; }

    this.fire('resized');
  },

  _resizeBookPane: function() {

  },

  _setupHooks: function() {

  },

  _checkFeatureCompatibility: function() {
    if ( ! DomUtil.isPropertySupported('columnCount') || this._checkMobileDevice() ) {
      // force
      this.options.flow = 'scrolled-doc';
    }
    if ( this._checkMobileDevice() ) {
      this.options.fontSizeLarge = '160%';
      this.options.fontSizeSmall ='100%';
      this.options.fontSizeDefault = '120%';
    }
  },

  _checkMobileDevice: function() {
    if ( this._isMobile === undefined ) {
      this._isMobile = false;
      if ( this.options.mobileMediaQuery ) {
        this._isMobile = window.matchMedia(this.options.mobileMediaQuery).matches;
      }
    }
    return this._isMobile;
  },

  _initLoader: function() {
    // is this not awesome?
    var template = `<div class="socket">
      <div class="gel center-gel">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c1 r1">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c2 r1">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c3 r1">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c4 r1">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c5 r1">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c6 r1">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      
      <div class="gel c7 r2">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      
      <div class="gel c8 r2">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c9 r2">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c10 r2">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c11 r2">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c12 r2">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c13 r2">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c14 r2">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c15 r2">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c16 r2">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c17 r2">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c18 r2">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c19 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c20 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c21 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c22 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c23 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c24 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c25 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c26 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c28 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c29 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c30 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c31 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c32 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c33 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c34 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c35 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c36 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
      <div class="gel c37 r3">
        <div class="hex-brick h1"></div>
        <div class="hex-brick h2"></div>
        <div class="hex-brick h3"></div>
      </div>
    </div>`;

    var body = new DOMParser().parseFromString(template, "text/html").body;
    while ( body.children.length ) {
      this._panes['loader'].appendChild(body.children[0]);
    }
  },

  EOT: true
});

export function createReader(id, options) {
  return new Reader(id, options);
}
