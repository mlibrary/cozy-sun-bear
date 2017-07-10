import {Control} from './Control';
import {Reader} from '../reader/Reader';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';

// Title + Chapter

export var BibliographicInformation = Control.extend({
  options: {
    label: 'Info',
    direction: 'left',
    html: '<span class="oi" data-glyph="info">Info</span>'
  },

  defaultTemplate: `<button class="button--sm cozy-bib-info oi" data-glyph="info" data-toggle="open"> Info</button>`,

  onAdd: function(reader) {
    var self = this;
    var container = this._container;
    if ( container ) {
      this._control = container.querySelector("[data-target=" + this.options.direction + "]");
    } else {

      var className = this._className(),
          options = this.options;

      container = DomUtil.create('div', className);

      var template = this.options.template || this.defaultTemplate;

      var body = new DOMParser().parseFromString(template, "text/html").body;
      while ( body.children.length ) {
        container.appendChild(body.children[0]);
      }
    }

    this._reader.on('update-contents', function(data) {
      self._createPanel();
    });


    this._control = container.querySelector("[data-toggle=open]");
    DomEvent.on(this._control, 'click', function(event) {
      event.preventDefault();
      self._modal.activate();
    }, this)

    return container;
  },

  _createPanel: function() {
    var self = this;

    var template = `<dl>
    </dl>`;

    this._modal = this._reader.modal({
      template: template,
      title: 'Info',
      className: { article: 'cozy-preferences-modal' },
      region: 'left',
      fraction: 1.0
    });

    var dl = this._modal._container.querySelector('dl');

    var metadata_fields = [
      [ 'title', 'Title' ],
      [ 'creator', 'Author' ],
      [ 'pubdate', 'Publication Date' ],
      [ 'modified_date', 'Modified Date' ],
      [ 'publisher', 'Publisher' ],
      [ 'rights', 'Rights' ],
      [ 'doi', 'DOI' ],
      [ 'description', 'Description' ],
    ];

    var metadata_fields_seen = {};

    var metadata = this._reader.metadata;

    var dateFormat = new Intl.DateTimeFormat('en-US', {
      year: 'numeric', month: '2-digit', day: '2-digit'
    });

    for(var idx in metadata_fields) {
      var key = metadata_fields[idx][0];
      var label = metadata_fields[idx][1];
      if ( metadata[key] ) {
        metadata_fields_seen[key] = true;
        var dt = DomUtil.create('dt', 'cozy-bib-info-label', dl);
        dt.innerHTML = label;
        var dd = DomUtil.create('dd', 'cozy-bib-info-value cozy-bib-info-value-' + key, dl);
        var value = metadata[key];
        if ( key == 'pubdate' || key == 'modified_date' ) {
          var d = new Date(value);
          value = dateFormat.format(d);
          // value = d.toISOString().slice(0,10); // for YYYY-MM-DD
        }
        dd.innerHTML = value;
      }
    }

  },

  EOT: true
});

export var bibliographicInformation = function(options) {
  return new BibliographicInformation(options);
}
