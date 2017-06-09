describe("Control.CitationOptions", function () {
  var reader;
  var options = { region: 'top.toolbar.left' };

  beforeEach(function() {
    reader = cozy.reader(document.createElement('div'), {
      engine: 'mock',
      href: 'mock.epub',
      metadata: {
        citations: [
          { format: 'MLA', text: "Mock, Alex. <em>The Mock Life</em>. University Press, 2017." },
          { format: 'APA', text: "Mock, A. (2017). <em>The Mock Life</em>. Ann Arbor, MI: University Press." },
          { format: 'Chicago', text: "Mock, Alex. <em>The Mock Life</em>. Ann Arbor, MI: University Press, 2017." }
        ]
      }
    });    
  });

  it("can be added to an unloaded reader", function () {
    new cozy.Control.CitationOptions(options).addTo(reader);
  });

  it("can be added and use the default metadata via modal", function () {
    var control = new cozy.Control.CitationOptions(options).addTo(reader);
    reader.start();
    happen.click(control._control);

    var possibles = 
      [
        [ 'MLA', "Mock, Alex. <em>The Mock Life</em>. University Press, 2017." ],
        [ 'APA', "Mock, A. (2017). <em>The Mock Life</em>. Ann Arbor, MI: University Press." ],
        [ 'Chicago', "Mock, Alex. <em>The Mock Life</em>. Ann Arbor, MI: University Press, 2017." ]
      ];

    for(var i in possibles) {
      var value = possibles[i][0];
      var test = possibles[i][1];

      var formatted = control._formatCitation(value);
      expect(formatted).to.be(test);
    }

  });
});

