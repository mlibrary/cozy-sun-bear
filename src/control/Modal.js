import {Class} from '../core/Class';
import {Reader} from '../reader/Reader';
import * as Util from '../core/Util';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';

import assign from 'lodash/assign';

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
    fraction: 0,
    width: null,
    className: {},
    actions: null,
    callbacks: { onShow: function() {}, onClose: function() {} },
    handlers: {}
  },

  initialize: function (options) {
    options = Util.setOptions(this, options);
    this._id = (new Date()).getTime() + '-' + parseInt(Math.random((new Date()).getTime()) * 1000, 10);
    this._initializedEvents = false;
    this.callbacks = assign({}, this.options.callbacks);
    this.actions = this.options.actions ? assign({}, this.options.actions) : null;
    this.handlers = assign({}, this.options.handlers);
    if ( typeof(this.options.className) == 'string' ) {
      this.options.className = { container: this.options.className };
    }
  },

  addTo: function(reader) {
    var self = this;
    this._reader = reader;
    var template = this.options.template;

    var panelHTML = `<div class="cozy-modal modal-slide ${this.options.region || 'left'}" id="modal-${this._id}" aria-labelledby="modal-${this._id}-title" role="dialog" aria-describedby="modal-${this._id}-content" aria-hidden="true">
      <div class="modal__overlay" tabindex="-1" data-modal-close>
        <div class="modal__container ${this.options.className.container ? this.options.className.container : ''}" role="dialog" aria-modal="true" aria-labelledby="modal-${this._id}-title" aria-describedby="modal-${this._id}-content" id="modal-${this._id}-container">
          <div role="document">
            <header class="modal__header">
              <h3 class="modal__title" id="modal-${this._id}-title">${this.options.title}</h3>
              <button class="modal__close" aria-label="Close modal" aria-controls="modal-${this._id}-container" data-modal-close></button>
            </header>
            <main class="modal__content ${this.options.className.main ? this.options.className.main : ''}" id="modal-${this._id}-content">
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
    this._bindEvents();
    return this;
  },

  _bindEvents: function() {
    var self = this;
    this.onClick = this.onClick.bind(this);
    this.onKeydown = this.onKeydown.bind(this);
    this.onModalTransition = this.onModalTransition.bind(this);

    this.modal.addEventListener('transitionend', function() {
    }.bind(this));

    // bind any actions
    if ( this.actions ) {
      for(var i in this.actions) {
        let action = this.actions[i];
        let button_id = '#action-' + this._id + '-' + i;
        let button = this.modal.querySelector(button_id);
        if ( button ) {
          DomEvent.on(button, 'click', function(event) {
            event.preventDefault();
            action.callback(event);
            if ( action.close ) {
              self.closeModal();
            }
          })
        }
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
    if ( this.activeElement ) {
      this.activeElement.focus();
    }
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
    'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend'.split(' ').forEach(function(event) {
      this.modal.addEventListener(event, this.onModalTransition);
    }.bind(this))
  },

  removeEventListeners: function () {
    this.modal.removeEventListener('touchstart', this.onClick)
    this.modal.removeEventListener('click', this.onClick)
    'webkitTransitionEnd otransitionend oTransitionEnd msTransitionEnd transitionend'.split(' ').forEach(function(event) {
      this.modal.removeEventListener(event, this.onModalTransition);
    }.bind(this))
    document.removeEventListener('keydown', this.onKeydown)
  },

  _resize: function() {
    var container = this._reader._container;
    this.container.style.height = container.offsetHeight + 'px';
    // console.log("AHOY MODAL", this.container.style.height);
    if ( ! this.options.className.container  ) {
      this.container.style.width = this.options.width || parseInt(container.offsetWidth * this.options.fraction) + 'px';
    }

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
    var target = event.target;

    // As far as I can tell, the code below isn't catching direct clicks on
    // items with class='data-modal-close' as they're not ACTIONABLE_ELEMENTS.
    // Adding them to ACTIONABLE_ELEMENTS causes undesirable behavior where
    // their child items also close the modal thanks to the loop below.
    // Children of .modal__overlay include the modal header, border area and
    // padding. We don't want clicks on these closing the modal.
    // Just close the modal now for direct clicks on a '.data-modal-close'.
    if (target.hasAttribute('data-modal-close')) {
      this.fire('closed');
      this.closeModal();
      return;
    }

    // if the target isn't an actionable type, walk the DOM until
    // one is found
    var actionableNodes = this.getActionableNodes();
    while ( actionableNodes.indexOf(target) < 0 && target != this.modal ) {
      target = target.parentElement;
    }

    // no target found, punt
    if ( actionableNodes.indexOf(target) < 0 ) {
      return;
    }

    if (this.handlers.click) {
      var did_match = false;
      for(var selector in this.handlers.click) {
        if ( target.matches(selector) ) {
          closeAfterAction = this.handlers.click[selector](this, target);
          break;
        }
      }
    }

    if (closeAfterAction || target.hasAttribute('data-modal-close')) this.closeModal();

    event.preventDefault();
  },

  onModalTransition: function(event) {
    if ( this.modal.getAttribute('aria-hidden') == 'true' ) {
      this._reader.fire('modal-closed');
    } else {
      this._reader.fire('modal-opened');
    }
  },

  on: function(event, selector, handler) {
    if (! this.handlers[event] ) {
      this.handlers[event] = {};
    }
    if (typeof(selector) == 'function') {
      handler = selector;
      selector = '*';
    }
    this.handlers[event][selector] = handler;
  },

  fire: function(event) {
    if ( this.handlers[event] && this.handlers[event]['*'] ) {
      this.handlers[event]['*'](this);
    }
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
