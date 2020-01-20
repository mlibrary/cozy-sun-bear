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
        <input class="cozy-navigator-range__input" id="cozy-navigator-range-input" type="range" name="locations-range-value" min="0" max="100" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0% • Location 0 of ?" value="0" data-background-position="0" />
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
    this._control.addEventListener("change", function() { self._action(); }, false);
    this._control.addEventListener("mousedown", function(){
        self._mouseDown = true;
    }, false);
    this._control.addEventListener("mouseup", function(){
        self._mouseDown = false;
    }, false);
    this._control.addEventListener("keydown", function(){
      self._mouseDown = true;
    }, false);
    this._control.addEventListener("keyup", function(){
      self._mouseDown = false;
    }, false);

    this._reader.on('relocated', function(location) {
      if ( ! self._initiated ) { return; }
      if ( ! self._mouseDown ) {
        var a = location;
        // location = self._reader.currentLocation();
        // console.log("AHOY RELOCATED", a, location);
        self._control.value = Math.ceil(self._reader.locations.percentageFromCfi(location.start.cfi) * 100);
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

  _update: function() {
    var self = this;

    var current = this._reader.currentLocation();
    if ( ! current || ! current.start ) {
      setTimeout(function() {
        this._update();
      }.bind(this), 100);
      return;
    }

    var rangeBg = this._background;
    var range = self._control;

    var value = parseInt(range.value, 10);
    var percentage = value;

    // if ( current.start.location != this._last_reported_location ) {
    //   this._last_reported_location = current.start.location;
    //   var message = `Location ${current.start.location}; ${percentage}%`;
    //   this._reader.updateLiveStatus(message);
    // }

    rangeBg.setAttribute('style', 'background-position: ' + (-percentage) + '% 0%, left top;');
    self._control.setAttribute('data-background-position', Math.ceil(percentage));

    this._spanCurrentPercentage.innerHTML = percentage + '%';
    if ( current && current.start ) {
      var current_location = this._reader.locations.locationFromCfi(current.start.cfi);
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
        this._spanCurrentPageLabel.innerHTML = ` (${label} ${pageLabels.join('-')})`;
      }

      range.setAttribute('aria-valuenow', value);
      range.setAttribute('aria-valuetext', `${value}% • Location ${current_location} of ${this._total}`);

      if ( current_location != this._last_reported_location ) {
        this._last_reported_location = current_location;
        var message = `Location ${current_location}; ${percentage}%`;
        this._reader.updateLiveStatus(message);
      }
    }
    self._last_delta = self._last_value > value; self._last_value = value;
  },

  _initializeNavigator: function(locations) {
    console.log("AHOY updateLocations PROCESSING LOCATION");
    this._initiated = true;

    if ( ! this._reader.pageList ) {
      this._spanCurrentLocation.style.display = 'none';
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
