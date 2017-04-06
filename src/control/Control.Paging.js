import {Control} from './Control';
import {Reader} from '../reader/Reader';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';

var PageControl = Control.extend({
  onAdd: function(reader) {
    var container = this._container;
    if ( container ) {
      this._control = container.querySelector("[data-target=" + this.options.direction + "]");
    } else {

      var className = this._className(),
          options = this.options;
      container = DomUtil.create('div', className),

      this._control  = this._createButton(options.html || options.label, options.label,
              className, container);
    }
    this._bindEvents();

    return container;
  },

  _createButton: function (html, title, className, container) {
    var link = DomUtil.create('a', className, container);
    link.innerHTML = html;
    link.href = '#';
    link.title = title;

    /*
     * Will force screen readers like VoiceOver to read this as "Zoom in - button"
     */
    link.setAttribute('role', 'button');
    link.setAttribute('aria-label', title);

    return link;
  },

  _bindEvents: function() {
    DomEvent.disableClickPropagation(this._control);
    DomEvent.on(this._control, 'click', DomEvent.stop);
    DomEvent.on(this._control, 'click', this._action, this);
  },

  EOT: true
});

export var PagePrevious = PageControl.extend({
  options: {
    region: 'edge.left',
    direction: 'previous',
    label: 'Prevous Page'
  },

  _action: function(e) {
    this._reader.prev();
  }
});

export var PageNext = PageControl.extend({
  options: {
    region: 'edge.right',
    direction: 'next',
    label: 'Next Page'
  },

  _action: function(e) {
    this._reader.next();
  }
});

export var PageFirst = PageControl.extend({
  options: {
    direction: 'first',
    label: 'First Page'
  },
  _action: function(e) {
      this._reader.first();
  }
});

export var PageLast = PageControl.extend({
  options: {
    direction: 'last',
    label: 'Last Page'
  },
  _action: function(e) {
      this._reader.last();
  }
});

export var pageNext = function(options) {
  return new PageNext(options);
}

export var pagePrevious = function(options) {
  return new PagePrevious(options);
}

export var pageFirst = function(options) {
  return new PageFirst(options);
}

export var pageLast = function(options) {
  return new PageLast(options);
}