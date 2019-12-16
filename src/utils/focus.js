
var INTERACTIVE = {};
INTERACTIVE['A'] = true;
INTERACTIVE['SELECT'] = true;
INTERACTIVE['BUTTON'] = true;
INTERACTIVE['INPUT'] = true;

function hideEverythingInContents(contents) {
  var elements = contents.document.querySelectorAll('body *');
  for(var i = 0; i < elements.length; i++) {
    if ( elements[i].nodeType == Node.ELEMENT_NODE ) {
      var element = elements[i];
      element.setAttribute('aria-hidden', true);
      element.setAttribute('tabindex', '-1');
    }
  }
}

function hideEverythingVisible(contents) {
  var elements = contents.document.querySelectorAll('[aria-hidden="false"]');
  for(var i = 0; i < elements.length; i++) {
    if ( elements[i].nodeType == Node.ELEMENT_NODE ) {
      elements[i].setAttribute('aria-hidden', true);
      if ( INTERACTIVE[elements[i].nodeName] ) {
        elements[i].setAttribute('tabindex', '-1');
      }
    }
  }
}

function findMatchingContents(contents, cfi) {
  for(var content of contents) {
    if ( cfi.indexOf(content.cfiBase) > -1 ) {
      return content;
    }
  }
  return null; // ???
}

function showEverythingVisible(container, range) {
  var selfOrElement = function(node) {
    return ( node.nodeType == Node.TEXT_NODE ) ? node.parentNode : node;
  }

  var showNode = function(node) {
    console.log("AHOY showNode", node);
    node.setAttribute('aria-hidden', false);
    if ( INTERACTIVE[node.nodeName] ) {
      var bounds = node.getBoundingClientRect();
      var x = bounds.x;
      var x2 = x + container.scrollLeft;
      console.log("AHOY NODE BOUNDS", node, x, x2, 
        "A",
        x > container.scrollLeft + container.offsetWidth,
        x < container.scrollLeft,
        "B",
        x2 > container.scrollLeft + container.offsetWidth,
        x2 < container.scrollLeft
        )
      if ( x > container.scrollLeft + container.offsetWidth || 
           x < container.scrollLeft ) {
      } else {
        node.setAttribute('tabindex', 0);
        node.addEventListener('focus', (event) => {
          console.log("AHOY FOCUS", node, container.scrollLeft, container.dataset.scrollLeft);
          var scrollLeft = parseInt(container.dataset.scrollLeft, 10);
          setTimeout(() => {
            container.scrollLeft = scrollLeft;
          }, 0);
        })
      }
    }
    // node.setAttribute('tabindex', 0);
    for(var child of node.children){
      console.log("AHOY SHOWING CHILDREN", child);
      showNode(child);
    }
  }

  var showNodeAndSelf = function(node) {
    if ( node.getAttribute('aria-hidden') == 'true' ) {
      console.log("AHOY ACTIVATING", node);
      showNode(node);
      var parent = node.parentNode;
      while ( parent != node.ownerDocument.body ) {
        // console.log("AHOY ACTIVATING UP", parent);
        parent.setAttribute('aria-hidden', false);
        //node.setAttribute('tabindex', 0);
        parent = parent.parentNode;
      }
    }
  }

  var ancestor = selfOrElement(range.commonAncestorContainer);
  var startContainer = selfOrElement(range.startContainer);
  var endContainer = selfOrElement(range.endContainer);

  var _iterator = document.createNodeIterator(
    ancestor,
    NodeFilter.SHOW_ALL,
    {
      acceptNode: function(node) {
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  )

  console.log("AHOY COMMON ANCESTOR", ancestor, startContainer);

  var _nodes = [];
  while ( _iterator.nextNode() ) {
    console.log("AHOY ITERATOR", _nodes.length, _iterator.referenceNode, startContainer, _iterator.referenceNode !== startContainer);
    if (_nodes.length === 0 && _iterator.referenceNode !== startContainer) continue;
    _nodes.push(_iterator.referenceNode);
    if (_iterator.referenceNode === endContainer) break;
  }

  console.log("AHOY NODES", _nodes, _nodes[0] == startContainer);
  if ( _nodes.length == 1 && _nodes[0] == startContainer ) {
    _nodes.pop();
    console.log("AHOY WTF", startContainer, document.body, startContainer === document.body);
    for(var child of startContainer.children) {
      _nodes.push(child);
    }
  }

  _nodes.forEach((node) => {
    console.log("AHOY SHOW PRE", node);
    if ( node.nodeType == Node.ELEMENT_NODE ) {
      console.log("AHOY SHOW", node);
      showNodeAndSelf(node);
    } else {
      showNodeAndSelf(node.parentNode);
    }
  })
}

var method;
export function setMethod(what) {
  method = what;
}
export function updateFocus(reader, location) {
  if ( reader.settings.flow == 'scrolled-doc' ) { return ; }
  if ( method == 'v2' ) {
    updateFocusXtreme(reader, location);
  } else if ( method == 'v3' ) {
    updateFocusXtremeXX(reader, location);
  }

  return;

  setTimeout(() => {
    if ( location.start.cfi == reader._last_location_start_cfi && 
         location.end.cfi == reader._last_location_end_cfi ) {
      return;
    }
    reader._last_location_start_cfi = location.start.cfi;
    reader._last_location_end_cfi = location.end.cfi;
    var contents = findMatchingContents(reader._rendition.manager.getContents(), location.start.cfi);
    console.log("AHOY updateFocus contents =", contents);
    hideEverythingVisible(contents);
    var doc = contents.document;
    var startRange = new ePub.CFI(location.start.cfi).toRange(doc);
    var endRange = new ePub.CFI(location.end.cfi).toRange(doc);
    var r = doc.createRange();
    r.setStart(startRange.startContainer, startRange.startOffset);
    r.setEnd(endRange.endContainer, endRange.endOffset);
    console.log("AHOY SHOW CURRENT", location);
    showEverythingVisible(reader._rendition.manager.container, r);
    // self._rendition.manager.container.focus();
  }, 0);

  reader._last_location_start = location.start.href;
}

export function updateFocusXtremeXX(reader, location) {
  // don't use location
  var t0 = performance.now();

  var selfOrElement = function(node) {
    return ( node.nodeType == Node.TEXT_NODE ) ? node.parentNode : node;
  }

  var container = reader._rendition.manager.container;
  var contents = findMatchingContents(reader._rendition.manager.getContents(), location.start.cfi);
  hideEverythingVisible(contents);

  var containerX = container.scrollLeft;
  var containerX2 = container.scrollLeft + container.offsetWidth;

  var _showThisNode = function(node) {
    var bounds = node.getBoundingClientRect();
    var x = bounds.left;
    var x2 = bounds.left + bounds.width;

    var isVisible = false;
    if ( x <= containerX && x2 >= containerX2 ) { isVisible = true; }
    else if ( x >= containerX && x < containerX2 ) { isVisible = true; }
    else if ( x2 > containerX && x2 <= containerX2 ) { isVisible = true; }
    // else if ( x <= containerX && x2 <= containerX2 ) { isVisible = true; }
    // else if ( x >= containerX && x2 <= containerX2 ) { isVisible = true; }
    // else if ( x >= containerX && x2 > containerX2 ) { isVisible = true; }

    if ( isVisible ) {
      // console.log("AHOY", isVisible, node, bounds, containerX, containerX2);
      node.setAttribute('aria-hidden', 'false');
      if ( INTERACTIVE[node.nodeName] ) {
        node.setAttribute('tabindex', '0');
      }
      var hasSeenVisibleChild = false;
      for(var child of node.children) {
        var retval = _showThisNode(child);
        if ( retval ) { hasSeenVisibleChild = true; }
        if ( ! retval && hasSeenVisibleChild ) {
          break;
        }
      }
    }

    return isVisible;
  }

  var startRange = new ePub.CFI(location.start.cfi).toRange(contents.document);
  var startNode = selfOrElement(startRange.startContainer);
  console.log("AHOY", location.start.cfi, startNode, performance.now() - t0);

  var _nodes = [];
  var checkNode = startNode;
  while ( checkNode != contents.document.body ) {
    var bounds = checkNode.getBoundingClientRect();
    var x = bounds.left;
    var x2 = bounds.left + bounds.width;

    var isVisible = false;
    // if ( x <= containerX && x2 >= containerX2 ) { isVisible = true; }
    if ( x >= containerX && x < containerX2 ) { isVisible = true; }
    else if ( x2 > containerX && x2 <= containerX2 ) { isVisible = true; }

    if ( isVisible ) {
      startNode = checkNode;
      checkNode = checkNode.parentNode;
    } else {
      break;
    }

  }

  console.log("AHOY NEXT START", location.start.cfi, startNode, performance.now() - t0);

  var parentNode = startNode.parentNode;
  while ( parentNode != contents.document.body ) {
    parentNode.setAttribute('aria-hidden', false);
    parentNode = parentNode.parentNode;
  }

  _showThisNode(startNode);
  var nextNode = startNode.nextElementSibling;
  while ( nextNode ) {
    var isVisible = _showThisNode(nextNode);
    if ( ! isVisible ) { break; }
    nextNode = nextNode.nextElementSibling;
  }

  console.log("AHOY BENCHMARK XTREME XX", performance.now() - t0);

}

export function updateFocusXtreme(reader, location) {
  // don't use location
  var t0 = performance.now();

  var container = reader._rendition.manager.container;
  var contents = findMatchingContents(reader._rendition.manager.getContents(), location.start.cfi);
  hideEverythingVisible(contents);
  // just stop there for now
  var _nodes = [];
  // for(var child of contents.document.body.children) {
  //   _nodes.push(child);
  // }

  var containerX = container.scrollLeft;
  var containerX2 = container.scrollLeft + container.offsetWidth;

  var _showThisNode = function(node) {
    var bounds = node.getBoundingClientRect();
    var x = bounds.left;
    var x2 = bounds.left + bounds.width;

    var isVisible = false;
    if ( x <= containerX && x2 >= containerX2 ) { isVisible = true; }
    else if ( x >= containerX && x < containerX2 ) { isVisible = true; }
    else if ( x2 > containerX && x2 <= containerX2 ) { isVisible = true; }
    // else if ( x <= containerX && x2 <= containerX2 ) { isVisible = true; }
    // else if ( x >= containerX && x2 <= containerX2 ) { isVisible = true; }
    // else if ( x >= containerX && x2 > containerX2 ) { isVisible = true; }

    if ( isVisible ) {
      // console.log("AHOY", isVisible, node, bounds, containerX, containerX2);
      node.setAttribute('aria-hidden', 'false');
      if ( INTERACTIVE[node.nodeName] ) {
        node.setAttribute('tabindex', '0');
      }
      var hasSeenVisibleChild = false;
      for(var child of node.children) {
        var retval = _showThisNode(child);
        if ( retval ) { hasSeenVisibleChild = true; }
        if ( ! retval && hasSeenVisibleChild ) {
          break;
        }
      }
    }

    return isVisible;
  }

  for(var child of contents.document.body.children) {
    _showThisNode(child);
  }

  while ( _nodes.length ) {
    var node = _nodes.pop();
    var bounds = node.getBoundingClientRect();

    var x = bounds.left;
    var x2 = bounds.left + bounds.width;

    var isVisible = false;
    if ( x <= containerX && x2 >= containerX2 ) { isVisible = true; }
    else if ( x >= containerX && x < containerX2 ) { isVisible = true; }
    else if ( x2 > containerX && x2 <= containerX2 ) { isVisible = true; }
    // else if ( x <= containerX && x2 <= containerX2 ) { isVisible = true; }
    // else if ( x >= containerX && x2 <= containerX2 ) { isVisible = true; }
    // else if ( x >= containerX && x2 > containerX2 ) { isVisible = true; }

    // console.log("AHOY", isVisible, node, bounds, containerX, containerX2);

    node.setAttribute('aria-hidden', 'false');

    if ( isVisible ) {
      var _tmp = [];
      for(var child of node.children) {
        _tmp.push(child);
      }
      // _tmp.reverse();
      _nodes.unshift.apply(_nodes, _tmp);
    }

    // if ( x > container.scrollLeft + container.offsetWidth || 
    //      x < container.scrollLeft ) {
    // } else {


  }

  console.log("AHOY BENCHMARK XTREME", performance.now() - t0);
}

export function setupFocusRules(reader) {
  var contents = reader._rendition.getContents();
  contents.forEach( (content) => {
    content.addStylesheetRules({
      '[aria-hidden="true"]': {
        'opacity': '0.25 !important'
      },
      ':focus': {
        'outline': '2px solid goldenrod',
        'padding': '4px',
        'background': 'lightgoldenrodyellow'
      }
    })

    hideEverythingInContents(content);

    // --- attempts to heal safari/edge
    content.document.addEventListener('keydown', function(event) {
      if ( event.keyCode == 9 ) {

        var activeElement = content.document.activeElement;
        if ( activeElement ) {
          console.log("AHOY TAB ACTIVE ELEMENT", activeElement, reader._manager.container.scrollLeft);
          reader._manager.container.dataset.scrollLeft = reader._manager.container.scrollLeft;
        } else {
          reader._manager.container.dataset.scrollLeft = 0;
          console.log("AHOY TAB NO ACTIVE ELEMENT");
        }
      }
    })
  });

  reader.on('keyDown', function(data) {
    if ( data.keyName == 'Tab' ) {
      console.log("AHOY KEYDOWN COZY", data.keyName, document.activeElement.localName, reader._manager.container.scrollLeft);
      reader._manager.container.dataset.scrollLeft = reader._manager.container.scrollLeft;
    }

    if ( data.keyName == 'Tab' && data.inner ) {
      var container = reader._rendition.manager.container;
      // container.dataset.scrollLeft = 0;

      var mod;
      var delta;
      var x; var xyz;
      setTimeout(function() {
        var scrollLeft = container.scrollLeft;
        mod = scrollLeft % parseInt(reader._rendition.manager.layout.delta, 10);
        if ( mod > 0 && ( mod / reader._rendition.manager.layout.delta ) < 0.99 ) {
          // var x = Math.floor(event.target.scrollLeft / parseInt(self._rendition.manager.layout.delta, 10)) + 1;
          // var delta = ( x * self._rendition.manager.layout.delta) - event.target.scrollLeft;
          x = Math.floor(container.scrollLeft / parseInt(reader._rendition.manager.layout.delta, 10));
          if ( data.shiftKey ) { x -= 0 ; }
          else { x += 1; }
          var y = container.scrollLeft;
          delta = ( x * self._rendition.manager.layout.delta ) - y;
          xyz = ( x * reader._rendition.manager.layout.delta );
          // if ( data.shiftKey ) { delta *= -1 ; }
          if ( true || ! data.shiftKey ) {
            reader._rendition.manager.scrollBy(delta);
          }
        }
        // console.log("AHOY DOING THE SCROLLING", data.shiftKey, scrollLeft, mod, x, xyz, delta);
      }, 0);
    }
  })
}