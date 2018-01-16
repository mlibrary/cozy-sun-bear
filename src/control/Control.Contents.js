import {Control} from './Control';
import {Reader} from '../reader/Reader';
import {Modal} from './Modal';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';

export var Contents = Control.extend({

  defaultTemplate: `<button class="button--sm" data-toggle="open" aria-label="Table of Contents"><i class="icon-menu oi" data-glyph="menu" title="Table of Contents" aria-hidden="true"></i></button>`,

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

    this._control = container.querySelector("[data-toggle=open]");
    this._control.setAttribute('id', 'action-' + this._id);
    container.style.position = 'relative';

    this._reader.on('update-contents', function(data) {

      DomEvent.on(this._control, 'click', function(event) {
        event.preventDefault();
        self._modal.activate();
      }, this)

      this._modal = this._reader.modal({
        template: '<ul></ul>',
        title: 'Contents',
        region: 'left',
        className: 'cozy-modal-contents'
      });

      this._modal.on('click', 'a[href]', function(modal, target) {
        target = target.getAttribute('href');
        this._reader.gotoPage(target);
        return true;
      }.bind(this))

      this._setupSkipLink();

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
    }.bind(this))

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

  _setupSkipLink: function() {
    if ( ! this.options.skipLink ) { return; }
      
    var target = document.querySelector(this.options.skipLink);
    if ( ! target ) { return; }

    var link = document.createElement('a');
    link.textContent = 'Skip to contents';
    link.setAttribute('href', '#action-' + this._id);

    var ul = target.querySelector('ul');
    if ( ul ) {
      // add to list
      target = document.createElement('li');
      ul.appendChild(target);
    }
    target.appendChild(link);
    link.addEventListener('click', function(event) {
      event.preventDefault();
      event.stopPropagation();
      this._control.click();
    }.bind(this))

  },

  EOT: true
});

export var contents = function(options) {
  return new Contents(options);
}
