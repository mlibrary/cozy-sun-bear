import {Control} from './Control';
import {Reader} from '../reader/Reader';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';

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

    if ( self._reader.metadata.layout == 'pre-paginated' ) {
      // something else
    } else {

      template += `<fieldset class="cozy-fieldset-text_size">
        <legend>Text Size</legend>
        <div class="preview--text_size">
          ‘Yes, that’s it,’ said the Hatter with a sigh: ‘it’s always tea-time, and we’ve no time to wash the things between whiles.’
        </div>
        <p style="white-space: no-wrap">
          <span>T-</span>
          <input name="text_size" type="range" id="preferences-input-text_size" value="100" min="50" max="400" step="10" style="width: 75%" />
          <span>T+</span>
        </p>
        <p>
          <span>Text Size: </span>
          <output for="preferences-input-text_size" id="output-text_size">100</output>
        </p>
      </fieldset>`;
    }

    template += `<fieldset>
        <legend>Text Display</legend>
        <label><input name="flow" type="radio" id="preferences-input-paginated" value="paginated" />Page-by-Page</label>
        <label><input name="flow" type="radio" id="preferences-input-scrolled-doc" value="scrolled-doc" />Scroll</label>
      </fieldset>`;

    if ( this._reader.options.themes && this._reader.options.themes.length > 0 ) {
      self.options.hasThemes = true;
      template += `<fieldset>
        <legend>Theme</legend>
        <label><input name="theme" type="radio" id="preferences-input-theme-default" value="default" />Default</label>`;
      
      this._reader.options.themes.forEach(function(theme) {
        template += `<label><input name="theme" type="radio" id="preferences-input-theme-${theme.klass}" value="${theme.klass}" />${theme.name}</label>`
      })

      template += '</fieldset>';
    }

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
          template += `<label><input id="preferences-custom-${i}-${j}" type="radio" name="${field.name}" value="${input.value}" ${checked}/>${input.label}</label>`;
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
            self._updatePreferences(event);
          }
        }
      ],
      region: 'right'
    });

    this._form = this._modal._container.querySelector('form');
    this._initializeForm();
  },

  _initializeForm: function() {
    var input, input_id;
    this._lastValues = {};
    var flow = this._reader.options.flow;
    if ( flow == 'auto' ) { flow = 'paginated'; }
    input_id = "preferences-input-" + flow;
    input = this._form.querySelector("#" + input_id);
    input.checked = true;
    input.parentElement.parentElement.dataset.last = input.value;

    input_id = "preferences-input-text_size";
    input = this._form.querySelector('#' + input_id);
    var text_size = this._reader.options.text_size || 100;
    if ( text_size == 'auto' ) { text_size = 100; }
    input.value = text_size;
    input.parentElement.parentElement.dataset.last = input.value;

    var text_size_preview = this._form.querySelector('.preview--text_size');
    var text_size_output = this._form.querySelector('#output-text_size');
    var update_text_size_preview = function() {
      text_size_preview.style.fontSize = `${( parseInt(this.value, 10) / 100 )}em`;
      text_size_output.value = `${this.value}%`;
    }

    input.addEventListener('input', update_text_size_preview);
    input.addEventListener('change', update_text_size_preview);
    update_text_size_preview.bind(input).call();

    if ( this.options.hasThemes ) {
      input_id = "preferences-input-theme-" + ( this._reader.options.theme || 'default' );
      input = this._form.querySelector("#" + input_id);
      input.checked = true;
      input.parentElement.parentElement.dataset.last = input.value;
    }
  },

  _updatePreferences: function(event) {
    var self = this;
    event.preventDefault();

    var doUpdate = false;
    var options = {};
    var input = this._form.querySelector("input[name='flow']:checked");
    doUpdate = doUpdate || ( input.value != input.parentElement.parentElement.dataset.last );
    options.flow = input.value;
    input.parentElement.parentElement.dataset.last = input.value;

    input = this._form.querySelector("input[name='text_size']");
    doUpdate = doUpdate || ( input.value != input.parentElement.parentElement.dataset.last );
    options.text_size = input.value;
    input.parentElement.parentElement.dataset.last = input.value;

    if ( this.options.hasThemes ) {
      input = this._form.querySelector("input[name='theme']:checked");
      doUpdate = doUpdate || ( input.value != input.parentElement.parentElement.dataset.last );
      options.theme = input.value;
      input.parentElement.parentElement.dataset.last = input.value;
    }

    if ( this.options.hasFields ) {
      for(var i in this.options.fields) {
        var field = this.options.fields[i];
        var id = "preferences-custom-" + i;
        var input = this._form.querySelector(`input[name="${field.name}"]:checked`);
        if ( input.value != field.value ) {
          field.value = input.value;
          field.callback(field.value);
        }
      }
    }

    this._modal.deactivate();

    if ( doUpdate ) {
      setTimeout(function() {
        self._reader.saveOptions(options);
        self._reader.reopen(options);
      }, 100);
    }
  },

  EOT: true
});

export var preferences = function(options) {
  return new Preferences(options);
}
