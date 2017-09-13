import * as Util from '../core/Util';
import {Reader} from './Reader';
import * as epubjs from '../epubjs';
import * as DomUtil from '../dom/DomUtil';

Reader.EpubJS = Reader.extend({

  initialize: function(id, options) {
    Reader.prototype.initialize.apply(this, arguments);
  },

  open: function(callback) {
    var self = this;
    this._book = epubjs.ePub(this.options.href);
    this._book.loaded.navigation.then(function(toc) {
      self._contents = toc;
      self.metadata = self._book.package.metadata;
      self.fire('update-contents', toc);
      self.fire('update-title', self._book.package.metadata);
    })
    this._book.ready.then(callback);
  },

  draw: function(target, callback) {
    var self = this;
    this.settings = { flow: this.options.flow };

    if ( this.options.flow == 'auto' ) {
      this._panes['book'].style.overflow = 'hidden';
    } else {
      this._panes['book'].style.overflow = 'auto';
    }

    // start the rendition after all the epub parts 
    // have been loaded
    window._loaded = false;
    this._book.ready.then(function() {

      // have to set fixed dimensions to avoid edge clipping
      var size = self.getFixedBookPanelSize();
      self.settings.height = size.height; //  + 'px';
      self.settings.width = size.width; //  + 'px';
      self.settings.height = '100%';
      self.settings.width = '100%';

      self.settings['ignoreClass'] = 'annotator-hl';
      self._rendition = self._book.renderTo(self._panes['book'], self.settings);
      self._updateFontSize();
      self._bindEvents();
      self._drawn = true;

      if ( target && target.start ) { target = target.start; }
      self._rendition.display(target).then(function() {
        if ( callback ) { callback(); }
        console.log("AHOY DRAW DISPLAY", self.getFixedBookPanelSize());
        window._loaded = true;
        self._initializeReaderStyles();
      });
    })
  },

  _navigate: function(promise) {
    var self = this;
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
    self._navigate(this._rendition.next());
  },

  prev: function() {
    this._navigate(this._rendition.prev());
  },

  first: function() {
    this._navigate(this._rendition.display(0));
  },

  last: function() {
    var self = this;
    var target = this._book.spine.length - 1;
    this._navigate(this._rendition.display(target));
  },

  gotoPage: function(target) {
    if ( typeof(target) == "string" && target.substr(0, 3) == '../' ) {
      while ( target.substr(0, 3) == '../' ) {
        target = target.substr(3);
      }
    }
    if ( typeof(target) == "string" ) {
      if ( ! this._book.spine.spineByHref[target] ) {
        if ( this._book.spine.spineByHref["Text/" + target] ) {
          target = "Text/" + target;
        }
      }
    }
    this._navigate(this._rendition.display(target));
  },

  destroy: function() {
    if ( this._rendition ) {
      try {
        this._rendition.destroy();
      } catch(e) {}
    }
    this._rendition = null;
    this._drawn = false;
  },

  reopen: function(options, target) {
    // different per reader?
    var _this = this;
    var target = target || this.currentLocation();
    if( target.start ) { target = target.start ; }
    if ( target.cfi ) { target = target.cfi ; }

    Util.extend(this.options, options);

    if ( this._rendition.settings.flow != options.flow ) {
      if ( this.options.flow == 'auto' ) {
        this._panes['book'].style.overflow = 'hidden';
      } else {
        this._panes['book'].style.overflow = 'auto';
      }
      this._rendition.flow(this.options.flow);
    }

    this._updateFontSize();
    this._updateTheme();
    this._selectTheme(true);
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
    if ( this._book.package.metadata.layout == 'pre-paginated' ) {
      // NOOP
    } else if ( this.options.flow == 'auto' || this.options.flow == 'paginated' ) {
      add_max_img_styles = true;
    }

    var custom_stylesheet_rules = [];

    // if ( add_max_img_styles ) {
    //   // WHY IN HEAVENS NAME?
    //   // var style = window.getComputedStyle(this._panes['book']);
    //   var style = window.getComputedStyle(this._rendition.manager.container);
    //   var height = parseInt(style.getPropertyValue('height'));
    //   height -= parseInt(style.getPropertyValue('padding-top'));
    //   height -= parseInt(style.getPropertyValue('padding-bottom'));
    //   // height -= 100;
    //   console.log("AHOY", height, style);
    //   custom_stylesheet_rules.push([ 'img', [ 'max-height', height + 'px !important' ], [ 'max-width', '100% !important'], [ 'height', 'auto' ], [ 'width', 'auto' ]]);
    // }

    this._updateFontSize();

    if ( custom_stylesheet_rules.length ) {
      this._rendition.hooks.content.register(function(view) {
        view.addStylesheetRules(custom_stylesheet_rules);
      })
    }

    this._rendition.on("locationChanged", function(location) {
      var view = this.manager.current();
      var section = view.section;
      var current = this.book.navigation.get(section.href);
      self.fire("update-section", current);
    });

    this._rendition.on("rendered", function(section, view) {
      if ( view.contents ) {
        view.contents.on("linkClicked", function(href) {
          self._rendition.display(href);
        })
      }
    })
  },

  _initializeReaderStyles: function() {
    var self = this;
    var themes = this.options.themes;
    if ( themes ) {
      themes.forEach(function(theme) {
        self._rendition.themes.register(theme['klass'], theme.href ? theme.href : theme.rules);
      })
    }

    // base for highlights
    this._rendition.themes.override('.epubjs-hl', "fill: yellow; fill-opacity: 0.3; mix-blend-mode: multiply;");
  },

  _selectTheme: function(refresh) {
    var theme = this.options.theme || 'default';
    this._rendition.themes.select(theme);
    if ( 0 && refresh ) {
      var cfi = this.currentLocation().end.cfi;
      this._rendition.manager.clear();
      console.log("AHOY", cfi);
      this._rendition.display(cfi);
    }
  },

  _updateFontSize: function() {
    if ( this.options.text_size == 'large' ) {
      this._rendition.themes.fontSize(this.options.fontSizeLarge);
    } else if ( this.options.text_size == 'small' ) {
      this._rendition.themes.fontSize(this.options.fontSizeSmall);
    } else {
      this._rendition.themes.fontSize(this.options.fontSizeDefault);
    }
  },

  _resizeBookPane: function() {
    var self = this;
    return;
    setTimeout(function() {
      var size = self.getFixedBookPanelSize();
      self.settings.height = size.height + 'px';
      self.settings.width = size.width + 'px';
      console.log("AHOY RESIZING?", size, self._panes['book'].getBoundingClientRect());
      self._rendition.manager.resize(size.width, size.height);
    }, 150);
  },

  EOT: true

})

Object.defineProperty(Reader.EpubJS.prototype, 'metadata', {
  get: function() {
    // return the combined metadata of configured + book metadata
    return this._metadata;
  },

  set: function(data) {
    this._metadata = Util.extend({}, data, this.options.metadata);
  }
});

Object.defineProperty(Reader.EpubJS.prototype, 'annotations', {
  get: function() {
    // return the combined metadata of configured + book metadata
    return this._rendition.annotations;
  }
});

export function createReader(id, options) {
  return new Reader.EpubJS(id, options);
}
