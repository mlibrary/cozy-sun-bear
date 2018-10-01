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

  open: function(target, callback) {
    var self = this;
    if ( typeof(target) == 'function' ) {
      callback = target;
      target = undefined;
    }
    if ( callback == null ) {
      callback = function() { };
    }

    // okay, we need to do some hacking to fetch the dang files
    // but this isn't going to be done async
    self.rootfiles = [];
    var request = new XMLHttpRequest();
    request.open('GET', this.options.href + "/META-INF/container.xml");
    request.responseType = 'document';
    request.onload = function() {
      var containerDoc = request.responseXML;
      var rootfiles = containerDoc.querySelectorAll("rootfile");
      if ( rootfiles.length > 1 ) {
        console.log("AHOY ROOTFILES MULTIPLE RENDITIONS", rootfiles.length);
        for(var i = 0; i < rootfiles.length; i++) {
          var rootfile = rootfiles[i];
          var rootfilePath = rootfile.getAttribute('full-path');
          var label = rootfile.getAttribute('rendition:label');
          var layout = rootfile.getAttribute('rendition:layout');
          self.rootfiles.push({
            rootfilePath: rootfilePath,
            label: label,
            layout: layout
          })
        }
      }
    }
    request.send();

    this.options.rootfilePath = this.options.rootfilePath || sessionStorage.getItem('rootfilePath');

    var book_href = this.options.href;
    var book_options = { packagePath: this.options.rootfilePath };
    if ( this.options.useArchive ) {
      book_href = book_href.replace(/\/(\w+)\/$/, '/$1/$1.sm.epub');
      book_options.openAs = 'epub';
    }
    this._book = epubjs.ePub(book_href, book_options);
    sessionStorage.removeItem('rootfilePath');
    // this._book = epubjs.ePub(this.options.href);
    this._book.loaded.navigation.then(function(toc) {
      self._contents = toc;
      self.metadata = self._book.package.metadata;
      self.fire('updateContents', toc);
      self.fire('updateTitle', self._book.package.metadata);
    })
    this._book.ready.then(function() {
      self.draw(target, callback);
      if ( self.metadata.layout == 'pre-paginated' ) {
        // fake it with the spine
        var locations = [];
        self._book.spine.each(function(item) {
          locations.push(`epubcfi(${item.cfiBase}!/4/2)`);
          self.locations._locations.push(`epubcfi(${item.cfiBase}!/4/2)`);
        });
        self.locations.total = locations.length;
        var t;
        var f = function() {
          if ( self._rendition && self._rendition.manager && self._rendition.manager.stage ) {
            var location = self._rendition.currentLocation();
            if ( location && location.start) {
              self.fire('updateLocations', locations);
              clearTimeout(t);
              return;
            }
          }
          t = setTimeout(f, 100);
        }

        t = setTimeout(f, 100);
      } else {
        self._book.locations.generate(1600).then(function(locations) {
          // console.log("AHOY WUT", locations);
          self.fire('updateLocations', locations);
        })
      }
    })
    // .then(callback);
  },

  draw: function(target, callback) {
    var self = this;

    if ( self._rendition ) {
      // self._unbindEvents();
      var container = self._rendition.manager.container;
      Object.keys(self._rendition.hooks).forEach(function(key) {
        console.log("AHOY draw clearing", key);
        self._rendition.hooks[key].clear();
      })
      self._rendition.destroy();
      self._rendition = null;
    }

    this.settings = { flow: this.options.flow };
    this.settings.manager = this.options.manager || 'default';

    if ( this.settings.flow == 'auto' && this.metadata.layout == 'pre-paginated' ) {
      // dumb check to see if the window is _tall_ enough to put
      // two pages side by side
      if ( this._container.offsetHeight <= this.options.forceScrolledDocHeight ) {
        this.settings.flow = 'scrolled-doc';
        this.settings.manager = 'prepaginated';
      }
    }

    if ( this.settings.flow == 'auto' || this.settings.flow == 'paginated' ) {
      this._panes['epub'].style.overflow = this.metadata.layout == 'pre-paginated' ? 'auto' : 'hidden';
      this.settings.manager = 'default';
    } else {
      this._panes['epub'].style.overflow = 'auto';
      if ( this.settings.manager == 'default' ) {
        this.settings.manager = 'continuous';
      }
    }

    if ( ! callback ) {
      callback = function() { };
    }

    if ( this.metadata.layout == 'pre-paginated' && this.settings.manager == 'continuous' ) {
        this.settings.manager = 'prepaginated';
    }

    if ( this.settings.manager == 'prepaginated' ) {
      this.settings.spread = 'none';
    }

    // would pre-paginated work better if we scaled the default view from the start? maybe?
    if ( false && this.metadata.layout == 'pre-paginated' && this.settings.manager == 'default' ) {
      this.settings.spread = 'none';
      this._panes['epub'].style.overflow = 'auto';
    }

    self.settings.height = '100%';
    self.settings.width = '100%';
    self.settings['ignoreClass'] = 'annotator-hl';

    if ( self.options.scale != '100' ) {
      self.settings.scale = parseInt(self.options.scale, 10) / 100;
    }

    self._panes['book'].dataset.manager = this.settings.manager + ( this.settings.spread ? `-${this.settings.spread}` : '');
    self._panes['book'].dataset.layout = this.metadata.layout || 'reflowable';

    self._drawRendition(target, callback);
  },

  _drawRendition: function(target, callback) {
    var self = this;

    self._rendition = self._book.renderTo(self._panes['epub'], self.settings);
    self._updateFontSize();
    self._bindEvents();
    self._drawn = true;

    if ( target && target.start ) { target = target.start; }
    if ( ! target && window.location.hash ) {
      if ( window.location.hash.substr(1, 3) == '/6/' ) {
        target = "epubcfi(" + window.location.hash.substr(1) + ")";
      } else {
        target = window.location.hash.substr(2);
        target = self._book.url.path().resolve(target);
      }
    }

    var status_index = 0;
    self._rendition.on('started', function() {

      self._rendition.manager.on("building", function(status) {
        if ( status ) {
          status_index += 1;
          self._panes['loader-status'].innerHTML = `<span>${Math.round((status_index / status.total) * 100.0)}%</span>`;
        } else {
          self._enableBookLoader(-1);
        }
      })
      self._rendition.manager.on("built", function() {
        console.log("AHOY manager built");
        self._disableBookLoader(true);
      })
    })

    self._rendition.hooks.content.register(function(contents) {
      self.fire('ready:contents', contents);
      self.fire('readyContents', contents);
      contents.document.addEventListener('keydown', (event) => {
        const keyName = event.key;
        self.fire('keyDown', { keyName: keyName, shiftKey: event.shiftKey, inner: true });
        console.log('inner keydown event: ', keyName);
      });
    })

    self.gotoPage(target, function() {
      window._loaded = true;
      self._initializeReaderStyles();

      if ( callback ) { callback(); }

      self._epubjs_ready = true;

      setTimeout(function() {
        self.fire('opened');
        self.fire('ready');
        clearTimeout(self._queueTimeout);
        self.tracking.event("openBook", {
          rootFilePath: self.options.rootFilePath,
          flow: self.settings.flow,
          manager: self.settings.manager
        });
      }, 100);
    })
  },

  _scroll: function(delta) {
    var self = this;
    if ( self.options.flow == 'XXscrolled-doc' ) {
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
    self._enableBookLoader(100);
    promise.then(function() {
      console.log("AHOY NAVIGATE FIN");
      self._disableBookLoader();
      if ( callback ) { callback(); }
    }).catch(function(e) {
      self._disableBookLoader();
      if ( callback ) { callback(); }
      console.log("AHOY NAVIGATE ERROR", e);
      throw(e);
    })
  },

  next: function() {
    var self = this;
    this.tracking.action('reader/go/next');
    self._scroll('NEXT') || self._navigate(this._rendition.next());
  },

  prev: function() {
    this.tracking.action('reader/go/previous');
    this._scroll('PREV') || this._navigate(this._rendition.prev());
  },

  first: function() {
    this.tracking.action('reader/go/first');
    this._navigate(this._rendition.display(0), undefined);
  },

  last: function() {
    var self = this;
    this.tracking.action('reader/go/last');
    var target = this._book.spine.length - 1;
    this._navigate(this._rendition.display(target), undefined);
  },

  gotoPage: function(target, callback) {
    if ( target != null ) {
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
      } else if ( target.toString().match(/^\d+$/) ) {
        console.log("AHOY USING", section.href);
        target = section.href;
      }

      if ( ! section ) {
        if ( ! this._epubjs_ready ) {
          target = 0;
        } else {
          return;
        }
      }
    }

    console.log("AHOY gotoPage", target);

    var navigating = this._rendition.display(target).then(function() {
      this._rendition.display(target);
    }.bind(this));
    this._navigate(navigating, callback);
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
    if ( options === true ) { doUpdate = true; options = {}; }
    var changed = {};
    Object.keys(options).forEach(function(key) {
      if ( options[key] != this.options[key] ) {
        doUpdate = true;
        changed[key] = true;
      }
      // doUpdate = doUpdate || ( options[key] != this.options[key] );
    }.bind(this));

    if ( ! doUpdate ) {
      return;
    }

    // performance hack
    if ( Object.keys(changed).length == 1 && changed.scale ) {
      reader.options.scale = options.scale;
      this._updateScale();
      return;
    }

    if ( options.rootfilePath && options.rootfilePath != this.options.rootfilePath ) {
      // we need to REOPEN THE DANG BOOK
      sessionStorage.setItem('rootfilePath', options.rootfilePath);
      location.reload();
      return;
    }

    Util.extend(this.options, options);

    this.draw(target, function() {
      this._updateFontSize();
      this._updateScale();
      this._updateTheme();
      this._selectTheme(true);
    }.bind(this))
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

    // force 90% height instead of default 60%
    if ( this.metadata.layout != 'pre-paginated' ) {
      this._rendition.hooks.content.register(function(contents) {
        contents.addStylesheetRules({
          "img" : {
            "max-width": (this._layout.columnWidth ? this._layout.columnWidth + "px" : "100%") + "!important",
            "max-height": (this._layout.height ? (this._layout.height * 0.9) + "px" : "90%") + "!important",
            "object-fit": "contain",
            "page-break-inside": "avoid"
          },
          "svg" : {
            "max-width": (this._layout.columnWidth ? this._layout.columnWidth + "px" : "100%") + "!important",
            "max-height": (this._layout.height ? (this._layout.height * 0.9) + "px" : "90%") + "!important",
            "page-break-inside": "avoid"
          }
        });
      }.bind(this._rendition))
    } else {
      this._rendition.hooks.content.register(function(contents) {
        contents.addStylesheetRules({
          "img" : {
            // "border": "64px solid black !important",
            "box-sizing": "border-box !important"
          },
          "figure": {
            "box-sizing": "border-box !important",
            "margin": "0 !important"
          }
        });
      }.bind(this._rendition));
    }

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

    this._rendition.on('displayerror', function(err) {
      console.log("AHOY RENDITION DISPLAY ERROR", err);
    })

    this._rendition.on("locationChanged", function(location) {
      var view = this.manager.current();
      var section = view.section;
      var current = this.book.navigation.get(section.href);

      self.fire("updateSection", current);
      self.fire("updateLocation", location);
      // self.fire("relocated", location);
    });

    this._rendition.on("rendered", function(section, view) {

      if ( view.contents ) {
        // view.contents.on("xxlinkClicked", function(href) {
        //   console.log("AHOY CLICKED", href);
        //   var tmp = href.split("#");
        //   href = tmp[0];
        //   var hash = tmp[1]
        //   // var current = self.currentLocation().start.href;
        //   // var section = self._book.spine.get(current.href);
        //   console.log("AHOY CLICKED CHECK", section.canonical, href);
        //   if ( section.canonical.indexOf(href) < 0 ) {
        //     self.gotoPage(href);
        //     // self._rendition.display(href);

        //   } else if ( hash ) {
        //     // we're already on this page, so we need to scroll to this location
        //     var node = view.contents.content.querySelector('#' + hash);
        //     console.log("AHOY INTERNAL", hash, view.contents, node);
        //   }
        //   // self._rendition.display(href);
        // })
      }

      if(false) {
        if ( ! self._rendition.manager.container.dataset.__scroll ) {
          var ticking;
          self._rendition.manager.container.addEventListener("scroll", function(event) {
            if ( self._rendition && self._rendition.manager ) {
              var container = self._rendition.manager.container;
              var mod = container.scrollLeft % parseInt(self._rendition.manager.layout.delta, 10);
              console.log("AHOY DETECTED SCROLL", mod, mod / self._rendition.manager.layout.delta);
            }
          });
          self._rendition.manager.container.dataset.__scroll = true;
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
    if ( this.metadata.layout == 'pre-paginated') {
      // we're not doing font changes for pre-paginted
      return;
    }

    var text_size = this.options.text_size == 'auto' ? 100 : this.options.text_size;
    this._rendition.themes.fontSize(`${text_size}%`);
  },

  _updateScale: function() {
    if ( this.metadata.layout != 'pre-paginated') {
      // we're not scaling for reflowable
      return;
    }
    var scale = this.options.scale;
    if ( scale ) {
      this.settings.scale = parseInt(scale, 10) / 100.0;
      this._queueScale();
    }
  },

  _queueScale: function(scale) {
    this._queueTimeout = setTimeout(function() {
      if ( this._rendition.manager && this._rendition.manager.stage ) {
        console.log("AHOY SCALING", this.settings.scale);
        this._rendition.scale(this.settings.scale);
      } else {
        this._queueScale();
      }
    }.bind(this), 100);
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
    if ( ! this._rendition.annotations.reset ) {
      this._rendition.annotations.reset = function(){
        for(var hash in this._annotations) {
            var cfiRange = decodeURI(hash);
            this.remove(cfiRange);
        }
        this._annotationsBySectionIndex = {};
      }.bind(this._rendition.annotations);
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
