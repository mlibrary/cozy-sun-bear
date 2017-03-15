import * as Util from '../core/Util';
import {Evented} from '../core/Events';
import * as Browser from '../core/Browser';
import * as DomEvent from '../dom/DomEvent';
import * as DomUtil from '../dom/DomUtil';

import * as epubjs from '../epubjs'

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
    ]
  },

  initialize: function(id, options) {
    var self = this

    options = Util.setOptions(this, options);

    this._initContainer(id);
    this._initLayout();

    // hack for https://github.com/Leaflet/Leaflet/issues/1980
    this._onResize = Util.bind(this._onResize, this);

    this._initEvents();

    this.callInitHooks();

    var width = this._panes['book'].clientWidth;
    var height = this._panes['book'].clientHeight;

  },

  start: function() {
    var self = this;
    var panes = self._panes;

    panes['book'].style.height = (panes['book-cover'].clientHeight * 0.99) + 'px';
    panes['book'].style.width = (panes['book-cover'].clientWidth * 0.99) + 'px';

    var x = panes['book-cover']; var xx = panes['book'];
    console.log("AHOY START", x.clientWidth, x.clientHeight, "/", xx.clientWidth, xx.clientHeight, "/", xx.style.width, xx.style.height)

    this.book = epubjs.ePub(this.options.href);
    var rect = self._panes['book'].getBoundingClientRect();
    console.log("AHOY", rect, rect.width, rect.height, "/", self._panes['book'].clientWidth, self._panes['book'].clientHeight);
    this.rendition = this.book.renderTo(self._panes['book'], {
      width: '100%', // rect.width * 0.95,
      height: '100%', // rect.height * 0.90,
      ignoreClass: 'annotator-hl'
    });
    this.display(1);
  },

  next: function() {
    this.rendition.next();
  },

  prev: function() {
    this.rendition.prev();
  },

  display: function(index) {
    this.rendition.display(index);
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
      (this._fadeAnimated ? ' cozy-fade-anim' : ''));

    var position = DomUtil.getStyle(container, 'position');

    if (position !== 'absolute' && position !== 'relative' && position !== 'fixed') {
      container.style.position = 'relative';
    }

    this._initPanes();

    // if (this._initControlPos) {
    //   this._initControlPos();
    // }
  },

  _initPanes: function () {
    var self = this;

    var panes = this._panes = {};

    var l = 'cozy-';
    var container = this._container;

    DomUtil.addClass(container, 'cozy-container');
    panes['header'] = DomUtil.create('div', 'cozy-header', container);
    panes['main'] = DomUtil.create('div', 'cozy-main', container);
    panes['footer'] = DomUtil.create('div', 'cozy-footer', container);

    panes['book-cover'] = DomUtil.create('div', 'cozy-book-cover', panes['main']);
    panes['book'] = DomUtil.create('div', 'cozy-book', panes['book-cover']);
    // panes['book'].setAttribute('width', panes['book-cover'].clientWidth * 0.95);
    // panes['book'].setAttribute('height', panes['book-cover'].clientHeight * 0.95);
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
    onOff(this._container, 'click dblclick mousedown mouseup ' +
      'mouseover mouseout mousemove contextmenu keypress', this._handleDOMEvent, this);

    if (this.options.trackResize) {
      onOff(window, 'resize', this._onResize, this);
    }

    if (Browser.any3d && this.options.transform3DLimit) {
      (remove ? this.off : this.on).call(this, 'moveend', this._onMoveEnd);
    }
  },

  _onResize: function () {
    Util.cancelAnimFrame(this._resizeRequest);
    this._resizeRequest = Util.requestAnimFrame(
            function () { this.invalidateSize({debounceMoveend: true}); }, this);
  },

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

  EOT: true
});

export function createReader(id, options) {
  return new Reader(id, options);
}
