import {Control} from './Control';
import {Reader} from '../reader/Reader';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';

export var Navigator = Control.extend({
  onAdd: function(reader) {
    var container = this._container;
    if ( container ) {
    } else {

      var className = this._className('navigator'),
          options = this.options;
      
      container = DomUtil.create('div', className);
    }
    this._setup(container);

    this._reader.on('updateLocations', function(locations) {      
      this._initializeNavigator(locations);
    }.bind(this));

    return container;
  },

  _setup: function(container) {
    this._control = container.querySelector("input[type=range]");
    if ( ! this._control ) {
      this._createControl(container);
    }
    this._background = container.querySelector(".cozy-navigator-range__background");
    this._status = container.querySelector(".cozy-navigator-range__status");
    this._spanCurrentPercentage = container.querySelector(".currentPercentage");
    this._spanCurrentLocation = container.querySelector(".currentLocation");
    this._spanTotalLocations = container.querySelector(".totalLocations");
    this._spanCurrentPageLabel = container.querySelector('.currentPageLabel');

    this._bindEvents();
  },

  _createControl: function (container) {
    var template = `<div class="cozy-navigator-range">
        <label class="u-screenreader" for="cozy-navigator-range-input">Location: </label>
        <input class="cozy-navigator-range__input" id="cozy-navigator-range-input" type="range" name="locations-range-value" min="0" max="100" step="1" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0% • Location 0 of ?" value="0" data-background-position="0" />
        <div class="cozy-navigator-range__background"></div>
      </div>
      <div class="cozy-navigator-range__status"><span class="currentPercentage">0%</span><span> • </span><span>Location <span class="currentLocation">0</span> of <span class="totalLocations">?</span><span class="currentPageLabel"></span></span></div>
    `;

    var body = new DOMParser().parseFromString(template, "text/html").body;
    while ( body.children.length ) {
      container.appendChild(body.children[0]);
    }

    this._control = container.querySelector("input[type=range]");
  },

  _bindEvents: function() {
    var self = this;

    this._control.addEventListener("input", function() {
      self._update(false);
    }, false);
    this._control.addEventListener("change", function(event) { if ( self._mouseDown ) { return ; }; self._action(); }, false);
    this._control.addEventListener("mousedown", function(event){
        self._mouseDown = true;
        self._container.classList.add('updating');
    }, false);
    this._control.addEventListener("mouseup", function(){
        self._mouseDown = false;
        self._container.classList.remove('updating');
        self._update();
        // self._ignore = false;
        console.log("AHOY AHOY MOUSEUP");
        // self._action();
    }, false);
    this._control.addEventListener("keydown", function(){
      // console.log("AHOY NAVIGATOR keydown", event);
      // self._mouseDown = true;
    }, false);
    this._control.addEventListener("keyup", function(){
      // console.log("AHOY NAVIGATOR keyup", event);
      // self._mouseDown = false;
    }, false);

    this._reader.on('relocated', function(location) {
      var value; var percentage;
      console.log("AHOY AHOY RELOCATED");
      if ( ! self._initiated ) { return ; }
      if ( self._ignore ) { self._ignore = false; console.log("AHOY IGNORING", self._ignore); return; }
      if ( ! ( location && location.start ) ) { return ; }

      var value;
      if ( location.start && location.end ) {
        // EPUB
        value = parseInt(self._control.value, 10);
        var start = parseInt(location.start.location, 10);
        var end = parseInt(location.end.location, 10);
        console.log("AHOY NAVIGATOR relocated", value, start, end, value < start, value > end);
        if ( value < start || value > end ) {
          self._last_value = value;
          self._control.value = ( value < start ) ? start : end;
        }
      } else {
        value = self._parseLocation(location);
        self._last_value = value;
        self._control.value = value;
      }

      self._update(location);
    })
  },

  _action: function() {
    var value = parseInt(this._control.value, 10);
    var cfi;
    var locations = this._reader.locations;
    if ( locations.cfiFromLocation ) {
      cfi = locations.cfiFromLocation(value);
    } else {
      // hopefully short-term compatibility
      var percent = value / this._total;
      cfi = locations.cfiFromPercentage(percent);
    }
    this._reader.tracking.action("navigator/go");
    this._ignore = true;
    this._reader.gotoPage(cfi);
  },

  _update: function(current) {
    var self = this;

    if ( ! this._initiated ) { return ; }

    var rangeBg = this._background;
    var range = self._control;

    var value = parseFloat(range.value, 10);
    var current_location = value;

    var max = parseFloat(range.max, 10);
    var percentage = (( value / max ) * 100.0)

    rangeBg.setAttribute('style', 'background-position: ' + (-percentage) + '% 0%, left top;');
    percentage = Math.ceil(percentage);
    this._spanCurrentPercentage.innerHTML = percentage + '%';

    if ( current === false ) { return; }
    if ( ! current ) { current = this._reader.currentLocation(); }

    if ( current_location == this._last_reported_location ) {
      return;
    }
    this._last_reported_location = current_location;

    self._control.setAttribute('data-background-position', percentage);
    this._spanCurrentLocation.innerHTML = ( current_location );

    var current_page = '';
    if ( this._reader.pageList ) {
      var pages = this._reader.pageList.pagesFromLocation(current);
      var pageLabels = [];
      var label = 'p.';
      if ( pages.length ) {
        var p1 = pages.shift();
        pageLabels.push(this._reader.pageList.pageLabel(p1));
        if ( pages.length ) {
          var p2 = pages.pop();
          pageLabels.push(this._reader.pageList.pageLabel(p2));
          label = 'pp.';
        }
      }
      if ( pageLabels.length ) {
        current_page = ` (${label} ${pageLabels.join('-')})`;
      }
      this._spanCurrentPageLabel.innerHTML = current_page;
    }

    range.setAttribute('aria-valuenow', value);
    range.setAttribute('aria-valuetext', `${value}% • Location ${current_location} of ${this._total}${current_page}`);

    var message = `Location ${current_location}; ${percentage}%${current_page}`;
    this._reader.updateLiveStatus(message);
  },

  _initializeNavigator: function(locations) {
    this._initiated = true;

    if ( ! this._reader.pageList ) {
      this._spanCurrentPageLabel.style.display = 'none';
    }

    this._total = this._reader.locations.total;
    var max = this._total; var min = 1;
    if ( this._reader.locations.spine ) { max -= 1; min -= 1; }
    this._control.max = max; // setAttribute('max', max);
    this._control.min = min; // setAttribute('min', min);

    var current = this._reader.currentLocation();
    var value = this._parseLocation(current);
    this._control.value = value;
    this._last_value = this._control.value
    this._update(current);

    this._spanTotalLocations.innerHTML = this._total;

    setTimeout(function() {
      DomUtil.addClass(this._container, 'initialized');
    }.bind(this), 0);
  },

  _parseLocation: function(location) {
    var self = this;
    var value;

    if ( typeof(location.start) == 'object' ) {
      if ( location.start.location != null ) {
        value = location.start.location;
      } else {
        var percentage = self._reader.locations.percentageFromCfi(location.start.cfi);
        value = Math.ceil(self._total * percentage);
      }
    } else {
      // PDF bug
      value = parseInt(location.start, 10);
    }

    return value;
  },

  EOT: true
});

export var navigator = function(options) {
  return new Navigator(options);
}
