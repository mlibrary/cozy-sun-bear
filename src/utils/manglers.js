import Url from "epubjs/src/utils/url";

export function popupTables(reader, contents) {
  var tables = contents.document.querySelectorAll('table');
  var h = reader._rendition.manager.layout.height;
  var clipped_tables = [];
  for(var i = 0; i < tables.length; i++) {
    var table = tables[i];
    if ( table.offsetHeight >= h ) {
      clipped_tables.push(table);
    }
  }

  if ( ! clipped_tables.length ) { return ; }

  // stash this before modifying the HTML to add popup button
  contents._originalHTML = contents.document.documentElement.outerHTML;

  setTimeout(function() {
    for(var i = 0; i < clipped_tables.length; i++) {
      var table = clipped_tables[i];
      table.style.opacity = '0.75';
      var tableHTML = table.outerHTML;

      var clipDiv = contents.document.createElement('div');
      clipDiv.style.position = 'absolute';
      clipDiv.style.padding = '8px';
      clipDiv.style.textAlign = 'center';
      clipDiv.style.bottom = '10px';
      clipDiv.style.width = `${table.offsetWidth * 0.9}px`;
      clipDiv.style.left = `${( table.offsetLeft + table.offsetWidth / 2 ) - ( table.offsetWidth * 0.9 / 2 )}px`;
      clipDiv.style.backgroundColor = 'black';
      clipDiv.style.color = 'white';
      clipDiv.innerHTML = `<p><span aria-hidden="true">❖ </span>This table will appear clipped in Firefox.<br /><button style="font-size: 1em">Read Table</button></p>`;
      clipDiv = contents.document.body.appendChild(clipDiv);

      var button = clipDiv.querySelector('button');
      button.dataset.tableHTML = tableHTML;
      button.addEventListener('click', function(e) {
        e.preventDefault();

        var regex = /<body[^>]+>/;
        var index0 = contents._originalHTML.search(regex);
        var newHTML = contents._originalHTML.substr(0, index0) + '<body style="padding: 20px">' + `<section>${this.dataset.tableHTML}</section>`  + '</body></html>';

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
    }
  }, 500);
}

export function testTables(reader, contents) {
  var tables = contents.document.querySelectorAll('table');
  var h = reader._rendition.manager.layout.height;
  var clipped_tables = [];
  for(var i = 0; i < tables.length; i++) {
    var table = tables[i];
    if ( table.offsetHeight >= h ) {
      clipped_tables.push(table);
    }
  }

  if ( ! clipped_tables.length ) { return ; }
  console.log("AHOY testTables", clipped_tables.length);

  contents.addStylesheetRules({
    'table.clipped': {
      'max-height': `${h * 0.25}px !important`,
      overflow: 'hidden !important',
      display: 'block !important',
      position: 'relative !important'
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
      'background-color': '#000000',
      color: '#ffffff',
      margin: '2px 0',
      border: '1px solid transparent',
      'border-radius': '4px',
      padding: '1rem 1rem'
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
    // table.style.maxHeight = `${h * 0.25}px`;
    // table.style.overflow = 'hidden';
    // table.style.display = 'block';
    // table.style.position = 'relative';
    table.classList.add('clipped');

    var div = document.createElement('div');
    div.classList.add('clipped');
    // div.style.position = 'absolute';
    // div.style.display = 'flex';
    // div.style.alignItems = 'center';
    // div.style.justifyContent = 'center';
    // div.style.left = '0px'; div.style.right = '0px';
    // div.style.top = '0px'; div.style.bottom = '0px'; 
    // div.style.backgroundColor = 'rgba(255, 255, 255, 0.75)';
    table.appendChild(div);

    var button = document.createElement('button');
    // button.style.backgroundColor = '#000000';
    // button.style.color = '#ffffff';
    // button.style.margin = '2px 0';
    // button.style.border = '1px solid transparent';
    // button.style.borderRadius = '4px';
    // button.style.padding = '0.5em 1em';

    button.innerText = 'READ THIS TABLE';

    div.appendChild(button);

  });
}

export function extractElement() {

}