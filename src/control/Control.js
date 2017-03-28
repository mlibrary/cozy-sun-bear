import {Class} from '../core/Class';
import {Reader} from '../reader/Reader';
import * as Util from '../core/Util';
import * as DomUtil from '../dom/DomUtil';

/*
 * @class Control
 * @aka L.Control
 * @inherits Class
 *
 * L.Control is a base class for implementing reader controls. Handles regioning.
 * All other controls extend from this class.
 */

export var Control = Class.extend({
    // @section
    // @aka Control options
    options: {
        // @option region: String = 'topright'
        // The region of the control (one of the reader corners). Possible values are `'topleft'`,
        // `'topright'`, `'bottomleft'` or `'bottomright'`
        region: 'header'
    },

    initialize: function (options) {
        Util.setOptions(this, options);
    },

    /* @section
     * Classes extending L.Control will inherit the following methods:
     *
     * @method getRegion: string
     * Returns the region of the control.
     */
    getRegion: function () {
        return this.options.region;
    },

    // @method setRegion(region: string): this
    // Sets the region of the control.
    setRegion: function (region) {
        var reader = this._reader;

        if (reader) {
            reader.removeControl(this);
        }

        this.options.region = region;

        if (reader) {
            reader.addControl(this);
        }

        return this;
    },

    // @method getContainer: HTMLElement
    // Returns the HTMLElement that contains the control.
    getContainer: function () {
        return this._container;
    },

    // @method addTo(reader: Map): this
    // Adds the control to the given reader.
    addTo: function (reader) {
        this.remove();
        this._reader = reader;

        var container = this._container = this.onAdd(reader),
            region = this.getRegion(),
            area = reader.getControlRegion(region);

        DomUtil.addClass(container, 'cozy-control');

        if (region.indexOf('bottom') !== -1) {
            area.insertBefore(container, area.firstChild);
        } else {
            area.appendChild(container);
        }

        return this;
    },

    // @method remove: this
    // Removes the control from the reader it is currently active on.
    remove: function () {
        if (!this._reader) {
            return this;
        }

        DomUtil.remove(this._container);

        if (this.onRemove) {
            this.onRemove(this._reader);
        }

        this._reader = null;

        return this;
    },

    _refocusOnMap: function (e) {
        // if reader exists and event is not a keyboard event
        if (this._reader && e && e.screenX > 0 && e.screenY > 0) {
            this._reader.getContainer().focus();
        }
    }
});

export var control = function (options) {
    return new Control(options);
};

/* @section Extension methods
 * @uninheritable
 *
 * Every control should extend from `L.Control` and (re-)implement the following methods.
 *
 * @method onAdd(reader: Map): HTMLElement
 * Should return the container DOM element for the control and add listeners on relevant reader events. Called on [`control.addTo(reader)`](#control-addTo).
 *
 * @method onRemove(reader: Map)
 * Optional method. Should contain all clean up code that removes the listeners previously added in [`onAdd`](#control-onadd). Called on [`control.remove()`](#control-remove).
 */

/* @namespace Map
 * @section Methods for Layers and Controls
 */
Reader.include({
    // @method addControl(control: Control): this
    // Adds the given control to the reader
    addControl: function (control) {
        control.addTo(this);
        return this;
    },

    // @method removeControl(control: Control): this
    // Removes the given control from the reader
    removeControl: function (control) {
        control.remove();
        return this;
    },

    getControlContainer: function() {
        var l = 'cozy-';
        if ( ! this._controlContainer ) {
            this._controlContainer =
                DomUtil.create('div', l + 'control-container', this._container);
        }
        return this._controlContainer;
    },

    getControlRegion: function (target) {

        var tmp = target.split('.');
        var region = tmp.shift();
        var slot = tmp.pop() || '-slot';

        var container = this._panes[region];
        if ( ! this._panes[target] ) {
            var className = 'cozy-' + region + '--item cozy-slot-' + slot
            if ( ! this._panes[region + '.' + slot] ) {
                var div = DomUtil.create('div', className);
                if ( slot == 'left' || slot == 'bottom' ) {
                    var childElement = this._panes[region].firstChild;
                    this._panes[region].insertBefore(div, childElement);
                } else {
                    this._panes[region].appendChild(div);
                }
                this._panes[region + '.' + slot] = div;
            }
            className = this._classify(tmp);
            this._panes[target] = DomUtil.create('div', className, this._panes[region + '.' + slot]);
        }

        return this._panes[target];


        // var l = 'cozy-';

        // function createRegion(spec) {
        //     if ( regions[region] ) { return regions[region]; }
        //     var className = [];
        //     var tmp = region.split(".");
        //     for(var i in tmp) {
        //         className.push(l + tmp[i]);
        //     }
        //     className = className.join(' ');

        //     regions[region] = DomUtil.create('div', className, container);
        //     return regions[region];
        // }

        // return createRegion(region);
    },

    _classify: function(tmp) {
        var l = 'cozy-';
        var className = [];
        for(var i in tmp) {
            className.push(l + tmp[i]);
        }
        className = className.join(' ');
        return className;
    },

    _clearControlRegion: function () {
        for (var i in this._controlRegions) {
            DomUtil.remove(this._controlRegions[i]);
        }
        DomUtil.remove(this._controlContainer);
        delete this._controlRegions;
        delete this._controlContainer;
    }
});
