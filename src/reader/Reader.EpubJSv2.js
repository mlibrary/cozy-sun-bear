import * as Util from '../core/Util';
import {Reader} from './Reader';
import * as epubjs from '../epubjs';
import * as DomUtil from '../dom/DomUtil';

Reader.EpubJSv2 = Reader.extend({

  initialize: function(id, options) {
    Reader.prototype.initialize.apply(this, arguments);
  },

  open: function(callback) {
    var self = this;
    this._book = epubjs.ePub(this.options.href, { restore: false });
    this._book.getMetadata().then(function(meta) {
      self.metadata = meta;
      self.fire('update-title', self.metadata);
    })
    this._book.getToc().then(function(toc) {
      var data = { toc : [] };
      var toc_idx = 0;
      var tmp = toc.slice(0);
      while(tmp.length) {
        var item = tmp.shift();
        toc_idx += 1;
        item.id = toc_idx;
        data.toc.push(item);
        if ( item.subitems && item.subitems.length ) {
          item.subitems.reverse().forEach(function(item_) {
            item_.parent = item.id;
            tmp.unshift(item_);
          })
        }
      }
      self._contents = data;
      console.log("AHOY CONTENTS", data);
      window.toc = data;
      self.fire('update-contents', data);
    })
    this._book.ready.all.then(callback);
  },

  draw: function(target, callback) {
    var self = this;
    this.settings = { flow: this.options.flow };

    // this.settings.height = '100%';
    // this.settings.width = '99%';
    var style = window.getComputedStyle(this._panes['book']);
    var h = this._panes['book'].clientHeight - parseInt(style.paddingTop) - parseInt(style.paddingBottom);
    this.settings.height = Math.ceil(h * 1.00) + 'px';
    this.settings.width = Math.ceil(this._panes['book'].clientWidth * 0.99) + 'px';

    // this.settings.width = '100%';
    
    if ( this.options.flow == 'auto' ) {
      this._panes['book'].style.overflow = 'hidden';
    } else {
      this._panes['book'].style.overflow = 'auto';
    }
    // have to set this to prevent scrolling issues
    // this.settings.height = this._panes['book'].clientHeight;
    // this.settings.width = this._panes['book'].clientWidth;

    // start the rendition after all the epub parts 
    // have been loaded
    this._book.ready.all.then(function() {
      // self._rendition = self._book.renderTo(self._panes['book'], self.settings);
      self._rendition = self._book.renderTo(self._panes['book']);
      self._bindEvents();
      self._drawn = true;

      self._rendition.then(function() {
        if ( target && target.start ) { target = target.start; }
        if ( target === undefined ) { console.log("AHOY UNDEFINED START"); target = 0; }
        if ( typeof(target) == 'number' ) { console.log("AHOY NUMBER", target); target = self._book.toc[target].cfi; }
        self._book.goto(target);
        if ( callback ) {
          setTimeout(callback, 100);
        }
      })
    })
  },

  _navigate: function(promise) {
    var self = this;
    console.log("AHOY NAVIGATING");
    var t = setTimeout(function() {
      self._panes['loader'].style.display = 'block';
    }, 100);
    // promise.call(this._rendition).then(function() {
    promise.then(function() {
      clearTimeout(t);
      self._panes['loader'].style.display = 'none';
    });    
  },

  next: function() {
    var self = this;
    this._navigate(self._book.nextPage());
  },

  prev: function() {
    this._navigate(this._book.prevPage());
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
      if ( ! this._book.spineIndexByURL[target] ) {
        if ( this._book.spineIndexByURL["Text/" + target] ) {
          target = "Text/" + target;
        }
      }
    }
    this._navigate(this._book.goto(target));
  },

  destroy: function() {
    this._drawn = false;
  },

  currentLocation: function() {
    if ( this._rendition && this._rendition.manager ) { 
      this._cached_location = this._rendition.currentLocation();
    }
    return this._cached_location;
  },

  _bindEvents: function() {
    var self = this;

    // add a stylesheet to stop images from breaking their columns
    var add_max_img_styles = false;
    if ( this._book.metadata.layout == 'pre-paginated' ) {
      // NOOP
    } else if ( this.options.flow == 'auto' || this.options.flow == 'paginated' ) {
      add_max_img_styles = true;
    }

    var custom_stylesheet_rules = [];

    if ( add_max_img_styles ) {
      // WHY IN HEAVENS NAME?
      var style = window.getComputedStyle(this._panes['book']);
      var height = parseInt(style.getPropertyValue('height'));
      height -= parseInt(style.getPropertyValue('padding-top'));
      height -= parseInt(style.getPropertyValue('padding-bottom'));
      custom_stylesheet_rules.push([ 'img', [ 'max-height', height + 'px' ], [ 'max-width', '100%'], [ 'height', 'auto' ]]);
    }

    if ( this.options.text_size == 'large' ) {
      this._book.setStyle('fontSize', this.options.fontSizeLarge);
    }
    if ( this.options.text_size == 'small' ) {
      this._book.setStyle('fontSize', this.options.fontSizeSmall);
    }
    if ( this.options.theme == 'dark' ) {
      DomUtil.addClass(this._container, 'cozy-theme-dark');
      custom_stylesheet_rules.push([ 'img', [ 'filter', 'invert(100%)' ] ]);
      // custom_stylesheet_rules.push([ 'body', [ 'background-color', '#191919' ], [ 'color', '#fff' ] ]);
      // custom_stylesheet_rules.push([ 'a', [ 'color', '#d1d1d1' ] ]);
    } else {
      DomUtil.removeClass(this._container, 'cozy-theme-dark');
    }

    // -- this does not work
    // if ( custom_stylesheet_rules.length ) {
    //   this._rendition.hooks.content.register(function(view) {
    //     view.addStylesheetRules(custom_stylesheet_rules);
    //   })
    // }

    this._book.on("renderer:locationChanged", function(location) {
      // var view = this.manager.current();
      // var section = view.section;
      // var current = this.book.navigation.get(section.href);
      var epubjs = new EPUBJS.EpubCFI();
      var parts = epubjs.parse(location);
      var spine = self._book.spine[parts.spinePos];
      var checked = self._contents.toc.filter(function(value) { return value.href == spine.href });
      if ( checked.length ) {
        var current = checked[0];
        self.fire('update-section', current);
      }
    });
  },

  EOT: true

})

Object.defineProperty(Reader.EpubJSv2.prototype, 'metadata', {
  get: function() {
    // return the combined metadata of configured + book metadata
    return this._metadata;
  },

  set: function(data) {
    this._metadata = Util.extend({}, data, this.options.metadata);
  }
});

export function createReader(id, options) {
  return new Reader.EpubJSv2(id, options);
}
