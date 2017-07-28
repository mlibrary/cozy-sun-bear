import * as Util from '../core/Util';
import {Reader} from './Reader';
// import {Readium} from '../readium';
import * as DomUtil from '../dom/DomUtil';

Reader.Readium = Reader.extend({

  initialize: function(id, options) {
    this._setupHooks();

    Reader.prototype.initialize.apply(this, arguments);
  },

  open: function(callback) {
    var self = this;

    this.settings = { flow: this.options.flow };
    
    if ( this.options.flow == 'auto' ) {
      this._panes['book'].style.overflow = 'hidden';
    } else {
      this._panes['book'].style.overflow = 'auto';
    }

    var readiumOptions = { useSimpleLoader: true };
    require(["readium_shared_js/globalsSetup", "readium_shared_js/globals"], function (GlobalsSetup, Globals) {
      require(['jquery', 'readium_js/Readium'], function ($, Readium) {
        self.Readium = Readium;
        callback();
      });
    });
  },

  draw: function(target, callback) {
    var self = this;

    var readiumOptions = { useSimpleLoader: true };
    self._book = new self.Readium(readiumOptions, { el: '.cozy-module-book' });
    self._book.openPackageDocument(
      self.options.href,
      function(packageDocument, options) {
        if ( callback ) {
          setTimeout(callback, 100);
        }
        self.metadata = options.metadata;
        self.fire('update-title', self.metadata);
        packageDocument.generateTocListDOM(function(dom) {
            var data = { toc : [] };
            var toc_idx = 0;
            var __walk = function(items, parent) {
              items.forEach(function(item) {
                toc_idx += 1;
                var link = item.querySelector("a[href]");
                var chapter = { href: link.getAttribute('href'), label: link.innerText, id: toc_idx, parent: parent };
                data.toc.push(chapter);
                var subitems = item.querySelectorAll("ol > li");
                if ( subitems ) {
                  __walk(subitems, chapter.id);
                }
              })
            }
            __walk(dom.querySelectorAll("nav > ol > li"));
            self._contents = data;
            self.fire('update-contents', data);
            self._book.reader.updateSettings({ columnGap: 60 });
        })
      }
    )

  },

  _navigate: function(target) {
    var self = this;
    if (parseInt(target) == target) {
      self._book.reader.openPageIndex(target);
    } else {
      self._book.reader.openSpineItemPage(target);
    }
  },

  _preResize: function() {
    var self = this;
  },

  next: function() {
    var self = this;
    // this._navigate(self._book.nextPage());
    this._book.reader.openPageRight();
  },

  prev: function() {
    // this._navigate(this._book.prevPage());
    this._book.reader.openPageLeft();
  },

  first: function() {
    this._navigate(this._book.goto(0));
  },

  last: function() {
    var self = this;
    var target = this._contents.toc.length - 1;
    this._navigate(this._book.goto(target.cfi));
  },

  gotoPage: function(target) {
    if ( typeof(target) == "string" && target.substr(0, 3) == '../' ) {
      while ( target.substr(0, 3) == '../' ) {
        target = target.substr(3);
      }
    }
    if ( typeof(target) == "string" ) {
      var spine = this._book.reader.spine();
      if ( ! spine.getItemByHref(target) ) {
        if ( spine.getItemByHref("Text/" + target) ) {
          target = "Text/" + target;
        }
      }
      target = spine.getItemByHref(target).idref;
    }
    this._navigate(target);
  },

  destroy: function() {
    this._drawn = false;
    this._book.closePackageDocument();
  },

  reopen: function(options) {
    // different per reader?
    var target = target || this.currentLocation();
    Util.extend(this.options, options);
    var readerSettings = {}; // this._book.reader.viewerSettings();

    readerSettings.scroll = ( options.flow == 'scrolled-doc' ? 'scroll-doc' : 'auto' );
    readerSettings.fontSize = 100;
    if ( options.text_size == 'large' ) { readerSettings.fontSize = parseInt(this.options.fontSizeLarge); }
    else if ( options.text_size == 'small' ) { readerSettings.fontSize = this.options.fontSizeSmall; }
    this._book.reader.updateSettings(readerSettings);
    this._updateTheme();
    this._updateReaderStyles();
  },

  currentLocation: function() {
    if ( this._rendition && this._rendition.manager ) { 
      this._cached_location = this._rendition.currentLocation();
    }
    return this._cached_location;
  },

  _updateReaderStyles: function() {
    var isAuthorTheme = false;

    var styles = this._getThemeStyles();
    var bookStyles = [];
    for(var selector in styles) {
      bookStyles.push({
        selector: selector,
        declarations: styles[selector]
      });
      if ( selector == 'a' ) {
        bookStyles.push({
          selector: selector + ' *',
          declarations: styles[selector]
        });
      }
    }
    this._book.reader.setBookStyles(bookStyles);
  },

  _bindEvents: function() {
    var self = this;
    var custom_stylesheet_rules = [];
    this.custom_stylesheet_rules = custom_stylesheet_rules;
    // TODO - bind page change to update section
  },

  EOT: true

})

Object.defineProperty(Reader.Readium.prototype, 'metadata', {
  get: function() {
    // return the combined metadata of configured + book metadata
    return this._metadata;
  },

  set: function(data) {
    this._metadata = Util.extend({}, data, this.options.metadata);
  }
});

export function createReader(id, options) {
  return new Reader.Readium(id, options);
}
