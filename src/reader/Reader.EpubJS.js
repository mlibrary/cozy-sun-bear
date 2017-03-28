import * as Util from '../core/Util';
import {Reader} from './Reader';
import * as epubjs from '../epubjs';

Reader.EpubJS = Reader.extend({

  initialize: function(id, options) {
    Reader.prototype.initialize.apply(this, arguments);
  },

  open: function() {
    var self = this;
    this._book = epubjs.ePub(this.options.href);
    this._book.loaded.navigation.then(function(toc) {
      self._contents = toc;
      self.fire('update-contents', toc);
      self.fire('update-title', self._book.package.metadata);
    })
  },

  draw: function(target) {
    this.settings = { flow: this.options.flow };
    if ( this.options.flow == 'auto' ) {
      this.settings.height = '100%';
      this._panes['book'].style.overflow = 'hidden';
    } else {
      this._panes['book'].style.overflow = 'auto';
    }
    this._rendition = this._book.renderTo(this._panes['book'], this.settings);
    this._bindEvents();

    if ( target.start ) { target = target.start; }
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

  currentLocation: function() {
    return this._rendition.currentLocation();
  },

  _bindEvents: function() {
    var self = this;

    // add a stylesheet to stop images from breaking their columns
    this._rendition.hooks.content.register(function(view) {
      view.addStylesheetRules([ [ 'img', [ 'max-height', '100%' ], [ 'max-width', '100%'] ] ]);
    })
    this._rendition.on("locationChanged", function(location) {
      var view = this.manager.current();
      var section = view.section;
      var current = this.book.navigation.get(section.href);
      self.fire("update-section", current);
    })
  },

  EOT: true

})

export function createReader(id, options) {
  return new Reader.EpubJS(id, options);
}