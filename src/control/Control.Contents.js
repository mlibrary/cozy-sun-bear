import {Control} from './Control';
import {Reader} from '../reader/Reader';
import {Modal} from './Modal';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';

export var Contents = Control.extend({

  defaultTemplate: `<button class="button--sm" data-toggle="open"><i class="icon-menu oi" data-glyph="menu" title="Table of Contents" aria-hidden="true"></i>  Contents</button>`,

  onAdd: function(reader) {
    var self = this;
    var container = this._container;
    if ( container ) {
      this._control = container.querySelector("[data-target=" + this.options.direction + "]");
    } else {

      var className = this._className(),
          options = this.options;

      container = DomUtil.create('div', className);

      var template = this.options.template || this.defaultTemplate;

      var body = new DOMParser().parseFromString(template, "text/html").body;
      while ( body.children.length ) {
        container.appendChild(body.children[0]);
      }
    }
    
    this._modal = this._reader.modal({
      template: '<ul></ul>',
      title: 'Contents',
      region: 'left'
    });

    this._control = container.querySelector("[data-toggle=open]");
    container.style.position = 'relative';

    DomEvent.on(this._control, 'click', function(event) {
      event.preventDefault();
      // DomUtil.addClass(self._reader._container, 'st-effect-1');
      self._modal._activate();
      // setTimeout(function() {
      //   // DomUtil.addClass(self._reader._container, 'st-panel-open');
      // }, 25);
    }, this)

    DomEvent.on(this._modal._container, 'click', function(event) {
      event.preventDefault();
      var target = event.target;
      if ( target.tagName == 'A' ) {
        target = target.getAttribute('href');
        this._reader.gotoPage(target);
      }
      this._modal._deactivate();
      // DomUtil.removeClass(this._reader._container, 'st-panel-open');
      // DomUtil.removeClass(this._reader._container, 'st-effect-1');
    }, this);

    this._reader.on('update-contents', function(data) {
      var parent = self._modal._container.querySelector('ul');
      var s = data.toc.filter(function(value) { return value.parent == null }).map(function(value) { return [ value, 0, parent ] });
      while ( s.length ) {
        var tuple = s.shift();
        var chapter = tuple[0];
        var tabindex = tuple[1];
        var parent = tuple[2];

        var option = self._createOption(chapter, tabindex, parent);
        data.toc.filter(function(value) { return value.parent == chapter.id }).reverse().forEach(function(chapter_) {
          s.unshift([chapter_, tabindex + 1, option]);
        });
      }
    })


    return container;
  },

  onAddXX: function(reader) {
    var self = this;

    var container = this._container;
    if ( container ) {
      this._control = container.querySelector("[data-target=" + this.options.direction + "]");
    } else {

      var className = this._className(),
          options = this.options;

      container = DomUtil.create('div', className);

      var template = this.options.template || this.defaultTemplate;

      var body = new DOMParser().parseFromString(template, "text/html").body;
      while ( body.children.length ) {
        container.appendChild(body.children[0]);
      }
    }

    var panel = `<nav class="st-panel st-panel-left st-effect-1 cozy-effect-1"><h2>Contents <button><span class="u-screenreader">Close</span><span aria-hidden="true">&times;</span></h2><ul></ul></nav>`;
    body = new DOMParser().parseFromString(panel, "text/html").body;
    this._reader._container.appendChild(body.children[0]);
    this._menu = this._reader._container.querySelector('nav.st-panel');
    this._menu.style.height = this._reader._container.offsetHeight + 'px';
    this._menu.style.width = parseInt(this._reader._container.offsetWidth * 0.40) + 'px';
    DomUtil.addClass(this._reader._container, 'st-pusher');

    this._control = container.querySelector("[data-toggle=open]");
    container.style.position = 'relative';

    DomEvent.on(this._control, 'click', function(event) {
      event.preventDefault();
      self._menu.style.height = self._reader._container.offsetHeight + 'px';
      self._menu.style.width = parseInt(self._reader._container.offsetWidth * 0.40) + 'px';

      DomUtil.addClass(self._reader._container, 'st-effect-1');
      setTimeout(function() {
        DomUtil.addClass(self._reader._container, 'st-panel-open');
      }, 25);
    }, this)

    DomEvent.on(this._menu, 'click', function(event) {
      event.preventDefault();
      var target = event.target;
      if ( target.tagName == 'A' ) {
        target = target.getAttribute('href');
        this._reader.gotoPage(target);
      }
      DomUtil.removeClass(this._reader._container, 'st-panel-open');
      DomUtil.removeClass(this._reader._container, 'st-effect-1');
    }, this);

    DomEvent.on(this._reader._container, 'click', function(event) {
      if ( ! DomUtil.hasClass(self._reader._container, 'st-panel-open') ) { return ; }
      if ( ! DomUtil.hasClass(self._reader._container, 'st-effect-1') ) { return ; }
      var target = event.target;
      // find whether target or ancestor is in _menu
      while ( target && target != self._reader._container ) {
        if ( target == self._menu ) {
          return;
        }
        target = target.parentNode;
      }
      event.preventDefault();
      DomUtil.removeClass(self._reader._container, 'st-panel-open');
      DomUtil.removeClass(self._reader._container, 'st-effect-1');
    });

    this._reader.on('update-contents', function(data) {
      var parent = self._menu.querySelector('ul');
      var s = data.toc.filter(function(value) { return value.parent == null }).map(function(value) { return [ value, 0, parent ] });
      while ( s.length ) {
        var tuple = s.shift();
        var chapter = tuple[0];
        var tabindex = tuple[1];
        var parent = tuple[2];

        var option = self._createOption(chapter, tabindex, parent);
        data.toc.filter(function(value) { return value.parent == chapter.id }).reverse().forEach(function(chapter_) {
          s.unshift([chapter_, tabindex + 1, option]);
        });
      }
    })

    return container;
  },

  _createOption(chapter, tabindex, parent) {

    function pad(value, length) {
        return (value.toString().length < length) ? pad("-"+value, length):value;
    }
    var option = DomUtil.create('li');
    var anchor = DomUtil.create('a', null, option);
    anchor.textContent = chapter.label;
    // var tab = pad('', tabindex); tab = tab.length ? tab + ' ' : '';
    // option.textContent = tab + chapter.label;
    anchor.setAttribute('href', chapter.href);

    if ( parent.tagName == 'LI' ) {
      // need to nest
      var tmp = parent.querySelector('ul');
      if ( ! tmp ) {
        tmp = DomUtil.create('ul', null, parent);
      }
      parent = tmp;
    }

    parent.appendChild(option);
    return option;
  },

  EOT: true
});

export var contents = function(options) {
  return new Contents(options);
}
