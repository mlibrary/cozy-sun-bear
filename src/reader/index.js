import {Reader} from './Reader';
import * as EpubJS from './Reader.EpubJS';
import * as Mock from './Reader.Mock';
import * as EpubJSv2 from './Reader.EpubJSv2';
import * as Readium from './Reader.Readium';

var engines = {
  epubjs: EpubJS.createReader,
  epubjsv2: EpubJSv2.createReader,
  readium: Readium.createReader,
  mock: Mock.createReader
}

export var reader = function(id, options) {
  var engine = options.engine || window.COZY_EPUB_ENGINE || 'epubjs';
  return engines[engine].apply(this, arguments);
}