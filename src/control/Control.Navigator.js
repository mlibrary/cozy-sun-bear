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
      <div class="cozy-navigator-range__status"><span class="currentPercentage">0%</span> • Location <span class="currentLocation">0</span> of <span class="totalLocations">?</span><span class="currentPageLabel"></span></div>
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
      self._update();
    }, false);
    this._control.addEventListener("change", function(e) { self._action(); }, false);
    this._control.addEventListener("mousedown", function(){
        self._mouseDown = true;
    }, false);
    this._control.addEventListener("mouseup", function(){
        self._mouseDown = false;
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
      if ( ! self._initiated ) { return ; }
      if ( ! ( location && location.start && location.start.cfi ) ) { return ; }
      var value = Math.ceil(self._reader.locations.percentageFromCfi(location.start.cfi) * 10000) / 100.0;
      console.log("AHOY NAVIGATOR relocated", location, value, self._control.value);
      if ( true || value != self._control.value ) {
        self._control.value = value;
        self._update(location);
      }
    })

    this._reader.on('xxrelocated', function(location) {
      console.log("AHOY NAVIGATOR relocated", location, self._initiated, self._mouseDown);
      if ( ! self._initiated ) { return; }
      if ( ! self._mouseDown ) {
        var cfi = location.start && location.start.cfi ? location.start.cfi : location.start;
        self._control.value = Math.ceil(self._reader.locations.percentageFromCfi(cfi) * 100);
        self._update();
      }
    })

  },

  _action: function() {
    var value = this._control.value;
    var locations = this._reader.locations;
    var cfi = locations.cfiFromPercentage(value / 100);
    this._reader.tracking.action("navigator/go");
    this._reader.display(cfi);
  },

  _update: function(current) {
    var self = this;

    if ( ! current ) { current = this._reader.currentLocation(); }
    if ( ! current || ! current.start ) {
      setTimeout(function() {
        this._update();
      }.bind(this), 100);
      return;
    }

    console.log("AHOY NAVIGATOR update", current.start.cfi);

    // check this early to avoid emitting events
    var current_location = this._reader.locations.locationFromCfi(current.start.cfi);
    if ( current_location == this._last_reported_location ) {
      return;
    }
    this._last_reported_location = current_location;

    var rangeBg = this._background;
    var range = self._control;

    var value = parseFloat(range.value, 10);
    var percentage = value;

    rangeBg.setAttribute('style', 'background-position: ' + (-percentage) + '% 0%, left top;');
    self._control.setAttribute('data-background-position', Math.ceil(percentage));

    this._spanCurrentPercentage.innerHTML = percentage + '%';
    this._spanCurrentLocation.innerHTML = ( current_location );

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
        var span = '';
        if ( pageLabels.length ) {
          span = ` (${label} ${pageLabels.join('-')})`;
        }
        this._spanCurrentPageLabel.innerHTML = span;
      }

      range.setAttribute('aria-valuenow', value);
      range.setAttribute('aria-valuetext', `${value}% • Location ${current_location} of ${this._total}`);

    var message = `Location ${current_location}; ${percentage}%`;
    this._reader.updateLiveStatus(message);

    self._last_delta = self._last_value > value; self._last_value = value;
  },

  _initializeNavigator: function(locations) {
    console.log("AHOY updateLocations PROCESSING LOCATION");
    this._initiated = true;

    if ( ! this._reader.pageList ) {
      this._spanCurrentPageLabel.style.display = 'none';
    }

    this._total = this._reader.locations.total;
    if ( this._reader.currentLocation() && this._reader.currentLocation().start ) {
      this._control.value = Math.ceil(this._reader.locations.percentageFromCfi(this._reader.currentLocation().start.cfi) * 100);
      this._last_value = this._control.value;
    } else {
      this._last_value = this._control.value;
    }

    this._spanTotalLocations.innerHTML = this._total;

    this._update();
    setTimeout(function() {
      DomUtil.addClass(this._container, 'initialized');
    }.bind(this), 0);
  },

  EOT: true
});

export var navigator = function(options) {
  return new Navigator(options);
}
