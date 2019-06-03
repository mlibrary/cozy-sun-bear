import Url from "epubjs/src/utils/url";

export function popupTables(reader, contents) {
  var tables = contents.document.querySelectorAll('table');
  var h = reader._rendition.manager.layout.height;
  var clipped_tables = [];
  for(var i = 0; i < tables.length; i++) {
    var table = tables[i];
    if ( table.offsetHeight >= ( h * 0.75 ) ) {
      clipped_tables.push(table);
    }
  }

  if ( ! clipped_tables.length ) { return ; }

  contents._originalHTML = contents.document.documentElement.outerHTML;

  contents.addStylesheetRules({
    'table.clipped': {
      'max-height': `${h * 0.25}px !important`,
      overflow: 'hidden !important',
      display: 'inline-block !important',
      position: 'relative !important',
      'break-inside': 'avoid'
    },
    'table.clipped::after': {
      content: "",
      display: 'block',
      break: 'all'
    },
    'div.clipped': {
      position: 'absolute',
      display: 'flex',
      'align-items': 'center',
      'justify-content': 'center',
      top: '0px',
      bottom: '0px',
      right: '0px',
      left: '0px',
      'background-color': 'rgba(255, 255, 255, 0.75)'
    },
    'div.clipped button': {
      cursor: 'pointer',
      'background-color': '#000000',
      color: '#ffffff',
      margin: '2px 0',
      border: '1px solid transparent',
      'border-radius': '4px',
      padding: '1rem 1rem',
      'text-transform': 'uppercase'
    },
    'div.clipped button:active': {
      transform: 'translateY(1px)',
      filter: 'saturate(150%)'
    },
    'div.clipped button:hover, div.clipped button:focus': {
      color: '#000000',
      'border-color': 'currentColor',
      'background-color': 'white'
    }
  });

  clipped_tables.forEach((table) => {
    // find a dang background color
    var element = table;
    var styles
    var bgcolor;
    while ( bgcolor === undefined && element instanceof HTMLElement ) {
      styles = window.getComputedStyle(element);
      if ( styles.backgroundColor != 'rgba(0, 0, 0, 0)' && styles.backgroundColor != 'transparent' ) {
        bgcolor = styles.backgroundColor;
        break;
      }
      element = element.parentNode;
    }

    if ( ! bgcolor ) {
      // no background color defined in the EPUB, so what is cozy-sun-bear using?
      element = reader._panes['epub'];
      while ( bgcolor === undefined && element instanceof HTMLElement ) {
        styles = window.getComputedStyle(element);
        if ( styles.backgroundColor != 'rgba(0, 0, 0, 0)' && styles.backgroundColor != 'transparent' ) {
          bgcolor = styles.backgroundColor;
          break;
        }
        element = element.parentNode;
      }
    }

    if ( ! bgcolor ) { bgcolor = '#fff'; }

    var tableHTML = table.outerHTML;

    table.classList.add('clipped');

    var div = document.createElement('div');
    div.classList.add('clipped');
    table.appendChild(div);

    var button = document.createElement('button');
    button.innerText = 'Open table';
    button.dataset.tableHTML = tableHTML;
    button.addEventListener('click', function(event) {
      event.preventDefault();

      var regex = /<body[^>]+>/;
      var index0 = contents._originalHTML.search(regex);
      var newHTML = contents._originalHTML.substr(0, index0) + `<body style="padding: 1.5rem; background: ${bgcolor}"><section>${this.dataset.tableHTML}</section></body></html>`;

      reader.popup({
        title: 'View Table',
        srcdoc: newHTML,
        onLoad: function(contentDocument, modal) {
          // adpated from epub.js#replaceLinks --- need to catch _any_ link
          // to close the modal
          var base = contentDocument.querySelector("base");
          var location = base ? base.getAttribute("href") : undefined;

          var links = contentDocument.querySelectorAll('a[href]');
          for(var i = 0; i < links.length; i++) {
            var link = links[i];
            var href = link.getAttribute('href');
            link.addEventListener('click', function(event) {
              modal.closeModal();
              var absolute = (href.indexOf('://') > -1);
              if ( absolute ) {
                link.setAttribute('target', '_blank');
              } else {
                var linkUrl = new Url(href, location);
                if (linkUrl) {
                  event.preventDefault();
                  reader.gotoPage(linkUrl.Path.path + ( linkUrl.hash ? linkUrl.hash : '' ));
                }
              }
            })
          } 
        }
      })

    })

    div.appendChild(button);

  });
}

export function extractElement() {

}