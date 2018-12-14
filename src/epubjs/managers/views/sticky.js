import IframeView from "epubjs/src/managers/views/iframe";
import { EVENTS } from "epubjs/src/utils/constants";

import {extend, borders, uuid, isNumber, bounds, defer, createBlobUrl, revokeBlobUrl} from "epubjs/src/utils/core";

import {
  ElementObserver,
  PositionObserver,
  ObserverCollection // Advanced: Used for grouping custom viewport handling
} from "viewprt";

class StickyIframeView extends IframeView {
    constructor(section, options) {
        super(section, options);

        this.element.style.height = `${this.layout.height}px`;
        this.element.style.width = `${this.layout.width}px`;
    }

    container(axis) {
        var check = document.querySelector(`div[ref='${this.index}']`);
        if ( check ) {
            check.dataset.reused = 'true';
            return check;
        }

        var element = document.createElement("div");

        element.classList.add("epub-view");

        // this.element.style.minHeight = "100px";
        element.style.height = "0px";
        element.style.width = "0px";
        element.style.overflow = "hidden";
        element.style.position = "relative";
        element.style.display = "block";

        if(axis && axis == "horizontal"){
            element.style.flex = "none";
        } else {
            element.style.flex = "initial";
        }

        return element;
    }

    create() {

        if(this.iframe) {
            return this.iframe;
        }

        if(!this.element) {
            this.element = this.createContainer();
        }

        if ( this.element.hasAttribute('layout-height') ) {
            var height = parseInt(this.element.getAttribute('layout-height'), 10);
            this._layout_height = height;
        }

        this.iframe = this.element.querySelector("iframe");
        if ( this.iframe ) {
            return this.iframe;
        }

        this.iframe = document.createElement("iframe");
        this.iframe.id = this.id;
        this.iframe.scrolling = "no"; // Might need to be removed: breaks ios width calculations
        this.iframe.style.overflow = "hidden";
        this.iframe.seamless = "seamless";
        // Back up if seamless isn't supported
        this.iframe.style.border = "none";

        this.iframe.setAttribute("enable-annotation", "true");

        this.resizing = true;

        // this.iframe.style.display = "none";
        this.element.style.visibility = "hidden";
        this.iframe.style.visibility = "hidden";

        this.iframe.style.width = "0";
        this.iframe.style.height = "0";
        this._width = 0;
        this._height = 0;

        this.element.setAttribute("ref", this.index);
        this.element.setAttribute("data-href", this.section.href);

        // this.element.appendChild(this.iframe);
        this.added = true;

        this.elementBounds = bounds(this.element);

        // if(width || height){
        //   this.resize(width, height);
        // } else if(this.width && this.height){
        //   this.resize(this.width, this.height);
        // } else {
        //   this.iframeBounds = bounds(this.iframe);
        // }


        if(("srcdoc" in this.iframe)) {
            this.supportsSrcdoc = true;
        } else {
            this.supportsSrcdoc = false;
        }

        if (!this.settings.method) {
            this.settings.method = this.supportsSrcdoc ? "srcdoc" : "write";
        }

        return this.iframe;
    }

    reframe(width, height) {
        var size;

        var minHeight = this.settings.minHeight || 0;

        if(isNumber(width)){
            this.element.style.width = width + "px";
            if ( this.iframe ) {
                this.iframe.style.width = width + "px";
            }
            this._width = width;
        }

        // this.element.style.width = '80%';
        // this.iframe.style.width = '100%';

        if(isNumber(height)){
            height = height > minHeight ? height : minHeight;
            var styles = window.getComputedStyle(this.element);
            this.element.style.height = ( height + parseInt(styles.paddingTop) + parseInt(styles.paddingBottom) ) + "px";
            if ( this.iframe ) {
                this.iframe.style.height = height + "px";
            }
            // console.log("AHOY REFRAME", this.index, this.element.style.height, this.iframe && this.iframe.style.height);
            this._height = height;
        }

        let widthDelta = this.prevBounds ? width - this.prevBounds.width : width;
        let heightDelta = this.prevBounds ? height - this.prevBounds.height : height;

        size = {
            width: width,
            height: height,
            widthDelta: widthDelta,
            heightDelta: heightDelta,
        };

        this.pane && this.pane.render();

        requestAnimationFrame(() => {
            let mark;
            for (let m in this.marks) {
                if (this.marks.hasOwnProperty(m)) {
                    mark = this.marks[m];
                    this.placeMark(mark.element, mark.range);
                }
            }
        });

        this.onResize(this, size);

        this.emit(EVENTS.VIEWS.RESIZED, size);

        this.prevBounds = size;

        this.elementBounds = bounds(this.element);

    }

    display(request) {
        var displayed = new defer();

        if (!this.displayed) {

            this.render(request)
                .then(function () {

                    this.emit(EVENTS.VIEWS.DISPLAYED, this);
                    this.onDisplayed(this);

                    this.displayed = true;
                    displayed.resolve(this);

                }.bind(this), function (err) {
                    displayed.reject(err, this);
                });

        } else {
            displayed.resolve(this);
        }


        return displayed.promise;
    }

    unload() {

        for (let cfiRange in this.highlights) {
            this.unhighlight(cfiRange);
        }

        for (let cfiRange in this.underlines) {
            this.ununderline(cfiRange);
        }

        for (let cfiRange in this.marks) {
            this.unmark(cfiRange);
        }

        if (this.pane) {
            this.element.removeChild(this.pane.element);
            this.pane = undefined;
        }

        if (this.blobUrl) {
            revokeBlobUrl(this.blobUrl);
        }

        if(this.displayed){
            this.displayed = false;

            this.removeListeners();

            this.stopExpanding = true;
            this.element.removeChild(this.iframe);

            this.iframe = undefined;
            this.contents = undefined;

            // this._textWidth = null;
            // this._textHeight = null;
            // this._width = null;
            // this._height = null;
        }

        // this.element.style.height = "0px";
        // this.element.style.width = "0px";
    }

}

export default StickyIframeView;

