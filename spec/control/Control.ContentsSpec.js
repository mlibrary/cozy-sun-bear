describe("Control.Contents", function () {
  var reader;
  var options = { region: 'top.toolbar.left' };

  beforeEach(function() {
    reader = cozy.reader(document.createElement('div'), {
      engine: 'mock',
      href: 'mock.epub',
    });
  });

  it("can be added to an unloaded reader", function () {
    new cozy.Control.Contents(options).addTo(reader);
  });

  it("contents panel will be constructed", function () {
    var control = new cozy.Control.Contents(options).addTo(reader);

    reader.start(function() {
      happen.click(control._control);

      var div = control._modal._container;
      var n = div.querySelectorAll("a");
      expect(node).not.to.be(0);

    });
  });

  it("skip link WILL NOT be created", function () {
    var control = new cozy.Control.Contents(options).addTo(reader);

    reader.start(function() {
    	expect(document.getElementById(control._id)).to.be(null);
    });
  });

  it("skip link WILL be created", function () {
  	var skip_div = document.createElement('div');
  	skip_div.setAttribute('class', 'skip');
  	document.body.appendChild(skip_div);

    var control = new cozy.Control.Contents({ region: options.region, skipLink: '.skip'}).addTo(reader);

    reader.start(function() {
    	expect(document.getElementById(control._id)).not.to.be(null);
    });
  });

});

