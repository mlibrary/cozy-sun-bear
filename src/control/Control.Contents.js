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
      self._modal.activate();
    }, this)

    DomEvent.on(this._modal._container, 'click', function(event) {
      event.preventDefault();
      var target = event.target;
      if ( target.tagName == 'A' ) {
        target = target.getAttribute('href');
        this._reader.gotoPage(target);
      }
      this._modal.deactivate();
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
