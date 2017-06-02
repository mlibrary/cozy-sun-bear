import {Control} from './Control';
import {Reader} from '../reader/Reader';
import * as DomUtil from '../dom/DomUtil';
import * as DomEvent from '../dom/DomEvent';
import {parseFullName} from 'parse-full-name';

// for debugging
window.parseFullName = parseFullName;

export var Citation = Control.extend({
  options: {
    label: 'Citation',
    html: '<span>Get Citation</span>'
  },

  defaultTemplate: `<button class="button--sm cozy-citation" data-toggle="open">Get Citation</button>`,


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

  _action: function() {
    var self = this;
    self._modal.activate();
  },

  _createButton: function (html, title, className, container, fn) {
    var link = DomUtil.create('button', className, container);
    link.innerHTML = html;
    link.title = title;

    link.setAttribute('role', 'button');
    link.setAttribute('aria-label', title);

    DomEvent.disableClickPropagation(link);
    DomEvent.on(link, 'click', DomEvent.stop);
    DomEvent.on(link, 'click', fn, this);

    return link;
  },

  _createPanel: function() {
    var self = this;

    var template = `<form>
      <fieldset>
        <legend>Select Citation Format</legend>
        <label><input name="format" type="radio" value="MLA" checked="checked" /> MLA</label>
        <label><input name="format" type="radio" value="APA" /> APA</label>
        <label><input name="format" type="radio" value="Chicago" /> Chicago</label>
      </fieldset>
    </form>
    <blockquote id="formatted" style="padding: 8px; border-left: 4px solid black; background-color: #fff"></blockquote>
    <div class="alert alert-info" id="message" style="display: none"></div>`;

    this._modal = this._reader.modal({
      template: template,
      title: 'Copy Citation to Clipboard',
      className: { article: 'cozy-preferences-modal' },
      actions: [
        {
          label: 'Copy Citation',
          callback: function(event) {
            document.designMode = "on";
            var formatted = self._modal._container.querySelector("#formatted");
            // formatted.style.backgroundColor = 'rgba(255,255,255,1.0)';

            var range = document.createRange();
            range.selectNode(formatted);
            var sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);

            // formatted.select();

            try {
              var flag = document.execCommand('copy');
            } catch(err) {
              console.log("AHOY COPY FAILED", err);
            }

            self._message.innerHTML = 'Success! Citation copied to your clipboard.';
            self._message.style.display = 'block';
            sel.removeAllRanges();
            range.detach();
            document.designMode = "off";
          }
        }
      ],
      region: 'left',
      fraction: 1.0
    });

    this._form = this._modal._container.querySelector('form');
    this._formatted = this._modal._container.querySelector("#formatted");
    this._message = this._modal._container.querySelector("#message");
    DomEvent.on(this._form, 'change', function(event) {
      var target = event.target;
      if ( target.tagName == 'INPUT' ) {
        this._initializeForm();
      }
    }, this);

    this._initializeForm();
  },

  _initializeForm: function() {
    var formatted = this._formatCitation();
    this._formatted.innerHTML = formatted;
    // this._formatted.value = formatted;
    this._message.style.display = 'none';
    this._message.innerHTML = '';
  },

  _formatCitation: function(format) {
    if ( format == null ) {
      var selected = this._form.querySelector("input:checked");
      format = selected.value;
    }
    var fn = "_formatCitationAs" + format;
    return this[fn](this._reader.metadata);
  },

  _formatCitationAsMLA: function(metadata) {

    var _formatNames = function(names, suffix) {
      var name = names.shift()
      var tmp = name.last;
      if ( name.first ) { tmp += ", " + name.first ; }
      if ( name.middle ) { tmp += " " + name.middle ; }
      if ( names.length == 1 ) {
        name = names.shift();
        tmp += ", and ";
        if ( name.first ) { tmp += name.first + " " ; }
        if ( name.middle ) { tmp += name.middle + " " ; }
        tmp += name.last;
      } else if ( names.length > 1 ) {
        tmp += ", et al";
      }
      if ( suffix ) {
        tmp += suffix;
      }
      return tmp + ".";
    };

    var parts = [];
    var creator = this._parseCreator(metadata.creator);
    var editor = this._parseEditor(metadata.editor);
    if ( creator.length ) {
      parts.push(_formatNames(creator));
    }
    if ( editor.length ) {
      parts.push(_formatNames(editor, editor.length > 1 ? ', editors' : ', editor'));
    }
    if ( metadata.title ) { parts.push("<em>" + metadata.title + "</em>" + "."); }
    if ( metadata.publisher ) {
      var part = metadata.publisher;
      if ( metadata.pubdate ) {
        var d = new Date(metadata.pubdate);
        part += `, ${d.getYear() + 1900}`;
      }
      if ( metadata.number_of_volumes ) {
        part += `. ${metadata.number_of_volumes} vols`;
      }
      if ( metadata.doi ) {
        part += `, ${metadata.doi}`;
      }
      parts.push(part + '.');
    }
    return parts.join(' ');
  },

  _formatCitationAsAPA: function(metadata) {

    var _formatNames = function(names, suffix) {
      var name = names.shift()
      var tmp = name.last;
      if ( name.first ) { tmp += ", " + name.first.substr(0, 1) + "." ; }
      if ( name.middle ) { tmp += name.middle.substr(0, 1) + "." ; }
      if ( names.length == 1 ) {
        name = names.shift();
        tmp += ", &amp; ";
        tmp += name.last;
        if ( name.first ) { tmp += ", " + name.first.substr(0, 1) + "." ; }
        if ( name.middle ) { tmp += name.middle.substr(0, 1) + "." ; }
      } else if ( names.length > 1 ) {
        tmp += ", et al.";
      }
      if ( suffix ) {
        tmp += suffix + ".";
      }
      return tmp;
    }

    var parts = [];
    var creator = this._parseCreator(metadata.creator);
    var editor = this._parseEditor(metadata.editor);
    if ( creator.length ) {
      parts.push(_formatNames(creator));
    }
    if ( editor.length ) {
      parts.push(_formatNames(editor, editor.length > 1 ? ' (Eds.)' : ' (Ed.)'));
    }
    if ( metadata.pubdate ) {
      var d = new Date(metadata.pubdate);
      parts.push("(" + ( d.getYear() + 1900 ) + ").");
    }
    if ( metadata.title ) {
      var part = "<em>" + metadata.title + "</em>";
      if ( metadata.number_of_volumes ) {
        part += ` (Vols. 1-${metadata.number_of_volumes})`;
      }
      part += ".";
      parts.push(part);
    }
    if ( metadata.location ) {
      parts.push(metadata.location + ":");
    }
    if ( metadata.publisher ) {
      parts.push(metadata.publisher + ".");
    }
    if ( metadata.doi ) {
      parts.push(metadata.doi + ".");
    }
    return parts.join(' ');
  },

  _formatCitationAsChicago: function(metadata) {

    var _formatNames = function(names, suffix) {
      var name = names.shift()
      var tmp = name.last;
      if ( name.first ) { tmp += ", " + name.first ; }
      if ( name.middle ) { tmp += " " + name.middle ; }
      if ( names.length == 1 ) {
        name = names.shift();
        tmp += ", and ";
        if ( name.first ) { tmp += name.first + " " ; }
        if ( name.middle ) { tmp += name.middle + " " ; }
        tmp += name.last;
      } else if ( names.length > 1 ) {
        tmp += ", et al";
      }
      if ( suffix ) {
        tmp += suffix;
      }
      tmp += ".";
      return tmp;
    }

    var parts = [];
    var creator = this._parseCreator(metadata.creator);
    var editor = this._parseEditor(metadata.editor);
    if ( creator.length ) {
      parts.push(_formatNames(creator));
    }
    if ( editor.length ) {
      parts.push(_formatNames(editor, editor.length > 1 ? ', eds' : ', ed'));
    }
    if ( metadata.title ) { parts.push("<em>" + metadata.title + "</em>" + "."); }
    if ( metadata.location ) {
      parts.push(metadata.location + ":");
    }
    if ( metadata.publisher ) {
      var part = metadata.publisher;
      if ( metadata.pubdate ) {
        var d = new Date(metadata.pubdate);
        part += `, ${d.getYear() + 1900}`;
      }
      parts.push(part + '.');
    }
    if ( metadata.doi ) {
      parts.push(metadata.doi + ".");
    }
    return parts.join(' ');
  },

  // possibly more magic than is good for the soul
  _parseCreator: function(creator) {
    var retval = [];
    if ( creator ) {
      if ( creator.constructor != Array ) {
        // make an array?
        creator = creator.split("; ");
      }
      for(var i in creator) {
        retval.push(parseFullName(creator[i]));
      }
    }
    return retval;
  },

  _parseEditor: function(editor) {
    var retval = [];
    if ( editor ) {
      if ( editor.constructor != Array ) {
        // make an array?
        editor = editor.split("; ");
      }
      for(var i in editor) {
        retval.push(parseFullName(editor[i]));
      }
    }
    return retval;
  },

  EOT: true
});

export var citation = function(options) {
  return new Citation(options);
}
