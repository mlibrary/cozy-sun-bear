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
    var self = this;
    // this._panel.style.display = 'block';
    DomUtil.addClass(self._reader._container, 'st-effect-2');
    setTimeout(function() {
      DomUtil.addClass(self._reader._container, 'st-panel-open');
    }, 25);
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

    var panel = `<div class="st-panel st-panel-right st-effect-2 cozy-effect-1">
      <header>
        <h2>Preferences <button><span class="u-screenreader">Close</span><span aria-hidden="true">&times;</span></h2>
      </header>
      <article class="cozy-preferences-modal">
        <form>
          <fieldset>
            <legend>Text Size</legend>
            <label><input name="text_size" type="radio" id="preferences-input-size-small" value="small" />Small</label>
            <label><input name="text_size" type="radio" id="preferences-input-size-auto" value="auto" />Default</label>
            <label><input name="text_size" type="radio" id="preferences-input-size-large" value="large" />Large</label>
          </fieldset>          
          <fieldset>
            <legend>Text Display</legend>
            <label><input name="flow" type="radio" id="preferences-input-paginated" value="paginated" />Page-by-Page</label>
            <label><input name="flow" type="radio" id="preferences-input-scrolled-doc" value="scrolled-doc" />Scroll</label>
          </fieldset>
          <fieldset>
            <legend>Theme</legend>
            <label><input name="theme" type="radio" id="preferences-input-theme-light" value="light" />Light</label>
            <label><input name="theme" type="radio" id="preferences-input-theme-dark" value="dark" />Dark</label>
          </fieldset>
          <p>
            <button id="action-save" class="button button--lg">Save Changes</button>
          </p>
        </form>
      </article>
    </div>`;
    var body = new DOMParser().parseFromString(panel, "text/html").body;
    this._reader._container.appendChild(body.children[0]);
    this._panel = this._reader._container.querySelector('.st-panel.st-panel-right');
    this._panel.style.height = this._reader._container.offsetHeight + 'px';
    this._panel.style.width = parseInt(this._reader._container.offsetWidth * 0.40) + 'px';
    DomUtil.addClass(this._reader._container, 'st-pusher');

    var input, input_id;
    /// input_id = "preferences-input-" + ( this._reader.options.flow == 'scrolled-doc' ? 'scrollable' : 'reflowable' );
    input_id = "preferences-input-" + ( this._reader.options.flow == 'auto' ? 'paginated' : 'scrolled-doc' );
    console.log("AHOY PREFERENCES", input_id);
    input = this._panel.querySelector("#" + input_id);
    input.checked = true;

    input_id = "preferences-input-size-" + ( this._reader.options.text_size || 'auto' );
    input = this._panel.querySelector("#" + input_id);
    input.checked = true;

    input_id = "preferences-input-theme-" + ( this._reader.options.theme || 'light' );
    input = this._panel.querySelector("#" + input_id);
    input.checked = true;

    input = this._panel.querySelector('#action-save');
    DomEvent.on(input, 'click', function(event) {
      event.preventDefault();
      var options = {};
      var input = self._panel.querySelector("input[name='flow']:checked");
      options.flow = input.value;
      input = self._panel.querySelector("input[name='text_size']:checked");
      options.text_size = input.value;
      input = self._panel.querySelector("input[name='theme']:checked");
      options.theme = input.value;
      DomUtil.removeClass(self._reader._container, 'st-panel-open');
      DomUtil.removeClass(self._reader._container, 'st-effect-2');
      setTimeout(function() {
        self._reader.reopen(options);
      }, 100);
    })

    input = this._panel.querySelector('h2 button');
    DomEvent.on(input, 'click', function(event) {
      event.preventDefault();
      DomUtil.removeClass(self._reader._container, 'st-panel-open');
      DomUtil.removeClass(self._reader._container, 'st-effect-2');
    })

    DomEvent.on(this._reader._container, 'click', function(event) {
      if ( ! DomUtil.hasClass(self._reader._container, 'st-panel-open') ) { return ; }
      if ( ! DomUtil.hasClass(self._reader._container, 'st-effect-2') ) { return ; }
      var target = event.target;
      // find whether target or ancestor is in _menu
      while ( target && target != self._reader._container ) {
        if ( target == self._panel ) {
          return;
        }
        target = target.parentNode;
      }
      event.preventDefault();
      DomUtil.removeClass(self._reader._container, 'st-panel-open');
      DomUtil.removeClass(self._reader._container, 'st-effect-2');
    });
  },

  _createPanelXX: function() {
    var template = `<div class="cozy-modal cozy-preferences-modal" style="position: fixed; width: 300px; margin-left: -150px; left: 50%; top: 50%; transform: translateY(-50%); z-index: 9000; display: none">
      <header>
        <h2>Preferences</h2>
      </header>
      <article>
        <form>
          <fieldset>
            <legend>Text Display</legend>
            <label><input name="flow" type="radio" id="preferences-input-reflowable" value="auto" />Page-by-Page</label>
            <label><input name="flow" type="radio" id="preferences-input-scrollable" value="scrolled-doc" />Scroll</label>
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
    this._cancelButton = this._createButton('<i class="icon-x oi" data-glyph="x" aria-hidden="true"></i>', 'Close preferences without saving', 'close', footer, this._cancelAction);
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
