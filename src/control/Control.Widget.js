import {Control} from './Control';
import {Reader} from '../reader/Reader';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';

export var Widget = Control.extend({

  defaultTemplate: `<button data-toggle="button" data-slot="title"></button>`,

  options: {
      // @option region: String = 'topright'
      // The region of the control (one of the reader corners). Possible values are `'topleft'`,
      // `'topright'`, `'bottomleft'` or `'bottomright'`
  },

  onAdd: function(reader) {
    var container = this._container;
    if ( container ) {
      // NOOP
    } else {

      var className = this._className(),
          options = this.options;

      container = DomUtil.create('div', className);

      var template = this.options.template || this.defaultTemplate;
      var body = new DOMParser().parseFromString(template, "text/html").body;
      while ( body.children.length ) {
        container.appendChild(body.children[0]);
      }

      this.state(this.options.states[0].stateName, container);

    }

    this._bindEvents(container);

    return container;
  },

  state: function(stateName, container) {
    container = container || this._container;
    this._resetState();
    this._state = this.options.states.filter(function(s) { return s.stateName == stateName })[0];
    if ( this._state.className ) {
      DomUtil.addClass(container, this._state.className);
    }
    if ( this._state.title ) {
      var element = container.querySelector("[data-slot=title]");
      element.innerHTML = this._state.title;
    }
  },

  _resetState: function() {
    if ( ! this._state ) { return; }
    if ( this._state.className ) {
      DomUtil.removeClass(this._container, this._state.className);
    }
  },

  _bindEvents: function(container) {
    var control = container.querySelector("[data-toggle=button]");
    if ( ! control ) { return ; }
    DomEvent.disableClickPropagation(control);
    DomEvent.on(control, 'click', DomEvent.stop);
    DomEvent.on(control, 'click', this._action, this);
  },

  _action: function() {
    this._state.onClick(this, this._reader);
  },

  EOT: true
});

export var widget = function(options) {
  return new Widget(options);
}
