import {Reader} from './Reader';
import * as EpubJS from './Reader.EpubJS';
import * as Mock from './Reader.Mock';
import * as PdfJS from './Reader.PdfJS';

var engines = {
  epubjs: EpubJS.createReader,
  mock: Mock.createReader,
  pdfjs: PdfJS.createReader,
};

export var reader = function(id, options) {
  options = options || {};
  var engine = options.engine || window.COZY_EPUB_ENGINE || 'epubjs';
  var engine_href = options.engine_href || window.COZY_EPUB_ENGINE_HREF;
  var _this = this;
  var _arguments = arguments;

  options.engine = engine;
  options.engine_href = engine_href;

  return engines[engine].apply(_this, [id, options]);
};
