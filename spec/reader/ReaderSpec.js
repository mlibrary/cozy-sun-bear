describe("Reader", function () {

  var reader;

  // afterEach(function() {
  //   viewport.reset();
  // });

  it("will load epub.js", function() {
    reader = cozy.reader(document.createElement('div'), {
      engine: 'epubjs',
      engine_href: '/base/vendor/javascripts/engines/epub.js',
      href: '/base/spec/fixtures/moby-dick/'
    })

    console.log(reader.options.href);
    expect(reader.options.href).to.be('/base/spec/fixtures/moby-dick/');
  })

  it("will create a book", function(done) {
    this.timeout(100000);
    var div = document.createElement('div');
    document.body.appendChild(div);
    div.style.width = '100vw';
    div.style.height = '100vh';
    reader = cozy.reader(div, {
      engine: 'epubjs',
      engine_href: '/base/vendor/javascripts/engines/epub.js',
      href: '/base/spec/fixtures/moby-dick/'
    })

    reader.start(function() {
      console.log("AHOY READER");
      expect(reader._book).to.not.be(null);
      done();
    })
  })

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
