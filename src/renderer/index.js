import * as EpubJS from './EpubJS';

import * as Readium from './Readium';

export var engines = {
  epubjs: EpubJS.createRenderer,
  readium: Readium.createRenderer
};
