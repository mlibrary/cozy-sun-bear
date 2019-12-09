import '../../__mocks__/jsdom-mock'; // window.matchMedia
import { createReader } from "../../src/reader/Reader"
import { Contents, contents } from "../../src/control/Control.Contents";

describe('Contents', () => {
  it('Contents', () => {
    expect(Contents).toBeDefined();
  });

  it('contents', () => {
    expect(contents).toBeDefined();
  });

  describe('onAdd', () => {
    // Set up our document body
    document.body.innerHTML = '<div id="reader"></div>';

    let _contents = contents({region: 'top.toolbar.left'});
    let _reader = createReader('reader', {
      href: 'http://127.0.0.1:8080/cozy-sun-bear/examples/example.html?/epub3-local/moby-dick',
      flow: 'auto',
      manager: 'scrolling'
    });
    let _container = _contents.addTo(_reader);

    it('contents', () => {
      expect(_contents).toBeDefined();
    });

    it('reader', () => {
      expect(_reader).toBeDefined();
    });

    it('container', () => {
      expect(_container).toBeDefined();
    });
  });
});
