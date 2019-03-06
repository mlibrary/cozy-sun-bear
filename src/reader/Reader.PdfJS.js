import * as Util from '../core/Util';
import {Reader} from './Reader';
// import pdf from 'pdfjs';
import * as DomUtil from '../dom/DomUtil';

Reader.PdfJS = Reader.extend({

  initialize: function(id, options) {
    // console.log("PDF_Reader.initialize(" + id + ", " + options +")");
    Reader.prototype.initialize.apply(this, arguments);
  },

  open: function(target, callback) {
    // console.log("PDF_Reader.open(" + target + ", " + callback + ")");

    var book_href = this.options.href;
    console.log("book_href = " + book_href)

    var loadingTask = pdfjsLib.getDocument(book_href);
    loadingTask.promise.then(function(pdf) {
      var className = this._panes['pdf'].className;
      this._panes['pdf'].canvas = DomUtil.create('canvas', className + '-canvas', this._panes['pdf']);
      this._book = pdf;

      this._book.metadata = {
        title: 'Profile',
        creator: 'Greg Kostin',
        publisher: 'Heliotrope Press',
        location: 'Ann Arbor, MI',
        pubdate: '2019-03-01'
      };
      this.fire('updateTitle', this._book.metadata);

      var toc = [];
      var ii;
      for (ii = 1; ii <= this._book.numPages; ii++) {
        toc.push({id: ii, href: ii, label: "Page " + ii, parent: null})
      }
      this._book.contents = { toc: toc };
      this.fire('updateContents', this._book.contents);

      var locations = [];
      var iii;
      for (iii = 1; iii <= this._book.numPages; iii++) {
        locations.push(iii)
      }
      this._book.locations = locations;
      this.fire('updateLocations', this._book.locations);

      this._currentPage = 1;
      this.draw(this._currentPage, callback);
    }.bind(this));
  },

  draw: function(target, callback) {
    // console.log("PDF_Reader.draw(" + target + ", " + callback + ")");

    this._book.getPage(target).then(function(page) {
      var clientWidth = this._panes['pdf'].clientWidth;
      var clientHeight = this._panes['pdf'].clientHeight;

      var identityViewport = page.getViewport({ scale: 1, });
      var pageWidth = identityViewport.width;
      var pageHeight = identityViewport.height;

      var scaleWidth = clientWidth / pageWidth;
      var scaleHeight = clientHeight / pageHeight;

      var scale = 1.0;
      scale = scaleHeight;
      scale = scaleWidth;
      var viewport = page.getViewport({scale: scale,});

      var context = this._panes['pdf'].canvas.getContext('2d');
      this._panes['pdf'].canvas.height = viewport.height;
      this._panes['pdf'].canvas.width = viewport.width;

      var renderContext = {
        canvasContext: context,
        viewport: viewport,
      };
      page.render(renderContext);

      this.fire('updateLocations', this._book.locations);
      this._disableBookLoader();
    }.bind(this));
  },

  next: function() {
    // console.log("PDF_Reader.next");
    this.tracking.action('reader/go/next');
    this._currentPage += 1;
    if (this._currentPage > this._book.numPages) {
      this._currentPage = this._book.numPages;
    } else {
      this.draw(this._currentPage, undefined);
    }
  },

  prev: function() {
    // console.log("PDF_Reader.prev");
    this.tracking.action('reader/go/previous');
    this._currentPage -= 1;
    if (this._currentPage < 1) {
      this._currentPage = 1
    } else {
      this.draw(this._currentPage, undefined);
    }
  },

  first: function() {
    // console.log("PDF_Reader.first");
    this.tracking.action('reader/go/first');
    if (this._currentPage != 1) {
      this._currentPage  = 1
      this.draw(this._currentPage, undefined);
    }
  },

  last: function() {
    // console.log("PDF_Reader.last");
    this.tracking.action('reader/go/last');
    if (this._currentPage != this._book.numPages) {
      this._currentPage = this._book.numPages;
      this.draw(this._currentPage, undefined);
    }
  },

  gotoPage: function(target) {
    // console.log("PDF_Reader.gotoPage(" + target + ")");
    this.tracking.action('reader/go/page/' + target);
    if (this._currentPage != +target) {
      this._currentPage = +target;
      this.draw(this._currentPage, undefined);
    }
  },

  destroy: function() {
    // console.log("PDF_Reader.destroy");
  },

  currentLocation: function() {
    // console.log("PDF_Reader.currentLocation");
    return {
      start: { cfi: this._currentPage, href: this._currentPage },
      end: { cfi: this._currentPage, href: this._currentPage }
    }
  },

  _bindEvents: function() {
    // console.log("PDF_Reader._bindEvents");
  },

  _updateTheme: function() {
    // console.log("PDF_Reader._updateTheme");
  },

  EOT: true
});

Object.defineProperty(Reader.PdfJS.prototype, 'annotations', {
  get: function() {
    // console.log("PDF_Reader.get.annotations");
    return {
      reset: function() {},
      highlight: function() {}
    }
  }
});

Object.defineProperty(Reader.PdfJS.prototype, 'locations', {
  get: function() {
    // console.log("PDF_Reader.get.locations");
    return {
      total: this._book.locations.length,
      locationFromCfi: function(cfi) {
        // console.log("PDF_Reader.locations.locationFromCfi");
        return cfi;
      }.bind(this),
      percentageFromCfi: function(cfi) {
        // console.log("PDF_Reader.locations.percentageFromCfi");
        return cfi / this._book.locations.length;
      }.bind(this),
      cfiFromPercentage: function(percentage) {
        // console.log("PDF_Reader.locations.cfiFromPercentage");
        var cfi = Math.trunc(this._book.locations.length * percentage) + 1;
        return (cfi > this._book.locations.length) ? this._book.locations.length : cfi;
      }.bind(this)
    }
  }
});

Object.defineProperty(Reader.PdfJS.prototype, 'metadata', {
  get: function() {
    // console.log("PDF_Reader.get.metadata");
    return this._metadata;
  },

  set: function(data) {
    // console.log("PDF_Reader.set.metadata(" + data + ")");
    this._metadata = Util.extend({}, data, this.options.metadata);
  }
});


window.Reader = Reader;

export function createReader(id, options) {
  return new Reader.PdfJS(id, options);
}
