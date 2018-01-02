import {Reader} from './Reader';
import * as EpubJS from './Reader.EpubJS';
import * as Mock from './Reader.Mock';

var engines = {
  epubjs: EpubJS.createReader,
  mock: Mock.createReader
}

export var reader = function(id, options) {
  var engine = options.engine || window.COZY_EPUB_ENGINE || 'epubjs';
  return engines[engine].apply(this, arguments);
}