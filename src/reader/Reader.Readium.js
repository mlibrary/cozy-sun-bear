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
    // this._book.getMetadata().then(function(meta) {
    //   self.metadata = meta;
    //   self.fire('update-title', self.metadata);
    // })
    // this._book.getToc().then(function(toc) {
    //   var data = { toc : [] };
    //   var toc_idx = 0;
    //   var tmp = toc.slice(0);
    //   while(tmp.length) {
    //     var item = tmp.shift();
    //     toc_idx += 1;
    //     item.id = toc_idx;
    //     data.toc.push(item);
    //     if ( item.subitems && item.subitems.length ) {
    //       item.subitems.reverse().forEach(function(item_) {
    //         item_.parent = item.id;
    //         tmp.unshift(item_);
    //       })
    //     }
    //   }
    //   self._contents = data;
    //   self.fire('update-contents', data);
    // })
    // this._book.ready.all.then(callback);
  },

  draw: function(target, callback) {
    var self = this;

    // start the rendition after all the epub parts 
    // have been loaded
    // this._book.ready.all.then(function() {
    //   // self._rendition = self._book.renderTo(self._panes['book'], self.settings);
    //   var promise = self._book.renderTo(self._panes['book']);
    //   self._bindEvents();
    //   self._drawn = true;

    //   promise.then(function(renderer) {
    //     console.log("AHOY WHAT RENDITION", arguments);
    //     self._rendition = renderer;
    //     if ( target && target.start ) { target = target.start; }
    //     if ( target === undefined ) { console.log("AHOY UNDEFINED START"); target = 0; }
    //     if ( typeof(target) == 'number' ) { console.log("AHOY NUMBER", target); target = self._book.toc[target].cfi; }
    //     self._book.goto(target);
    //     if ( callback ) {
    //       setTimeout(callback, 100);
    //     }
    //   })
    // })

    console.log("AHOY OPENING", self.options.href);
    var readiumOptions = { useSimpleLoader: true };
    self._book = new self.Readium(readiumOptions, { el: '.cozy-module-book' });
    self._book.openPackageDocument(
      self.options.href,
      function(packageDocument, options) {
        if ( callback ) {
          setTimeout(callback, 100);
        }
        console.log("AHOY PACKAGE", packageDocument);
        console.log("AHOY OPTIONS", options);
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
        })
      }
    )

  },

  _navigate: function(target) {
    var self = this;
    console.log("AHOY NAVIGATING");
    // var t = setTimeout(function() {
    //   self._panes['loader'].style.display = 'block';
    // }, 100);
    // // promise.call(this._rendition).then(function() {
    // promise.then(function() {
    //   clearTimeout(t);
    //   self._panes['loader'].style.display = 'none';
    // });
    if (parseInt(target) == target) {
      self._book.reader.openPageIndex(target);
    } else {
      self._book.reader.openSpineItemPage(target);
    }
  },

  _preResize: function() {
    var self = this;
    // self._rendition.render.window.removeEventListener("resize", self._rendition.resized);
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
    this._reader.unload();
  },

  currentLocation: function() {
    if ( this._rendition && this._rendition.manager ) { 
      this._cached_location = this._rendition.currentLocation();
    }
    return this._cached_location;
  },

  _bindEvents: function() {
    var self = this;
    var custom_stylesheet_rules = [];
    this.custom_stylesheet_rules = custom_stylesheet_rules;


    // EPUBJS.Hooks.register("beforeChapterDisplay").styles = function(callback, renderer) {
    //   console.log("AHOY RENDERING", custom_stylesheet_rules.length);
    //   var s = document.createElement("style");
    //   s.type = "text/css";
    //   var innerHTML = '';
    //   custom_stylesheet_rules.forEach(function(rule) {
    //     var css = rule[0] + '{ ';
    //     for(var i = 1; i < rule.length; i++) {
    //       css += rule[i][0] + ": " + rule[i][1] + ";";
    //     }
    //     innerHTML += css + "}\n";
    //   })
    //   renderer.doc.head.appendChild(s);
    //   if (callback) { callback(); }

    // }

    // add a stylesheet to stop images from breaking their columns
    var add_max_img_styles = false;
    if ( this._book.metadata.layout == 'pre-paginated' ) {
      // NOOP
    } else if ( this.options.flow == 'auto' || this.options.flow == 'paginated' ) {
      add_max_img_styles = true;
    }

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
    if ( custom_stylesheet_rules.length ) {
      console.log("AHOY RENDITION", this._rendition);
      // this._rendition.hooks.content.register(function(view) {
      //   view.addStylesheetRules(custom_stylesheet_rules);
      // })
    }

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

  _setupHooks: function() {
    // hooks have to be configured before any EPUBJS object is instantiated
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
