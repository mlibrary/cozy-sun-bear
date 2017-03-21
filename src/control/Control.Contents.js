import {Control} from './Control';
import {Reader} from '../reader/Reader';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';

export var Contents = Control.extend({
  onAdd: function(reader) {
    var self = this;
    var className = 'cozy-control-' + this.options.direction,
        container = DomUtil.create('div', className + ' cozy-control'),
        options = this.options;

    var template = '<label><span class="sr-only">Contents: </span><select size="1" name="contents"></select></label>';
    var control = new DOMParser().parseFromString(template, "text/html").body.firstChild;
    container.appendChild(control);
    this._control = control.getElementsByTagName('select')[0];
    this._control.onchange = function() {
      var target = this.value;
      self._reader.gotoPage(target);
    }

    this._reader.on('update-contents', function(data) {
      console.log("AHOY UPDATE CONTENTS", data);
      data.toc.forEach(function(chapter) {
        var option = DomUtil.create('option');
        option.textContent = chapter.label;
        option.setAttribute('value', chapter.href);
        self._control.appendChild(option);
      });
    })

    return container;
  },

  _createButton: function (html, title, className, container, fn) {
    var link = DomUtil.create('a', className, container);
    link.innerHTML = html;
    link.href = '#';
    link.title = title;

    /*
     * Will force screen readers like VoiceOver to read this as "Zoom in - button"
     */
    link.setAttribute('role', 'button');
    link.setAttribute('aria-label', title);

    DomEvent.disableClickPropagation(link);
    DomEvent.on(link, 'click', DomEvent.stop);
    DomEvent.on(link, 'click', fn, this);
    // DomEvent.on(link, 'click', this._refocusOnMap, this);

    return link;
  },

  EOT: true
});

export var contents = function(options) {
  return new Contents(options);
}
