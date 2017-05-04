import {Control} from './Control';
import {Reader} from '../reader/Reader';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';

export var Preferences = Control.extend({
  options: {
    label: 'Preferences',
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
    this._panel.style.display = 'block';
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
    var template = `<div class="cozy-modal cozy-preferences-modal" style="position: fixed; width: 300px; margin-left: -150px; left: 50%; top: 50%; transform: translateY(-50%); z-index: 9000; display: none">
      <header>
        <h2>Preferences</h2>
      </header>
      <article>
        <form>
          <fieldset>
            <legend>Text Display</legend>
            <label><input name="flow" type="radio" id="preferences-input-reflowable" value="auto" />Two Column</label>
            <label><input name="flow" type="radio" id="preferences-input-scrollable" value="scrolled-doc" />One Column</label>
          </fieldset>
        </form>
      </article>
      <footer>
      </footer>
    </div>`;
    this._panel = new DOMParser().parseFromString(template, "text/html").body.firstChild;
    this._reader._container.appendChild(this._panel);

    var input_id = "preferences-input-" + ( this._reader.options.flow == 'scrollable' ? 'scrollable' : 'reflowable' );
    var input = this._panel.querySelector("#" + input_id);
    input.checked = true;

    var footer = this._panel.querySelector("footer");
    this._cancelButton = this._createButton('X', 'Close preferences without saving', 'close', footer, this._cancelAction);
    this._saveButton = this._createButton('Save', 'Save Preferences', 'button--sm', footer, this._saveAction);
  },

  _cancelAction: function() {
    this._panel.style.display = 'none';
  },

  _saveAction: function() {
    var input = this._panel.querySelector("input[type=radio]:checked");
    var flow = input.value;
    this._panel.style.display = 'none';
    this._reader.switch(flow);
  },

  EOT: true
});

export var preferences = function(options) {
  return new Preferences(options);
}
