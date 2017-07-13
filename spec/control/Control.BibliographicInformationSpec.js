describe("Control.BibliographicInformation", function () {
  var reader;
  var options = { region: 'top.toolbar.left' };

  beforeEach(function() {
    reader = cozy.reader(document.createElement('div'), {
      engine: 'mock',
      href: 'mock.epub',
      metadata: {
        doi: 'https://doi.org/10.0000/cozy.0000'
      }
    });    
  });

  it("can be added to an unloaded reader", function () {
    new cozy.Control.BibliographicInformation(options).addTo(reader);
  });

  it("can be added and use the default metadata via modal", function () {
    var control = new cozy.Control.BibliographicInformation(options).addTo(reader);
    reader.start();
    happen.click(control._control);

    var container = control._modal._container;
    var keys = [ 'title', 'creator', 'doi' ];
    keys.forEach(function(key) {
      var expr = "dd.cozy-bib-info-value-" + key;
      var node = container.querySelector(expr);
      expect(node).not.to.be(null);
      expect(node.innerHTML).to.be(reader.metadata[key]);
    })
  });
});

