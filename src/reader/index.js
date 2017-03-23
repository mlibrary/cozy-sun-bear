import {Reader} from './Reader';
import * as EpubJS from './Reader.EpubJS';

var engines = {
  epubjs: EpubJS.createReader
}

export var reader = function(id, options) {
  var engine = options.engine || 'epubjs';
  return engines[engine].apply(this, arguments);
}