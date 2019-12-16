import {Control} from './Control';
import {Reader} from '../reader/Reader';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';

export var Search = Control.extend({
  options: {
    label: 'Search',
    html: '<span>Search</span>'
  },

  defaultTemplate: `<form class="search">
    <label class="u-screenreader" for="cozy-search-string">Search in this text</label>
    <input id="cozy-search-string" name="search" type="text" placeholder="Search in this text..."/>
    <button class="button--sm" data-toggle="open" aria-label="Search"><i class="icon-magnifying-glass oi" data-glyph="magnifying-glass" title="Search" aria-hidden="true"></i></button>
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

    this._data = null;
    this._canceled = false;
    this._processing = false;

    this._reader.on('ready', function() {

      this._modal = this._reader.modal({
        template: '<article></article>',
        title: 'Search Results',
        className: { container: 'cozy-modal-search' },
        region: 'left',
      });

      this._modal.callbacks.onClose = function() {
        if ( self._processing ) {
          self._canceled = true;
        }
      };

      this._article = this._modal._container.querySelector('article');

      this._modal.on('click', 'a[href]', function(modal, target) {
        target = target.getAttribute('href');
        this._reader.tracking.action('search/go/link');
        this._reader.gotoPage(target);
        return true;
      }.bind(this));

      this._modal.on('closed', function() {
        this._reader.tracking.action('contents/close');
      }.bind(this))

    }.bind(this));

    DomEvent.on(this._control, 'click', function(event) {
      event.preventDefault();

      var searchString = this._container.querySelector("#cozy-search-string").value;
      searchString = searchString.replace(/^\s*/, '').replace(/\s*$/, '');

      if ( ! searchString ) {
        // just punt
        return;
      }

      if ( searchString == this.searchString ) {
        // cached results
        self.openModalResults();
      } else {
        this.searchString = searchString;
        self.openModalWaiting();
        self.submitQuery();
      }
    }, this);

    window.addEventListener('keydown', function(evt) {
      let cmd = (evt.ctrlKey ? 1 : 0) |
                (evt.altKey ? 2 : 0) |
                (evt.shiftKey ? 4 : 0) |
                (evt.metaKey ? 8 : 0);

      if (cmd === 1 || cmd === 8 || cmd === 5 || cmd === 12) {
        if ( evt.keyCode == '70' ) {
          // command/control-F
          evt.preventDefault();
          this._container.querySelector("#cozy-search-string").focus();
        }
      }
    }.bind(this));

    return container;
  },

  openModalWaiting: function() {
    this._processing = true;
    this._emptyArticle();
    var value = this.searchString;
    this._article.innerHTML = '<p>Submitting query for <em>' + value + '</em>...</p>' + this._reader.loaderTemplate();
    this._modal.activate();
  },

  openModalResults: function() {
    if ( this._canceled ) {
      this._canceled = false;
      return;
    }
    this._buildResults();
    this._modal.activate();
    this._reader.tracking.action("search/open");
  },

  submitQuery: function() {
    var self = this;

    var url = this.options.searchUrl + encodeURIComponent(this.searchString);

    var request = new XMLHttpRequest();
    request.open('GET', url, true);

    request.onload = function() {
      if (this.status >= 200 && this.status < 400) {
        // Success!
        var data = JSON.parse(this.response);
        console.log("SEARCH DATA", data);

        self._data = data;

      } else {
        // We reached our target server, but it returned an error

        self._data = null;
        console.log(this.response);
      }

      self._reader.tracking.action("search/submitQuery");
      self.openModalResults();

    };

    request.onerror = function() {
      // There was a connection error of some sort
      self._data = null;
      self.openModalResults();
    };

    request.send();

  },

  _emptyArticle: function() {
    while (this._article && this._article.hasChildNodes()) {
      this._article.removeChild(this._article.lastChild);
    }
  },

  _buildResults: function() {
    var self = this;
    var content;

    this._processing = false;

    self._emptyArticle();

    var reader = this._reader;
    reader.annotations.reset();

    if ( this._data ) {
      var highlight = true
      if (this._data.highlight_off == "yes") {
        highlight = false;
      }
      if ( this._data.search_results.length ) {
        content = DomUtil.create('ol');

        this._data.search_results.forEach(function(result) {
          var option = DomUtil.create('li');
          var anchor = DomUtil.create('a', null, option);
          var cfiRange = "epubcfi(" + result.cfi + ")";

          if (result.snippet) {
            // results for epubs
            var loc = reader.locations.locationFromCfi(cfiRange);
            var locText = "Location " + loc + " • ";
            if (cfiRange.match(/^epubcfi\(page/)) {
              // results for pdfs
              // see heliotrope: app/views/e_pubs/show_pdf.html.erb, _gatherResults()
              loc = cfiRange.split("=")[1]
              locText = "Page " + loc.slice(0, -1) + " • ";
            }
            var locElement = DomUtil.create('i');
            locElement.textContent = locText;
            anchor.appendChild(locElement);
            anchor.appendChild(document.createTextNode(result.snippet));

            anchor.setAttribute("href", cfiRange);
            content.appendChild(option);
          }
          if (highlight) {
            reader.annotations.highlight(cfiRange, {}, null, 'epubjs-search-hl');
          }
        });
      } else {
        content = DomUtil.create("p")
        content.textContent = 'No results found for "' + self.searchString + '"';
      }
    } else {
      content = DomUtil.create("p")
      content.textContent = 'There was a problem processing this query.';
    }

    self._article.appendChild(content);
  },

  EOT: true
});

export var search = function(options) {
  return new Search(options);
}
