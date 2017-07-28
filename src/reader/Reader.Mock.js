import * as Util from '../core/Util';
import {Reader} from './Reader';
import * as DomUtil from '../dom/DomUtil';

Reader.Mock = Reader.extend({

  initialize: function(id, options) {
    Reader.prototype.initialize.apply(this, arguments);
  },

  open: function(callback) {
    var self = this;
    this._book = {
      metadata: {
        title: 'The Mock Life',
        creator: 'Alex Mock',
        publisher: 'University Press',
        location: 'Ann Arbor, MI',
        pubdate: '2017-05-23'
      },
      contents: [
      ]
    };

    this.metadata = this._book.metadata;
    this.fire('update-contents', this._book.contents);
    this.fire('update-title', this._metadata);
    callback();
  },

  draw: function(target, callback) {
    var self = this;
    this.settings = { flow: this.options.flow };
    this.settings.height = '100%';
    this.settings.width = '99%';
    // this.settings.width = '100%';
    if ( this.options.flow == 'auto' ) {
      this._panes['book'].style.overflow = 'hidden';
    } else {
      this._panes['book'].style.overflow = 'auto';
    }
    // have to set this to prevent scrolling issues
    // this.settings.height = this._panes['book'].clientHeight;
    // this.settings.width = this._panes['book'].clientWidth;

    // // start the rendition after all the epub parts 
    // // have been loaded
    // this._book.ready.then(function() {
    //   self._rendition = self._book.renderTo(self._panes['book'], self.settings);
    //   self._bindEvents();

    //   if ( target && target.start ) { target = target.start; }
    //   self._rendition.display(target).then(function() {
    //     if ( callback ) { callback(); }
    //   });
    // })
  },

  next: function() {
    // this._rendition.next();
  },

  prev: function() {
    // this._rendition.prev();
  },

  first: function() {
    // this._rendition.display(0);
  },

  last: function() {
  },

  gotoPage: function(target) {
    if ( typeof(target) == "string" && target.substr(0, 3) == '../' ) {
      while ( target.substr(0, 3) == '../' ) {
        target = target.substr(3);
      }
    }
    // this._rendition.display(target);
  },

  destroy: function() {
    // if ( this._rendition ) {
    //   this._rendition.destroy();
    // }
    // this._rendition = null;
  },

  currentLocation: function() {
    if ( this._rendition ) { 
      return this._rendition.currentLocation();
    }
    return null;
  },

  _bindEvents: function() {
    var self = this;

  },

  _updateTheme: function() {

  },

  EOT: true

})

Object.defineProperty(Reader.Mock.prototype, 'metadata', {
  get: function() {
    // return the combined metadata of configured + book metadata
    return this._metadata;
  },

  set: function(data) {
    this._metadata = Util.extend({}, data, this.options.metadata);
  }
});

export function createReader(id, options) {
  return new Reader.Mock(id, options);
}
