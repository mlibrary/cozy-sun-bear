import {Control} from './Control';
import {Reader} from '../reader/Reader';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';

export var Contents = Control.extend({

  defaultTemplate: `<button data-toggle="dropdown">Contents <span>▼</span></button><ul class="cozy-dropdown-menu" data-target="menu"></ul>`,

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

    this._control = container.querySelector("[data-toggle=dropdown]");
    this._menu = container.querySelector("[data-target=menu]");
    this._menu.style.display = 'none';
    container.style.position = 'relative';

    DomEvent.on(this._control, 'click', function(event) {
      event.preventDefault();
      this._menu.style.display = 'block';
    }, this)

    DomEvent.on(this._menu, 'click', function(event) {
      event.preventDefault();
      var target = event.target;
      target = target.getAttribute('href');
      this._reader.gotoPage(target);
      this._menu.style.display = 'none';
    }, this);

    this._reader.on('update-contents', function(data) {
      var s = data.toc.filter(function(value) { return value.parent == null }).map(function(value) { return [ value, 0, self._menu ] });
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
