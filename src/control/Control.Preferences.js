import {Class} from '../core/Class';
import {Control} from './Control';
import {Reader} from '../reader/Reader';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';
import * as Util from '../core/Util';

import assign from 'lodash/assign';
import keys from 'lodash/keys';

export var Preferences = Control.extend({
  options: {
    label: 'Preferences',
    hasThemes: false,
    html: '<i class="icon-cog oi" data-glyph="cog" title="Preferences and Settings" aria-hidden="true"></i>'
  },

  onAdd: function(reader) {
    var self = this;
    var className = this._className('preferences'),
        container = DomUtil.create('div', className),
        options = this.options;

    this._activated = false;
    this._control = this._createButton(options.html || options.label, options.label,
            className, container, this._action)

    this._createPanel();

    return container;
  },

  _action: function() {
    var self = this;
    self.initializeForm();
    self._modal.activate();
  },

  _createButton: function (html, title, className, container, fn) {
    var link = DomUtil.create('button', className, container);
    link.innerHTML = html;
    link.title = title;

    /*
     * Will force screen readers like VoiceOver to read this as "Zoom in - button"
     */
    link.setAttribute('role', 'button');
    link.setAttribute('aria-label', title);

    DomEvent.disableClickPropagation(link);
    DomEvent.on(link, 'click', DomEvent.stop);
    DomEvent.on(link, 'click', fn, this);

    return link;
  },

  _createPanel: function() {
    var self = this;
    var template = '';

    var possible_fieldsets = [];
    if ( this._reader.metadata.layout == 'pre-paginated' ) {
      // different panel
    } else {
      possible_fieldsets.push('TextSize');
    }
    possible_fieldsets.push('Display');

    if ( this._reader.options.themes && this._reader.options.themes.length > 0 ) {
      this.options.hasThemes = true;
      possible_fieldsets.push('Theme');
    }

    this._fieldsets = [];
    possible_fieldsets.forEach(function(cls) {
      var fieldset = new Preferences.fieldset[cls](this);
      template += fieldset.template();
      this._fieldsets.push(fieldset);
    }.bind(this))

    if ( this.options.fields ) {
      this.options.hasFields = true;
      for(var i in this.options.fields) {
        var field = this.options.fields[i];
        var id = "preferences-custom-" + i;
        template += `<fieldset class="custom-field">
          <legend>${field.label}</legend>
        `;
        for(var j in field.inputs) {
          var input = field.inputs[j];
          var checked = input.value == field.value ? ' checked="checked"' : '';
          template += `<label><input id="preferences-custom-${i}-${j}" type="radio" name="x${field.name}" value="${input.value}" ${checked}/>${input.label}</label>`;
        }
        if ( field.hint ) {
          template += `<p class="hint" style="font-size: 90%">${field.hint}</p>`;
        }
      }
    }

    template = '<form>' + template + '</form>';

    this._modal = this._reader.modal({
      template: template,
      title: 'Preferences',
      className: 'cozy-modal-preferences',
      actions: [
        {
          label: 'Save Changes',
          callback: function(event) {
            self.updatePreferences(event);
          }
        }
      ],
      region: 'right'
    });

    this._form = this._modal._container.querySelector('form');
  },

  initializeForm: function() {
    this._fieldsets.forEach(function(fieldset) {
      fieldset.initializeForm(this._form);
    }.bind(this));
  },

  updatePreferences: function(event) {
    event.preventDefault();

    var doUpdate = false;
    var new_options = {};
    this._fieldsets.forEach(function(fieldset) {
      // doUpdate = doUpdate || fieldset.updateForm(this._form, new_options);
      assign(new_options, fieldset.updateForm(this._form));
    }.bind(this));

    if ( this.options.hasFields ) {
      for(var i in this.options.fields) {
        var field = this.options.fields[i];
        var id = "preferences-custom-" + i;
        var input = this._form.querySelector(`input[name="x${field.name}"]:checked`);
        if ( input.value != field.value ) {
          field.value = input.value;
          field.callback(field.value);
        }
      }
    }

    this._modal.deactivate();

    setTimeout(function() {
      this._reader.saveOptions(new_options);
      this._reader.reopen(new_options);
    }.bind(this), 100);
  },

  EOT: true
});

Preferences.fieldset = {};

var Fieldset = Class.extend({

  options: {},

  initialize: function (control, options) {
      Util.setOptions(this, options);
      this._control = control;
      this._current = {};
      this._id = (new Date()).getTime() + '-' + parseInt(Math.random((new Date()).getTime()) * 1000, 10);
  },

  template: function() {

  },

  EOT: true


});

Preferences.fieldset.TextSize = Fieldset.extend({

  initializeForm: function(form) {
    if ( ! this._input ) {
      this._input = form.querySelector(`#x${this._id}-input`);
      this._output = form.querySelector(`#x${this._id}-output`);
      this._preview = form.querySelector(`#x${this._id}-preview`);

      this._input.addEventListener('input', this._updatePreview.bind(this));
      this._input.addEventListener('change', this._updatePreview.bind(this));
    }

    var text_size = this._control._reader.options.text_size || 100;
    if ( text_size == 'auto' ) { text_size = 100; }
    this._current.text_size = text_size;
    this._input.value = text_size;
    this._updatePreview();
  },

  updateForm: function(form) {
    return { text_size: this._input.value };
    // options.text_size = this._input.value;
    // return ( this._input.value != this._current.text_size );
  },

  template: function() {
    return `<fieldset class="cozy-fieldset-text_size">
        <legend>Text Size</legend>
        <div class="preview--text_size" id="x${this._id}-preview">
          ‘Yes, that’s it,’ said the Hatter with a sigh: ‘it’s always tea-time, and we’ve no time to wash the things between whiles.’
        </div>
        <p style="white-space: no-wrap">
          <span>T-</span>
          <input name="text_size" type="range" id="x${this._id}-input" value="100" min="50" max="400" step="10" style="width: 75%" />
          <span>T+</span>
        </p>
        <p>
          <span>Text Size: </span>
          <output for="preferences-input-text_size" id="x${this._id}-output">100</output>
        </p>
      </fieldset>`;
  },

  _updatePreview: function() {
    this._preview.style.fontSize = `${( parseInt(this._input.value, 10) / 100 )}em`;
    this._output.value = `${this._input.value}%`;
  },

  EOT: true

});

Preferences.fieldset.Display = Fieldset.extend({

  initializeForm: function(form) {
    var flow = this._control._reader.options.flow || this._control._reader.metadata.flow || 'paginated';
    if ( flow == 'auto' ) { flow = 'paginated'; }

    var input = form.querySelector(`#x${this._id}-input-${flow}`);
    input.checked = true;
    this._current.flow = flow;

  },

  updateForm: function(form) {
    var input = form.querySelector(`input[name="x${this._id}-flow"]:checked`);
    return { flow: input.value };
  },

  template: function() {
    return `<fieldset>
            <legend>Display</legend>
            <label><input name="x${this._id}-flow" type="radio" id="x${this._id}-input-paginated" value="paginated" />Page-by-Page</label>
            <label><input name="x${this._id}-flow" type="radio" id="x${this._id}-input-scrolled-doc" value="scrolled-doc" />Scroll</label>
          </fieldset>`;
  },

  EOT: true

});

Preferences.fieldset.Theme = Fieldset.extend({

  initializeForm: function(form) {
    var theme = this._control._reader.options.theme || 'default';

    var input = form.querySelector(`#x${this._id}-input-theme-${theme}`);
    input.checked = true;
    this._current.theme = theme;
  },

  updateForm: function(form) {
    var input = form.querySelector(`input[name="x${this._id}-theme"]:checked`);
    return { theme: input.value };
  },

  template: function() {
    var template = `<fieldset>
            <legend>Theme</legend>
            <label><input name="x${this._id}-theme" type="radio" id="x${this._id}-input-theme-default" value="default" />Default</label>`;

    this._control._reader.options.themes.forEach(function(theme) {
      template += `<label><input name="x${this._id}-theme" type="radio" id="x${this._id}-input-theme-${theme.klass}" value="${theme.klass}" />${theme.name}</label>`
    }.bind(this));

    template += '</fieldset>';

    return template;

  },

  EOT: true

});

export var preferences = function(options) {
  return new Preferences(options);
}
