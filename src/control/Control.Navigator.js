import {Control} from './Control';
import {Reader} from '../reader/Reader';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';

export var Navigator = Control.extend({
  onAdd: function(reader) {
    var container = this._container;
    if ( container ) {
      this._control = container.querySelector("[data-target=navigator]");
    } else {

      var className = this._className('navigator'),
          options = this.options;
      container = DomUtil.create('div', className),

      this._control  = this._createControl(className, container);
    }
    this._bindEvents(container);

    return container;
  },

  _createControl: function (className, container) {
    // var input = DomUtil.create('input', className, container);
    // input.setAttribute('type', 'range');
    // input.setAttribute('min', 0);
    // input.setAttribute('max', 100);
    // input.setAttribute('step', 1);
    // input.setAttribute('value', 0);
    // input.setAttribute('aria-label','Slider navigator');

    var template = `<div class="range">
        <input class="range__input" id="input-range" type="range" name="range-value" min="0" max="100" value="0" data-background-position="0" />
        <label class="range__tooltip" id="tooltip" for="input-range" style="visibility: hidden">
          <span class="range__tooltip__amount" id="tooltip-value">0</span>
        </label>
        <div class="range__background" id="range__background"></div>
      </div>
      <div class="status"><span class="currentPercentage">0%</span> • Location <span class="currentLocation">0</span> of <span class="totalLocations">100</span></div>
    `;

    var body = new DOMParser().parseFromString(template, "text/html").body;
    while ( body.children.length ) {
      container.appendChild(body.children[0]);
    }

    var input = container.querySelector("input");

    return input;
  },

  _bindEvents: function(container) {
    var self = this;
    // DomEvent.disableClickPropagation(this._control);
    // DomEvent.on(this._control, 'click', DomEvent.stop);
    // DomEvent.on(this._control, 'click', this._action, this);

    this._tooltip = container.querySelector("#tooltip");

    this._control.addEventListener("input", function() {
      console.log("AHOY RANGE INPUT EVENT", self._control.value);
      self._update();
    }, false);
    this._control.addEventListener("change", function() { console.log("AHOY RANGE ACTION", self._control.value); self._action(); }, false);
    this._control.addEventListener("mousedown", function(){
        self._mouseDown = true;
        // if ( self._t ) { clearTimeout(self._t); }
        // self._tooltip.style.visibility = 'visible';
    }, false);
    this._control.addEventListener("mouseup", function(){
        // self._tooltip.style.visibility = 'hidden';
        // self._t = setTimeout(function() {
        //   self._tooltip.style.visibility = 'hidden';
        // }, 500);
        self._mouseDown = false;
    }, false);

    // this._control.addEventListener("mousemove", function(e) {
    //   if ( ! self._mouseDown ) {
    //     // console.log("AHOY AHOY", e);
    //     var marginLeft = parseFloat(window.getComputedStyle(self._container.querySelector(".range")).marginLeft);
    //     var left = Math.floor(parseFloat(window.getComputedStyle(self._tooltip).left) + marginLeft);
    //     var innerSpan = self._tooltip.querySelector("span");
    //     var width = parseFloat(window.getComputedStyle(innerSpan).width);
    //     // var right = parseFloat(window.getComputedStyle(self._tooltip).right);
    //     if ( e.shiftKey || ( e.clientX  >= ( left - 25 ) && e.clientX <= ( left + width + 25 ) ) ) {
    //       self._tooltip.style.visibility = 'visible';
    //       if ( self._t ) { clearTimeout(self._t); }
    //       self._t = setTimeout(function() {
    //         self._tooltip.style.visibility = 'hidden';
    //       }, 500);
    //     } else {
    //       self._tooltip.style.visibility = 'hidden';
    //     }
    //     // console.log("AHOY RANGE HOVER ENTER", e.clientX, left, width, e.clientX >= ( left - 25 ) && e.clientX <= ( left + width + 25 ));
    //   }
    // }, false);

    // this._control.addEventListener("mouseleave", function() {
    //   if ( ! self._mouseDown ) {
    //     // self._tooltip.style.visibility = 'hidden';
    //   }
    // }, false);

    this._reader.on('update-locations', function(locations) {
      console.log("AHOY NEW LOCATIONS", locations);
      self._control.setAttribute('max', self._reader.locations.length());
      self._initiated = true;
      self._control.value = self._reader.locations.locationFromCfi(self._reader.currentLocation().start.cfi);
      self._control.dataset.value = self._control.value;
      self._last_value = self._control.value;
      self._update();
      setTimeout(function() {
        // self._container.style.visibility = 'visible';
        DomUtil.addClass(self._container, 'initialized');
      }, 0);
    })

    this._reader.on('relocated', function(location) {
      if ( ! self._initiated ) { return; }
      // var percent = self._reader.locations.percentageFromCfi(location.start.cfi);
      // var currentLocation = self._reader.locations.locationFromCfi(location.start.cfi);
      // var percentage = Math.floor(percent * 100);
      if ( ! self._mouseDown ) {
        self._control.value = self._reader.locations.locationFromCfi(location.start.cfi);
        console.log("AHOY RELOCATED", location.start.cfi, self._control.value);
        // self._control.dataset.currentLocation = currentLocation;
        self._update();
      }
    })

    window.fna = function() {
      var locations = self._reader.locations;
      var value = self._control.value;
      var previousValue = self._control.dataset.previousValue;
      var current = self._reader.currentLocation();
      var prev = locations.locationFromCfi(current.start.cfi);
      var next = locations.locationFromCfi(current.end.cfi);
      console.log("AHOY NOW", previousValue, "/", prev, "<=", value, "<=", next);
    };

  },

  // _action: function() {
  //   // var cfi = this._reader.locations.cfiFromPercentage(this._control.value / 100);
  //   // var new_cfi = this._reader.locations.cfiFromLocation(this._control.value);
  //   var value = this._control.value;
  //   var current = this._reader.currentLocation();
  //   var locations = this._reader.locations;
  //   console.log("AHOY INACTION ?", locations.locationFromCfi(current.start.cfi), '<=', value, locations.locationFromCfi(current.end.cfi));
  //   if ( locations.locationFromCfi(current.start.cfi) <= value && locations.locationFromCfi(current.end.cfi) >= value ) {
  //     console.log("AHOY INACTION", locations.locationFromCfi(current.start.cfi), '<=', value, locations.locationFromCfi(current.end.cfi));
  //     // NOOP
  //   } else {
  //     var tmp = locations.cfiFromLocation(value).split(",");
  //     var cfi = tmp[0] + tmp[1] + ")";
  //     console.log("AHOY ACTION", this._control.value, cfi);
  //     this._reader.gotoPage(cfi);
  //   }
  // },

  _action: function() {
    var locations = this._reader.locations;
    var value = this._control.value;
    var current = this._reader.currentLocation();
    var prev = locations.locationFromCfi(current.start.cfi);
    var next = locations.locationFromCfi(current.end.cfi);
    if ( prev <= value && next >= value ) {
      // would be a NOP
      var original_value = value;
      value = this._last_delta ? prev - 1 : next + 1;
      console.log("AHOY ACTION", prev, '<=', original_value, '<=', next, "/", this._last_delta, ":", value);
    }
    var cfi = locations.cfiFromLocation(value);
    if ( cfi != '-1' ) {
      this._reader.gotoPage(cfi);
      // this._control.dataset.previousValue = value;
    }
  },

  _update: function() {
    var self = this;
    var rangeMax = this._reader.locations.length();
    var valuePos;
    var finalPos;
    var tooltipOffset;
    var thumbWidth = 16;

    var tooltip = self._container.querySelector("#tooltip");
    var tooltipVal = self._container.querySelector("#tooltip-value");
    var rangeBg = self._container.querySelector("#range__background");
    var range = self._control;

    var value = parseInt(range.value, 10);

    var spanPercentage = self._container.querySelector(".currentPercentage");
    var spanCurrentLocation = self._container.querySelector(".currentLocation");
    var spanTotalLocations = self._container.querySelector(".totalLocations");

    // var percentage = Math.ceil(( value / rangeMax ) * 100);
    var percentage = value / rangeMax;
    if ( percentage < 0.5 ) { percentage = Math.ceil(percentage * 100); }
    else { percentage = Math.floor(percentage * 100); }

    var calcPosContainer = function(val) {
      valuePos = ((val * 100) / rangeMax);
      tooltipOffset = Math.ceil(thumbWidth / 2) - ((valuePos * thumbWidth) / 100);
      console.log("AHOY POS", val, valuePos, tooltipOffset);
      finalPos = 'left: calc(' + valuePos + '% + ' + calcEm(tooltipOffset, 16) + 'em);';
      // finalPos = 'calc(' + valuePos + '% + ' + calcEm(tooltipOffset, 16) + 'em);';
      return finalPos;
    };
    var calcEm = function(pxSize, fontBase) {
      return (pxSize / fontBase);
    };

    // tooltipVal.innerHTML = percentage + '%';
    // var tooltipValOffset = calcEm(thumbWidth, 16) - (percentage / 50);
    // tooltip.setAttribute('style', calcPosContainer(range.value) + 'visibility:' + tooltip.style.visibility + ';');
    rangeBg.setAttribute('style', 'background-position: ' + (-percentage) + '% 0%, left top;');
    self._control.setAttribute('data-background-position', Math.ceil(percentage));
    // tooltipVal.setAttribute('style', 'transform: translate(calc(-' + percentage + '% - ' + tooltipValOffset + 'em), -50%);');

    spanPercentage.innerHTML = percentage + '%';
    spanTotalLocations.innerHTML = self._reader.locations.length();
    // spanCurrentLocation.innerHTML = Math.ceil(self._reader.locations.length() * percentage / 100); // self._control.dataset.currentLocation;
    spanCurrentLocation.innerHTML = value + 1; // self._control.dataset.currentLocation;
    self._last_delta = self._last_value > value; self._last_value = value;

  },

  EOT: true
});

export var navigator = function(options) {
  return new Navigator(options);
}
