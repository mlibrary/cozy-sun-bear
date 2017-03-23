import {Class} from '../core/Class';
import * as readium from '../readium';

export var Readium = Class.extend({
  options: {
      flow: 'auto',
      href: null,
      reader: null,
      container: null
  },

  initialize: function (options) {
      Util.setOptions(this, options);
  },

  open: function() {
    var self = this;
    this.book = epubjs.ePub(this.options.href);
    this.book.loaded.navigation.then(function(toc) {
      self._contents = toc;
      self.reader.fire('update-contents', toc);
      self.reader.fire('update-title', self.book.package.metadata);
    })
  },

  draw: function(target) {
    this.rendition = this.book.renderTo(this.container, { flow: this.flow });
    this._bindEvents();
    this.rendition.display(target);
  },

  next: function() {
    this.rendition.next();
  },

  prev: function() {
    this.rendition.prev();
  },

  gotoPage: function(target) {
    this.rendition.display(target);
  },

  destroy: function() {
    this.rendition.destroy();
  },

  _bindEvents: function() {
    this.rendition.on("locationChanged", function(location) {
      // var section = this.book.spine.get(location.start);
      var view = this.manager.current();
      var section = view.section;
      var current = self.book.navigation.get(section.href);
      self.fire("update-section", current);
    })
  },

  EOT: true


});

export function createRenderer(options) {
  return new Readium(options);
}
