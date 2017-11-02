import {Control} from './Control';
import {Reader} from '../reader/Reader';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';
import {parseFullName} from 'parse-full-name';

// for debugging
window.parseFullName = parseFullName;

export var Search = Control.extend({
  options: {
    label: 'Search',
    html: '<span>Search</span>'
  },

  defaultTemplate: `<form class="search">
    <input id="cozy-search-string" name="search" type="text" placeholder="Enter Search..."/>
    <button class="button--sm" data-toggle="open"><i class="icon-magnifying-glass oi" data-glyph="magnifying-glass" title="Search" aria-hidden="true"></i></button>
  </form>`,

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
    container.style.position = 'relative';

    this._modal = this._reader.modal({
      template: '<ul></ul>',
      title: 'Search Results',
      className: 'cozy-modal-search',
      region: 'left'
    });

    this._modal.on('click', 'a[href]', function(modal, target) {
      target = target.getAttribute('href');
      this._reader.gotoPage(target);
      return true;
    }.bind(this));

    DomEvent.on(this._control, 'click', function(event) {
      event.preventDefault();

      var searchString = this._container.querySelector("#cozy-search-string");
      var url = this.options.searchUrl + searchString.value;
      var parent = this._modal._container.querySelector('ul');

      // remove old search results and annotations
      while (parent.hasChildNodes()) {
        parent.removeChild(parent.lastChild);
      }
      reader.annotations.reset();

      $.getJSON(url, function(data) {
        console.log("SEARCH DATA", data);

        data.search_results.forEach(function(result) {
          var option = DomUtil.create('li');
          var anchor = DomUtil.create('a', null, option);
          var cfiRange = "epubcfi(" + result.cfi + ")";

          anchor.textContent = result.snippet;
          anchor.setAttribute("href", cfiRange);
          parent.appendChild(option);

          reader.annotations.highlight(cfiRange);
        });
      })
      .fail(function(jqxhr, textStatus, error) {
        console.log(textStatus);
        console.log(error);
      })
      .always(function() {
        self._modal.activate();
      });

    }, this);

    // DomEvent.on(this._modal._container, 'click', function(event) {
    //   event.preventDefault();
    //   var target = event.target;
    //   if ( target.tagName == 'A' ) {
    //     target = target.getAttribute('href');
    //     this._reader.gotoPage(target);
    //   }
    //   this._modal.deactivate();
    // }, this);

    return container;
  },

  EOT: true
});

export var search = function(options) {
  return new Search(options);
}
