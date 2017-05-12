import {Class} from '../core/Class';
import {Reader} from '../reader/Reader';
import * as Util from '../core/Util';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';

export var Modal = Class.extend({
  options: {
    // @option region: String = 'topright'
    // The region of the control (one of the reader edges). Possible values are `'left' ad 'right'`
    tag: 'div',
    fraction: 0.40,
    className: {},
    actions: null
  },

  initialize: function (options) {
    Util.setOptions(this, options);
    this._id = (new Date()).getTime();
    this._initializedEvents = false;
  },

  addTo: function(reader) {
    var self = this;
    this._reader = reader;
    var template = this.options.template;
    var tag = this.options.tag
    var panelHTML = `<div class="st-panel st-panel-${this.options.region}">
      <header>
        <h2>${this.options.title} <button><span class="u-screenreader">Close</span><span aria-hidden="true">&times;</span></h2>
      </header>
      <article class="${this.options.className.article || this.options.className.article}">
        ${template}
      </article>`;

    if ( this.options.actions ) {
      panelHTML += '<footer>'
      for(var i in this.options.actions) {
        var action = this.options.actions[i];
        console.log("AHOY MODAL", i, action);
        var button_cls = action.className || 'button--default';
        panelHTML += `<button id="action-${this._id}-${i}" class="button button--lg ${button_cls}">${action.label}</button>`;
      }
      panelHTML += '</footer>';
    }

    panelHTML += '</div>';

    var body = new DOMParser().parseFromString(panelHTML, "text/html").body;

    this._container = reader._container.appendChild(body.children[0]);
    this._container.style.height = reader._container.offsetHeight + 'px';
    this._container.style.width = this.options.width || parseInt(reader._container.offsetWidth * this.options.fraction) + 'px';
    DomUtil.addClass(reader._container, 'st-pusher');

    this._bindEvents();
    return this;
  },

  _bindEvents: function() {
    var self = this;

    if ( this._initializedEvents ) { return; }
    this._initializedEvents = true;
    var container = this._reader._container;
    DomEvent.on(container, 'click', function(event) {
      if ( self._activating ) { return ; }
      if ( ! DomUtil.hasClass(self._container, 'active') ) { return ; }
      if ( ! DomUtil.hasClass(container, 'st-panel-open') ) { return ; }

      var target = event.target;
      if ( target.getAttribute('data-toggle') == 'open' ) { return ; }

      // find whether target or ancestor is in _menu
      while ( target && ! DomUtil.hasClass(target, 'st-pusher') ) {
        if ( DomUtil.hasClass(target, 'st-panel') && DomUtil.hasClass(target, 'active') ) {
          return;
        }
        target = target.parentNode;
      }
      event.preventDefault();

      self._deactivate();
    });

    DomEvent.on(this._container.querySelector('h2 button'), 'click', function(event) {
      event.preventDefault();
      self._deactivate();
    })

    // bind any actions
    if ( this.options.actions ) {
      for(var i in this.options.actions) {
        var action = this.options.actions[i];
        var button_id = '#action-' + this._id + '-' + i;
        console.log("AHOY WUT?", button_id);
        var button = this._container.querySelector(button_id);
        DomEvent.on(button, 'click', function(event) {
          action.callback(event);
        })
      }
    }

  },

  _deactivate: function() {
    var self = this;
    var container = this._reader._container;

    DomUtil.removeClass(container, 'st-panel-open');
    DomUtil.removeClass(this._container, 'active');
  },

  _activate: function() {
    var self = this;
    self._activating = true;
    this._resize();
    DomUtil.addClass(this._reader._container, 'st-panel-open');
    setTimeout(function() {
      DomUtil.addClass(self._container, 'active');
      self._activating = false;
    }, 25);
  },

  _resize: function() {
    var container = this._reader._container;
    this._container.style.height = container.offsetHeight + 'px';
    this._container.style.width = this.options.width || parseInt(container.offsetWidth * this.options.fraction) + 'px';
    var header = this._container.querySelector('header');
    var footer = this._container.querySelector('footer');
    var article = this._container.querySelector('article');
    var height = this._container.clientHeight - header.clientHeight;
    if ( footer ) {
      height -= footer.clientHeight;
    }
    article.style.height = height + 'px';
  },

  EOT: true
});

Reader.include({
  modal: function (options) {
    var modal = new Modal(options);
    return modal.addTo(this);
    // return this;
  },

  EOT: true
});