import {Class} from '../core/Class';
import {Reader} from '../reader/Reader';
import * as Util from '../core/Util';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';


var activeModal;
var dismissModalListener = false;

// from https://github.com/ghosh/micromodal/blob/master/src/index.js
const FOCUSABLE_ELEMENTS = [
    'a[href]',
    'area[href]',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'button:not([disabled])',
    'iframe',
    'object',
    'embed',
    '[contenteditable]',
    '[tabindex]:not([tabindex^="-"])'
  ];

const ACTIONABLE_ELEMENTS = [
    'a[href]',
    'area[href]',
    'input[type="submit"]:not([disabled])',
    'button:not([disabled])'
  ];

export var Modal = Class.extend({
  options: {
    // @option region: String = 'topright'
    // The region of the control (one of the reader edges). Possible values are `'left' ad 'right'`
    region: 'left',
    fraction: 0.40,
    className: {},
    actions: null,
    callbacks: { onShow: function() {}, onClose: function() {} },
    handlers: {}
  },

  initialize: function (options) {
    options = Util.setOptions(this, options);
    this._id = (new Date()).getTime() + '-' + parseInt(Math.random((new Date()).getTime()) * 1000, 10);
    this._initializedEvents = false;
    this.callbacks = this.options.callbacks;
    this.actions = this.options.actions;
    this.handlers = this.options.handlers;
  },

  addTo: function(reader) {
    var self = this;
    this._reader = reader;
    var template = this.options.template;

    var panelHTML = `<div class="modal modal-slide ${this.options.region || 'left'}" id="modal-${this._id} aria-labelledby="modal-${this._id}-title" role="dialog" aria-describedby="modal-${this._id}-content" aria-hidden="true">
      <div class="modal__overlay" tabindex="-1" data-modal-close>
        <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="modal-${this._id}-title" aria-describedby="modal-${this._id}-content" id="modal-{$this._id}-container">
          <div role="document">
            <header class="modal__header">
              <h3 class="modal__title" id="modal-${this._id}-title">${this.options.title}</h3>
              <button class="modal__close" aria-label="Close modal" aria-controls="modal-${this._id}-container" data-modal-close></button>
            </header>
            <main class="modal__content ${this.options.className.article ? this.options.className.article : ''}" id="modal-${this._id}-content">
              ${template}
            </main>`;

    if ( this.options.actions ) {
      panelHTML += '<footer class="modal__footer">'
      for(var i in this.options.actions) {
        var action = this.options.actions[i];
        var button_cls = action.className || 'button--default';
        panelHTML += `<button id="action-${this._id}-${i}" class="button button--lg ${button_cls}">${action.label}</button>`;
      }
      panelHTML += '</footer>';
    }

    panelHTML += '</div></div></div></div>';

    var body = new DOMParser().parseFromString(panelHTML, "text/html").body;

    this.modal = reader._container.appendChild(body.children[0]);
    this._container = this.modal; // compatibility

    this.container = this.modal.querySelector('.modal__container');
    this.container.style.height = reader._container.offsetHeight + 'px';
    this.container.style.width = this.options.width || parseInt(reader._container.offsetWidth * this.options.fraction) + 'px';

    this._bindEvents();
    return this;
  },

  _bindEvents: function() {
    var self = this;
    this.onClick = this.onClick.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
    // bind any actions
    if ( this.actions ) {
      for(var i in this.actions) {
        var action = this.actions[i];
        var button_id = '#action-' + this._id + '-' + i;
        var button = this.modal.querySelector(button_id);
        if ( button ) {
          DomEvent.on(button, 'click', function(event) {
            action.callback(event);
            if ( action.close ) {
              self.closeModal();
            }
          })
        }
      }
    }
  },

  _xxbindEvents: function() {
    var self = this;

    if ( this._initializedEvents ) { return; }
    this._initializedEvents = true;

    var reader = this._reader;
    var container = reader._container;

    if ( ! dismissModalListener ) {
      dismissModalListener = true;
      DomEvent.on(container, 'click', function(event) {
        if ( DomUtil.hasClass(container, 'st-modal-activating') ) { return ; }
        if ( ! DomUtil.hasClass(container, 'st-modal-open') ) { return ; }

        var modal = activeModal;
        if ( ! modal ) { return ; }
        if ( ! DomUtil.hasClass(modal._container, 'active') ) { return ; }

        var target = event.target;
        if ( target.getAttribute('data-toggle') == 'open' ) { return ; }

        // find whether target or ancestor is in _menu
        while ( target && ! DomUtil.hasClass(target, 'st-pusher') ) {
          if ( DomUtil.hasClass(target, 'st-modal') && DomUtil.hasClass(target, 'active') ) {
            return;
          }
          target = target.parentNode;
        }
        event.preventDefault();
        modal.deactivate();
      });

      document.addEventListener('keydown', this.onKeydown);

    }

    DomEvent.on(this.modal.querySelector('h2 button'), 'click', function(event) {
      event.preventDefault();
      self.deactivate();
    })

    // bind any actions
    if ( this.options.actions ) {
      for(var i in this.options.actions) {
        var action = this.options.actions[i];
        var button_id = '#action-' + this._id + '-' + i;
        var button = this.modal.querySelector(button_id);
        DomEvent.on(button, 'click', function(event) {
          action.callback(event);
        })
      }
    }

  },

  deactivate: function() {
    this.closeModal();
  },

  closeModal: function() {
    var self = this;
    this.modal.setAttribute('aria-hidden', 'true');
    this.removeEventListeners();
    this.activeElement.focus();
    this.callbacks.onClose(this.modal);
  },

  showModal: function() {
    this.activeElement = document.activeElement
    this._resize();
    this.modal.setAttribute('aria-hidden', 'false')
    this.setFocusToFirstNode()
    this.addEventListeners()
    this.callbacks.onShow(this.modal)
  },

  activate: function() {
    return this.showModal();
    var self = this;
    activeModal = this;
    DomUtil.addClass(self._reader._container, 'st-modal-activating');
    this._resize();
    DomUtil.addClass(this._reader._container, 'st-modal-open');
    setTimeout(function() {
      DomUtil.addClass(self._container, 'active');
      DomUtil.removeClass(self._reader._container, 'st-modal-activating');
      self._container.setAttribute('aria-hidden', 'false');
      self.setFocusToFirstNode();
    }, 25);
  },

  addEventListeners: function () {
    // --- do we need touch listeners?
    // this.modal.addEventListener('touchstart', this.onClick)
    // this.modal.addEventListener('touchend', this.onClick)
    this.modal.addEventListener('click', this.onClick)
    document.addEventListener('keydown', this.onKeydown)
  },

  removeEventListeners: function () {
    this.modal.removeEventListener('touchstart', this.onClick)
    this.modal.removeEventListener('click', this.onClick)
    document.removeEventListener('keydown', this.onKeydown)
  },

  _resize: function() {
    var container = this._reader._container;
    this.container.style.height = container.offsetHeight + 'px';
    this.container.style.width = this.options.width || parseInt(container.offsetWidth * this.options.fraction) + 'px';
    var header = this.container.querySelector('header');
    var footer = this.container.querySelector('footer');
    var main = this.container.querySelector('main');
    var height = this.container.clientHeight - header.clientHeight;
    if ( footer ) {
      height -= footer.clientHeight;
    }
    main.style.height = height + 'px';
  },

  getFocusableNodes: function() {
    const nodes = this.modal.querySelectorAll(FOCUSABLE_ELEMENTS);
    return Object.keys(nodes).map((key) => nodes[key]);
  },

  setFocusToFirstNode: function() {
    var focusableNodes = this.getFocusableNodes();
    if ( focusableNodes.length ) {
      focusableNodes[0].focus();
    } else {
      activeModal._container.focus();
    }
  },

  getActionableNodes: function() {
    const nodes = this.modal.querySelectorAll(ACTIONABLE_ELEMENTS);
    return Object.keys(nodes).map((key) => nodes[key]);
  },

  onKeydown: function(event) {
    if ( event.keyCode == 27 ) { this.closeModal(); }
    if ( event.keyCode == 9 ) { 
      this.maintainFocus(event); 
    }
  },

  onClick: function(event) {

    var closeAfterAction = false;
    if (this.handlers.click) {
      var target = event.target;
      for(var selector in this.handlers.click) {
        if ( target.matches(selector) ) {
          closeAfterAction = this.handlers.click[selector](this, target);
        }
      }
    }

    if (closeAfterAction || event.target.hasAttribute('data-modal-close')) this.closeModal();

    const actionableNodes = this.getActionableNodes();
    if ( actionableNodes.indexOf(event.target) < 0 ) {
      return;
    }

    event.preventDefault();
  },

  on: function(event, selector, handler) {
    if (! this.handlers[event] ) {
      this.handlers[event] = {};
    }
    this.handlers[event][selector] = handler;
  },

  maintainFocus: function(event) {
    var focusableNodes = this.getFocusableNodes();
    var focusedItemIndex = focusableNodes.indexOf(document.activeElement);
    if (event.shiftKey && focusedItemIndex === 0) {
      focusableNodes[focusableNodes.length - 1].focus()
      event.preventDefault()
    }

    if (!event.shiftKey && focusedItemIndex === focusableNodes.length - 1) {
      focusableNodes[0].focus()
      event.preventDefault()
    }
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