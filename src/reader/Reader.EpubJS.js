import * as Util from '../core/Util';
import {Reader} from './Reader';
import * as epubjs from '../epubjs';
import * as DomUtil from '../dom/DomUtil';
import * as Browser from '../core/Browser';

import path from "path-webpack";

Reader.EpubJS = Reader.extend({

  initialize: function(id, options) {
    Reader.prototype.initialize.apply(this, arguments);
    this._epubjs_ready = false;
    window.xpath = path;
  },

  open: function(callback) {
    var self = this;
    this._book = epubjs.ePub(this.options.href);
    this._book.loaded.navigation.then(function(toc) {
      self._contents = toc;
      self.metadata = self._book.package.metadata;
      console.log("AHOY TOC", toc);
      self.fire('updateContents', toc);
      self.fire('updateTitle', self._book.package.metadata);
    })
    this._book.ready.then(function() {
      self._book.locations.generate(1600).then(function(locations) {
        self.fire('updateLocations', locations);
      })
    })
    .then(callback);
  },

  draw: function(target, callback) {
    var self = this;
    this.settings = { flow: this.options.flow };
    this.settings.manager = this.options.manager || 'default';

    if ( this.options.flow == 'auto' || this.options.flow == 'paginated' ) {
      this._panes['book'].style.overflow = 'hidden';
    } else {
      this._panes['book'].style.overflow = 'auto';
    }

    // start the rendition after all the epub parts 
    // have been loaded
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

      self._rendition.hooks.content.register(function(contents) {
        self.fire('ready:contents', contents);
        self.fire('readyContents', contents);
        contents.document.addEventListener('keydown', (event) => {
          const keyName = event.key;
          self.fire('keyDown', { keyName: keyName, shiftKey: event.shiftKey, inner: true });
          console.log('inner keydown event: ', keyName);
        });
        // var links = contents.document.querySelectorAll('a[href]');
        // for(var i =0; i < links.length; i++) {
        //   var link = links[i];
        //   link.addEventListener('focus', (event) => {
        //     var target = event.target;
        //     var position = target.getBoundingClientRect();
        //     var c = self._rendition.manager.container;
        //     var cr = c.scrollLeft + c.offsetWidth;
        //     console.log('inner link focus', cr, position, position.x > cr);
        //   })
        // }
      })

      if ( target && target.start ) { target = target.start; }
      if ( ! target && window.location.hash ) {
        if ( window.location.hash.substr(1, 3) == '/6/' ) {
          target = "epubcfi(" + window.location.hash.substr(1) + ")";
        } else {
          target = window.location.hash.substr(2);
          target = self._book.url.path().resolve(target);
        }
      }

      self.gotoPage(target, function() {
        window._loaded = true;
        self._initializeReaderStyles();

        if ( callback ) { callback(); }

        self.fire('opened');
        self.fire('ready');
        self._epubjs_ready = true;
      })        
    })
  },

  _scroll: function(delta) {
    var self = this;
    if ( self.options.flow == 'scrolled-doc' ) {
      var container = self._rendition.manager.container;
      var rect = container.getBoundingClientRect();
      var scrollTop = container.scrollTop;
      var newScrollTop = scrollTop;
      var scrollBy = ( rect.height * 0.98 );
      switch(delta) {
        case 'PREV':
          newScrollTop = -( scrollTop + scrollBy );
          break;
        case 'NEXT':
          newScrollTop = ( scrollTop + scrollBy );
          break;
        case 'HOME':
          newScrollTop = 0;
          break;
        case 'END':
          newScrollTop = container.scrollHeight - scrollBy;
          break;
      }
      container.scrollTop = newScrollTop;
      return ( Math.floor(container.scrollTop) != Math.floor(scrollTop) );
    }
    return false;
  },

  _navigate: function(promise, callback) {
    var self = this;
    var t = setTimeout(function() {
      self._panes['loader'].style.display = 'block';
    }, 100);
    promise.then(function() {
      clearTimeout(t);
      self._panes['loader'].style.display = 'none';
      if ( callback ) { callback(); }
    }).catch(function(e) {
      clearTimeout(t);
      self._panes['loader'].style.display = 'none';
      if ( callback ) { callback(); }
      throw(e);
    })
  },

  next: function() {
    var self = this;
    self._scroll('NEXT') || self._navigate(this._rendition.next());
  },

  prev: function() {
    this._scroll('PREV') || this._navigate(this._rendition.prev());
  },

  first: function() {
    this._navigate(this._rendition.display(0));
  },

  last: function() {
    var self = this;
    var target = this._book.spine.length - 1;
    this._navigate(this._rendition.display(target));
  },

  gotoPage: function(target, callback) {
    if ( target ) {
      var section = this._book.spine.get(target); 
      if ( ! section) {
        // maybe it needs to be resolved
        var guessed = target;
        if ( guessed.indexOf("://") < 0 ) {
          var path1 = path.resolve(this._book.path.directory, this._book.package.navPath);
          var path2 = path.resolve(path.dirname(path1), target);
          guessed = this._book.canonical(path2);
        }
        if ( guessed.indexOf("#") !== 0 ) {
          guessed = guessed.split('#')[0];
        }

        this._book.spine.each(function(item) {
          if ( item.canonical == guessed ) {
            section = item;
            target = section.href;
            return;
          }
        })

        console.log("AHOY GUESSED", target);
      }

      if ( ! section ) {
        if ( ! this._epubjs_ready ) {
          target = 0;
        } else {
          return;
        }
      }
    }

    this._navigate(this._rendition.display(target), callback);
  },

  percentageFromCfi: function(cfi) {
    return this._book.percentageFromCfi(cfi);
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
    var target = target || this.currentLocation();
    if( target.start ) { target = target.start ; }
    if ( target.cfi ) { target = target.cfi ; }

    var doUpdate = false;
    Object.keys(options).forEach(function(key) {
      doUpdate = doUpdate || ( options[key] != this.options[key] );
    }.bind(this));

    if ( ! doUpdate ) {
      return;
    }

    Util.extend(this.options, options);

    if ( this._rendition.settings.flow != options.flow ) {
      if ( this.options.flow == 'auto' || this.options.flow == 'paginated' ) {
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

    this._rendition.on('resized', function(box) {
      self.fire('resized', box);
    })

    this._rendition.on('relocated', function(location) {
      self.fire('relocated', location);
    })

    this._rendition.on("locationChanged", function(location) {
      var view = this.manager.current();
      var section = view.section;
      var current = this.book.navigation.get(section.href);

      self.fire("updateSection", current);
      self.fire("updateLocation", location);
    });

    this._rendition.on("rendered", function(section, view) {
      if ( view.contents ) {
        view.contents.on("xxlinkClicked", function(href) {
          console.log("AHOY CLICKED", href);
          var tmp = href.split("#");
          href = tmp[0];
          var hash = tmp[1]
          // var current = self.currentLocation().start.href;
          // var section = self._book.spine.get(current.href);
          console.log("AHOY CLICKED CHECK", section.canonical, href);
          if ( section.canonical.indexOf(href) < 0 ) {
            self.gotoPage(href);
            // self._rendition.display(href);

          } else if ( hash ) {
            // we're already on this page, so we need to scroll to this location
            var node = view.contents.content.querySelector('#' + hash);
            console.log("AHOY INTERNAL", hash, view.contents, node);
          }
          // self._rendition.display(href);
        })
      }
      if (false) {
        if ( ! self._rendition.manager.__scroll ) {
          var ticking;
          var lastScrollLeft = self._rendition.manager.container.scrollLeft;
          self._rendition.manager.container.addEventListener("scroll", function(event) {
            if ( ! ticking ) {
              var newScrollLeft = event.target.scrollLeft;
              var mod = event.target.scrollLeft % parseInt(self._rendition.manager.layout.delta, 10);
              var tweak = self._rendition.manager.views._views[0].document.activeElement;
              if ( mod > 10 ) {
                console.log("AHOY ADJUSTING SCROLL", mod, tweak, newScrollLeft, lastScrollLeft, newScrollLeft > lastScrollLeft);
                ticking = true;
                var x = Math.floor(event.target.scrollLeft / parseInt(self._rendition.manager.layout.delta, 10)) + 1;
                var y = event.target.scrollLeft;
                if ( event.target.scrollLeft > lastScrollLeft ) { y *= 1 ; }
                else { y *= -1; }
                var delta = ( x * self._rendition.manager.layout.delta) + y;
                self._rendition.manager.scrollBy(delta);
                setTimeout(function() { lastScrollLeft = newScrollLeft; ticking = false; }, 100);
              }
            }
          })
          self._rendition.manager.views.__scroll = true;
        }
      }

      if(true) {
        if ( ! self._rendition.manager.__scroll ) {
          var ticking;
          self._rendition.manager.container.addEventListener("scroll", function(event) {
            var container = self._rendition.manager.container;
            var mod = container.scrollLeft % parseInt(self._rendition.manager.layout.delta, 10);
            console.log("AHOY DETECTED SCROLL", mod, mod / self._rendition.manager.layout.delta);
          });
          self._rendition.manager.views.__scroll = true;
        }
      }

      self.on('keyDown', function(data) {
        if ( data.keyName == 'Tab' && data.inner ) {
          var container = self._rendition.manager.container;
          var mod;
          var delta;
          var x; var xyz;
          setTimeout(function() {
            var scrollLeft = container.scrollLeft;
            mod = scrollLeft % parseInt(self._rendition.manager.layout.delta, 10);
            if ( mod > 0 && ( mod / self._rendition.manager.layout.delta ) < 0.99 ) {
              // var x = Math.floor(event.target.scrollLeft / parseInt(self._rendition.manager.layout.delta, 10)) + 1;
              // var delta = ( x * self._rendition.manager.layout.delta) - event.target.scrollLeft;
              x = Math.floor(container.scrollLeft / parseInt(self._rendition.manager.layout.delta, 10));
              if ( data.shiftKey ) { x -= 0 ; } 
              else { x += 1; }
              var y = container.scrollLeft;
              delta = ( x * self._rendition.manager.layout.delta ) - y;
              xyz = ( x * self._rendition.manager.layout.delta );
              // if ( data.shiftKey ) { delta *= -1 ; }
              if ( true || ! data.shiftKey ) {
                self._rendition.manager.scrollBy(delta);
              }
            }
            console.log("AHOY DOING THE SCROLLING", data.shiftKey, scrollLeft, mod, x, xyz, delta);
          }, 0);
        }
      })


    })
  },

  _debugScroll: function() {
    var self = this;
    var container = self._rendition.manager.container;
    var mod = container.scrollLeft % parseInt(self._rendition.manager.layout.delta, 10);
    console.log("AHOY DEBUG MOD", mod);
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
    var text_size = this.options.text_size == 'auto' ? 100 : this.options.text_size;
    this._rendition.themes.fontSize(`${text_size}%`);
    // if ( this.options.text_size == 'large' ) {
    //   this._rendition.themes.fontSize(this.options.fontSizeLarge);
    // } else if ( this.options.text_size == 'small' ) {
    //   this._rendition.themes.fontSize(this.options.fontSizeSmall);
    // } else {
    //   this._rendition.themes.fontSize(this.options.fontSizeDefault);
    // }
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
    if ( Browser.ie ) {
      return {
        reset: function() { /* NOOP */ },
        highlight: function(cfiRange) { /* NOOP */ }
      }
    }
    return this._rendition.annotations;
  }
});

Object.defineProperty(Reader.EpubJS.prototype, 'locations', {
  get: function() {
    // return the combined metadata of configured + book metadata
    return this._book.locations;
  }
});

window.Reader = Reader;

export function createReader(id, options) {
  return new Reader.EpubJS(id, options);
}
