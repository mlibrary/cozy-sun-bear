describe("Reader", function () {

  var reader;

  afterEach(function() {
    viewport.reset();
  });

  // it("will not detect mobile", function () {
  //   reader = cozy.reader(document.createElement('div'), {
  //     engine: 'mock',
  //     href: 'mock.epub',
  //     metadata: {
  //       doi: 'https://doi.org/10.0000/cozy.0000'
  //     }
  //   });
  //   expect(reader._checkMobileDevice()).to.be(false);
  // });

  // it("will detect mobile", function () {
  //   viewport.set(320);
  //   reader = cozy.reader(document.createElement('div'), {
  //     engine: 'mock',
  //     href: 'mock.epub',
  //     metadata: {
  //       doi: 'https://doi.org/10.0000/cozy.0000'
  //     }
  //   });
  //   expect(reader._checkMobileDevice()).to.be(true);
  // });
});
