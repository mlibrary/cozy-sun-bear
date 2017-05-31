describe("Control.Citation", function () {
  var reader;
  var options = { region: 'top.toolbar.left' };

  beforeEach(function() {
    reader = cozy.reader(document.createElement('div'), {
      engine: 'mock',
      href: 'mock.epub'
    });    
  });

  it("can be added to an unloaded reader", function () {
    new cozy.Control.Citation(options).addTo(reader);
  });

  it("can be added and use the default metadata", function () {
    var control = new cozy.Control.Citation(options).addTo(reader);
    reader.start();
    var formatted = control._formatCitation();
    expect(formatted).to.be("Mock, Alex. <em>The Mock Life</em>. University Press, 2017.");
  });

  it("can be added and use the default metadata via modal", function () {
    var control = new cozy.Control.Citation(options).addTo(reader);
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

// DOI
describe("Control.Citation", function () {
  var reader;
  var options = { region: 'top.toolbar.left',  };
  var doi = 'https://doi.org/10.0000/fulcrum.12345';

  beforeEach(function() {
    reader = cozy.reader(document.createElement('div'), {
      engine: 'mock',
      href: 'mock.epub',
      metadata: {
        doi: doi,
      }
    });
  });

  it("can use provided DOI", function () {
    var control = new cozy.Control.Citation(options).addTo(reader);
    reader.start();
    happen.click(control._control);

    var possibles = 
      [
        [ 'MLA', "Mock, Alex. <em>The Mock Life</em>. University Press, 2017, " + doi + "." ],
        [ 'APA', "Mock, A. (2017). <em>The Mock Life</em>. Ann Arbor, MI: University Press. " + doi + "." ],
        [ 'Chicago', "Mock, Alex. <em>The Mock Life</em>. Ann Arbor, MI: University Press, 2017. " + doi + "." ]
      ];

    for(var i in possibles) {
      var value = possibles[i][0];
      var test = possibles[i][1];

      var formatted = control._formatCitation(value);
      expect(formatted).to.be(test);
    }

  });

});

// custom author metadata (two authors)
describe("Control.Citation", function () {
  var reader;
  var options = { region: 'top.toolbar.left',  };
  var doi = 'https://doi.org/10.0000/fulcrum.12345';

  beforeEach(function() {
    reader = cozy.reader(document.createElement('div'), {
      engine: 'mock',
      href: 'mock.epub',
      metadata: {
        doi: doi,
        creator: [
          'Alex Mock',
          'Casey Faux'
        ]
      }
    });
  });

  it("can format publications with two authors", function () {
    var control = new cozy.Control.Citation(options).addTo(reader);
    reader.start();
    happen.click(control._control);

    var possibles = 
      [
        [ 'MLA', "Mock, Alex, and Casey Faux. <em>The Mock Life</em>. University Press, 2017, " + doi + "." ],
        [ 'APA', "Mock, A., &amp; Faux, C. (2017). <em>The Mock Life</em>. Ann Arbor, MI: University Press. " + doi + "." ],
        [ 'Chicago', "Mock, Alex, and Casey Faux. <em>The Mock Life</em>. Ann Arbor, MI: University Press, 2017. " + doi + "." ]
      ];

    for(var i in possibles) {
      var value = possibles[i][0];
      var test = possibles[i][1];

      var formatted = control._formatCitation(value);
      expect(formatted).to.be(test);
    }

  });

});

// custom author metadata (multiple authors)
describe("Control.Citation", function () {
  var reader;
  var options = { region: 'top.toolbar.left',  };
  var doi = 'https://doi.org/10.0000/fulcrum.12345';

  beforeEach(function() {
    reader = cozy.reader(document.createElement('div'), {
      engine: 'mock',
      href: 'mock.epub',
      metadata: {
        doi: doi,
        creator: [
          'Alex Mock',
          'Casey Faux',
          'Dallas Ersatz'
        ]
      }
    });
  });

  it("can format publications with multiple authors", function () {
    var control = new cozy.Control.Citation(options).addTo(reader);
    reader.start();
    happen.click(control._control);

    var possibles = 
      [
        [ 'MLA', "Mock, Alex, et al. <em>The Mock Life</em>. University Press, 2017, " + doi + "." ],
        [ 'APA', "Mock, A., et al. (2017). <em>The Mock Life</em>. Ann Arbor, MI: University Press. " + doi + "." ],
        [ 'Chicago', "Mock, Alex, et al. <em>The Mock Life</em>. Ann Arbor, MI: University Press, 2017. " + doi + "." ]
      ];

    for(var i in possibles) {
      var value = possibles[i][0];
      var test = possibles[i][1];

      var formatted = control._formatCitation(value);
      expect(formatted).to.be(test);
    }

  });

});

// editor
describe("Control.Citation", function () {
  var reader;
  var options = { region: 'top.toolbar.left',  };
  var doi = 'https://doi.org/10.0000/fulcrum.12345';

  beforeEach(function() {
    reader = cozy.reader(document.createElement('div'), {
      engine: 'mock',
      href: 'mock.epub',
      metadata: {
        doi: doi,
        creator: [],
        editor: [
          'Alex Mock'
        ]
      }
    });
  });

  it("can format publications with editor", function () {
    var control = new cozy.Control.Citation(options).addTo(reader);
    reader.start();
    happen.click(control._control);

    var possibles = 
      [
        [ 'MLA', "Mock, Alex, editor. <em>The Mock Life</em>. University Press, 2017, " + doi + "." ],
        [ 'APA', "Mock, A. (Ed.). (2017). <em>The Mock Life</em>. Ann Arbor, MI: University Press. " + doi + "." ],
        [ 'Chicago', "Mock, Alex, ed. <em>The Mock Life</em>. Ann Arbor, MI: University Press, 2017. " + doi + "." ]
      ];

    for(var i in possibles) {
      var value = possibles[i][0];
      var test = possibles[i][1];

      var formatted = control._formatCitation(value);
      expect(formatted).to.be(test);
    }

  });

});

// number_of_volumes
describe("Control.Citation", function () {
  var reader;
  var options = { region: 'top.toolbar.left',  };

  beforeEach(function() {
    reader = cozy.reader(document.createElement('div'), {
      engine: 'mock',
      href: 'mock.epub',
      metadata: {
        number_of_volumes: 4
      }
    });
  });

  it("can format publications with multiple volumes", function () {
    var control = new cozy.Control.Citation(options).addTo(reader);
    reader.start();
    happen.click(control._control);

    var possibles = 
      [
        [ 'MLA', "Mock, Alex. <em>The Mock Life</em>. University Press, 2017. 4 vols." ],
        [ 'APA', "Mock, A. (2017). <em>The Mock Life</em> (Vols. 1-4). Ann Arbor, MI: University Press." ],
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