describe("Modal", function () {
  var reader;
  var options = { region: 'top.toolbar.left' };

  function simulateClick(el) {
  	if (document.createEvent) {
  		var e = document.createEvent('MouseEvents');
  		e.initMouseEvent('click', true, true, window,
  				0, 0, 0, 0, 0, false, false, false, false, 0, null);
  		return el.dispatchEvent(e);
  	} else if (el.fireEvent) {
  		return el.fireEvent('onclick');
  	}
  }

  function simulateKeypress(character) {
  	if (document.createEvent) {
  		var e = document.createEvent('KeyboardEvent');
  		(evt.initKeyEvent || evt.initKeyboardEvent)("keypress", true, true, window,
  		                    0, 0, 0, 0,
  		                    0, character.charCodeAt(0))
  	}
  }

  beforeEach(function() {
    reader = cozy.reader(document.createElement('div'), {
      engine: 'mock',
      href: 'mock.epub'
    });    
  });

  it("basic modal can be created", function () {
  	var modal = reader.modal({
        region: 'left',
        title: 'Stage Left',
        template: '<p>Ahoy.</p>'
    })
  	expect(modal.modal.getAttribute('aria-hidden')).to.be('true');
  });

  describe("advanced behaviors", function() {
  	var modal;
  	var result;
  	beforeEach(function() {
  		modal = reader.modal({
  		        region: 'left',
  		        title: 'Stage Left',
  		        template: '<p><a href="#one">First Link</a></p><p><a href="#two">Second Link</a></p><p><a href="#three">Third Link</a></p>',
  		        actions: [
	  		        { label: 'Action 1', callback: function(event) { result = "Action 1" } },
	  		        { label: 'Action 2', callback: function(event) { result = "Action 2" }, close: true },
  		        ]
  		    })
  		modal.showModal();    
  	});

  	it("is not dismissed clicking Action 1", function() {
  		var button = modal.container.querySelector("#action-" + modal._id + "-0");
  		simulateClick(button);
  		expect(result).to.be('Action 1');
  		expect(modal.modal.getAttribute('aria-hidden')).to.be('false');
  	})

  	it("is dismissed clicking Action 2", function() {
  		var button = modal.container.querySelector("#action-" + modal._id + "-1");
  		simulateClick(button);
  		expect(result).to.be('Action 2');
  		expect(modal.modal.getAttribute('aria-hidden')).to.be('true');
  	})

  	// setTimeout to allow modal to be opened and focus to shift?
  	it("the close button should have focus", function() {
  		var button = modal.container.querySelector("header .modal__close");
  		expect(modal.modal.getAttribute('aria-hidden')).to.be('false');
  		setTimeout(function() {
	  		var focused = document.activeElement;
	  		expect(button).to.be(focused);
  		}, 0);
  	})

  	it("tab should keep focus within modal", function() {
  		var tab = "\t";
  		var focusable = modal.getFocusableNodes();
  		expect(modal.modal.getAttribute('aria-hidden')).to.be('false');
  		setTimeout(function() {
	  		expect(document.activeElement).to.be(focusable[0]);

	  		simulateKeypress(tab);
	  		expect(document.activeElement).to.be(focusable[1]);

	  		simulateKeypress(tab);
	  		expect(document.activeElement).to.be(focusable[2]);

	  		simulateKeypress(tab);
	  		expect(document.activeElement).to.be(focusable[3]);

	  		simulateKeypress(tab);
	  		expect(document.activeElement).to.be(focusable[4]);

	  		simulateKeypress(tab);
	  		expect(document.activeElement).to.be(focusable[0]);
  		}, 0);
  	})

  })



});