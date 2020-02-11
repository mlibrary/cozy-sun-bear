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

    this._bindEvents();

    return container;
  },

  _bindEvents() {
    var self = this;
    
    this._reader.on('updateContents', function(data) {

      DomEvent.on(this._control, 'click', function(event) {
        event.preventDefault();
        self._goto_interval = false;
        self._reader.tracking.action('contents/open');
        self._modal.activate();
      }, this);

      this._modal = this._reader.modal({
        template: `
<div class="cozy-contents-toolbar button-group" aria-hidden="true">
  <button class="cozy-control button--lg toggled" data-toggle="contentlist">Table of Contents</button>
  <button class="cozy-control button--lg" data-toggle="pagelist">Page List</button>
</div>
<div class="cozy-contents-main">
  <div class="cozy-contents-contentlist">
    <ul></ul>
  </div>
  <div class="cozy-contents-pagelist" style="display: none">
    <ul></ul>
  </div>
</div>`.trim(),
        title: 'Contents',
        region: 'left',
        className: 'cozy-modal-contents',
        callbacks: {
          onShow: function() {},
          onClose: function (modal) {
          if (self._goto_interval) {
            self._reader.rendition.manager.container.setAttribute("tabindex", 0);
            self._reader.rendition.manager.container.focus();
          }
        }
      }});

      this._display = {};
      this._display.contentlist = this._modal._container.querySelector('.cozy-contents-contentlist');
      this._display.pagelist = this._modal._container.querySelector('.cozy-contents-pagelist');
      this._toolbar = this._modal._container.querySelector('.cozy-contents-toolbar');

      this._toolbar.addEventListener('click', (event) => {
        if ( event.target.dataset.toggle ) {
          var target = event.target.dataset.toggle;
          var current = this._toolbar.querySelector('[data-toggle].toggled');
          if ( current ) {
            current.classList.remove('toggled');
            this._display[current.dataset.toggle].style.display = 'none';
          }
          event.target.classList.add('toggled');
          this._display[event.target.dataset.toggle].style.display = 'block';
          this._reader.updateLiveStatus(`Displaying ${event.target.innerText}`);
        }
      });

      this._modal.on('click', 'a[href]', function(modal, target) {
        target = target.getAttribute('data-href');
        this._goto_interval = true;
        this._reader.tracking.action('contents/go/link');
        this._reader.display(target);
        return true;
      }.bind(this));

      this._modal.on('closed', function() {
        self._reader.tracking.action('contents/close');
      });

      this._setupSkipLink();

      var parent = self._modal._container.querySelector('.cozy-contents-contentlist ul');
      var _process = function(items, tabindex, parent) {
        items.forEach(function(item) {
          var option = self._createOption(item, tabindex, parent);
          if ( item.subitems && item.subitems.length ) {
            _process(item.subitems, tabindex + 1, option);
          }
        })
      };
      _process(data.toc, 0, parent);

    }.bind(this))

    this._reader.on('updateLocations', (data) => {

      if ( this._reader.pageList ) {
        // this._toolbar.style.display = 'flex';
        this._toolbar.setAttribute('aria-hidden', 'false');
      }

      if ( self._reader.pageList ) {
        var parent = self._modal._container.querySelector('.cozy-contents-pagelist ul');
        for(var i = 0; i < self._reader.pageList.pages.length; i++) {
          var pg = self._reader.pageList.pages[i];
          var info = self._reader.pageList.pageList[i];
          var cfi = self._reader.pageList.locations[i];
          var item = { 
            label: ( info.pageLabel || info.page ),
            href: cfi
          };
          var option = self._createOption(item, 0, parent);
        }
      }
    })
  },

  _createOption(chapter, tabindex, parent) {

    function pad(value, length) {
        return (value.toString().length < length) ? pad("-"+value, length):value;
    }
    var option = DomUtil.create('li');
    if ( chapter.href ) {
      var anchor = DomUtil.create('a', null, option);
      if ( chapter.html ) {
        anchor.innerHTML = chapter.html;
      } else {
        anchor.textContent = chapter.label;
      }
      // var tab = pad('', tabindex); tab = tab.length ? tab + ' ' : '';
      // option.textContent = tab + chapter.label;
      anchor.setAttribute('href', chapter.href);
      anchor.setAttribute('data-href', chapter.href);
    } else {
      var span = DomUtil.create('span', null, option);
      span.textContent = chapter.label;
    }

    if ( parent.tagName === 'LI' ) {
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
};
