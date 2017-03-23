import * as Util from '../core/Util';
import {Class} from '../core/Class';
import * as epubjs from '../epubjs';

export var EpubJS = Class.extend({
  options: {
      flow: 'auto',
      href: null,
      reader: null,
      container: null
  },

  initialize: function (reader, options) {
      Util.setOptions(this, options);
      this.settings = { flow: this.options.flow };
      if ( this.options.flow == 'auto' ) {
        this.settings.height = '100%';
      }
      this._reader = reader;
  },

  open: function() {
    var self = this;
    this._book = epubjs.ePub(this.options.href);
    this._book.loaded.navigation.then(function(toc) {
      self._contents = toc;
      self._reader.fire('update-contents', toc);
      self._reader.fire('update-title', self._book.package.metadata);
    })
  },

  draw: function(target) {
    this._rendition = this._book.renderTo(this.options.container, this.settings);
    this._bindEvents();
    this._rendition.display(target);
  },

  next: function() {
    this._rendition.next();
  },

  prev: function() {
    this._rendition.prev();
  },

  gotoPage: function(target) {
    this._rendition.display(target);
  },

  destroy: function() {
    this._rendition.destroy();
  },

  _bindEvents: function() {
    var self = this;
    this._rendition.hooks.content.register(function(view) {
      view.addStylesheetRules([ [ 'img', [ 'max-height', '100%' ], [ 'max-width', '100%'] ] ]);
    })
    this._rendition.on("locationChanged", function(location) {
      // var section = this._book.spine.get(location.start);
      var view = this.manager.current();
      var section = view.section;
      var current = this.book.navigation.get(section.href);
      self._reader.fire("update-section", current);
    })
  },

  EOT: true


});

export function createRenderer(reader, options) {
  return new EpubJS(reader, options);
}
