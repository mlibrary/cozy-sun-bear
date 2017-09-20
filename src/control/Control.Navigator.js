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
    var input = DomUtil.create('input', className, container);
    input.setAttribute('type', 'range');
    input.setAttribute('min', 0);
    input.setAttribute('max', 100);
    input.setAttribute('step', 1);
    input.setAttribute('value', 0);

    return input;
  },

  _bindEvents: function() {
    var self = this;
    // DomEvent.disableClickPropagation(this._control);
    // DomEvent.on(this._control, 'click', DomEvent.stop);
    // DomEvent.on(this._control, 'click', this._action, this);

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
      }
    })

  },

  _action: function() {
    var cfi = this._reader.locations.cfiFromPercentage(this._control.value / 100);
    this._reader.gotoPage(cfi);
  },

  EOT: true
});

export var navigator = function(options) {
  return new Navigator(options);
}

