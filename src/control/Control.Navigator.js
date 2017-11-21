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
    this._bindEvents();

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

    var template = `<input class="range__input" id="input-range" type="range" name="range-value" min="0" max="100" value="0" data-background-position="0" />
      <label class="range__tooltip" id="tooltip" for="input-range">
        <span class="range__tooltip__amount" id="tooltip-value">0</span>
      </label>
      <div class="range__background" id="range__background"></div>
    `;

    var body = new DOMParser().parseFromString(template, "text/html").body;
    while ( body.children.length ) {
      container.appendChild(body.children[0]);
    }

    var input = container.querySelector("input");

    return input;
  },

  _bindEvents: function() {
    var self = this;
    // DomEvent.disableClickPropagation(this._control);
    // DomEvent.on(this._control, 'click', DomEvent.stop);
    // DomEvent.on(this._control, 'click', this._action, this);

    this._control.addEventListener("input", function() {
      self._update();
    }, false);
    this._control.addEventListener("change", function() { self._action(); }, false);
    this._control.addEventListener("mousedown", function(){
        this._mouseDown = true;
    }, false);
    this._control.addEventListener("mouseup", function(){
        this._mouseDown = false;
    }, false);

    this._reader.on('relocated', function(location) {
      var percent = self._reader.locations.percentageFromCfi(location.start.cfi);
      var percentage = Math.floor(percent * 100);
      if ( ! self._mouseDown ) {
        self._control.value = percentage;
        self._update();
      }
    })

  },

  _action: function() {
    var cfi = this._reader.locations.cfiFromPercentage(this._control.value / 100);
    this._reader.gotoPage(cfi);
  },

  _update: function() {
    var self = this;
    var rangeMax = 100;
    var valuePos;
    var finalPos;
    var tooltipOffset;
    var thumbWidth = 16;

    var tooltip = self._container.querySelector("#tooltip");
    var tooltipVal = self._container.querySelector("#tooltip-value");
    var rangeBg = self._container.querySelector("#range__background");
    var range = self._control;

    var percentage = range.value;

    var calcPosContainer = function(val) {
      valuePos = ((val * 100) / rangeMax);
      tooltipOffset = Math.ceil(thumbWidth / 2) - ((valuePos * thumbWidth) / 100);
      console.log("AHOY POS", val, valuePos, tooltipOffset);
      finalPos = 'left: calc(' + valuePos + '% + ' + calcEm(tooltipOffset, 16) + 'em);';
      return finalPos;
    };
    var calcEm = function(pxSize, fontBase) {
      return (pxSize / fontBase);
    };

    tooltipVal.innerHTML = percentage;
    var tooltipValOffset = calcEm(thumbWidth, 16) - (percentage / 50);
    tooltip.setAttribute('style', calcPosContainer(range.value));
    rangeBg.setAttribute('style', 'background-position: ' + (-percentage) + '% 0%, left top;');
    self._control.setAttribute('data-background-position', Math.ceil(percentage));
    tooltipVal.setAttribute('style', 'transform: translate(calc(-' + percentage + '% - ' + tooltipValOffset + 'em), -50%);');

  },

  EOT: true
});

export var navigator = function(options) {
  return new Navigator(options);
}
