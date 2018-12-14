import EventEmitter from "event-emitter";

import {
  ElementObserver,
  PositionObserver,
  ObserverCollection // Advanced: Used for grouping custom viewport handling
} from "viewprt";

import {inVp} from '../../../core/Util';
window.inVp = inVp;

class Views {
    constructor(container) {
        this.container = container;
        this._views = [];
        this.length = 0;
        this.hidden = false;
    }

    all() {
        return this._views;
    }

    first() {
        // return this._views[0];
        return this.displayed()[0];
    }

    last() {
        var d = this.displayed();
        return d[d.length - 1];
        // return this._views[this._views.length-1];
    }

    indexOf(view) {
        return this._views.indexOf(view);
    }

    slice() {
        return this._views.slice.apply(this._views, arguments);
    }

    get(i) {
        return this._views[i];
    }

    append(view){
        this._views.push(view);
        if(this.container){
        this.container.appendChild(view.element);
            view.observer = ElementObserver(view.element, {
                container: this.container,
                onEnter: this.onEnter.bind(this, view), // callback when the element enters the viewport
                onExit: this.onExit.bind(this, view), // callback when the element exits the viewport
                offset: 0, // offset from the edges of the viewport in pixels
                once: false, // if true, observer is detroyed after first callback is triggered
                observerCollection: new ObserverCollection() // Advanced: Used for grouping custom viewport handling
            })
            const { fully, partially, edges } = inVp(view.element, this.container);
            if ( edges.percentage > 0 ) {
                this.onEnter(view);
            }
        }
        this.length++;
        return view;
    }

    prepend(view){
        this._views.unshift(view);
        if(this.container){
            this.container.insertBefore(view.element, this.container.firstChild);
        }
        this.length++;
        return view;
    }

    // insert(view, index) {
    //     this._views.splice(index, 0, view);

    //     if(this.container){
    //         if(index < this.container.children.length){
    //             this.container.insertBefore(view.element, this.container.children[index]);
    //         } else {
    //             this.container.appendChild(view.element);
    //         }
    //     }

    //     this.length++;
    //     return view;
    // }

    // remove(view) {
    //     var index = this._views.indexOf(view);

    //     if(index > -1) {
    //         this._views.splice(index, 1);
    //     }


    //     this.destroy(view);

    //     this.length--;
    // }

    destroy(view) {
        // if(view.displayed){
        //     view.destroy();
        // }
        view.destroy();

        if(this.container){
             this.container.removeChild(view.element);
        }
        view = null;
    }

    // Iterators

    forEach() {
        // return this._views.forEach.apply(this._views, arguments);
        return this.displayed().forEach.apply(this._views, arguments);
    }

    clear(){
        // Remove all views
        var view;
        var len = this.length;

        if(!this.length) return;

        for (var i = 0; i < len; i++) {
            view = this._views[i];
            this.destroy(view);
        }

        this._views = [];
        this.length = 0;
    }

    updateLayout(options) {
        var width = options.width;
        var height = options.height;
        this._views.forEach(function(view) {
            view.size(width, height);
            if ( view.contents ) {
                view.contents.size(width, height);
            }
        })
    }

    find(section){

        var view;
        var len = this.length;

        for (var i = 0; i < len; i++) {
            view = this._views[i];
            // view.displayed
            if(view.section.index == section.index) {
                return view;
            }
        }

    }

    displayed(){
        var displayed = [];
        var view;
        var len = this.length;

        for (var i = 0; i < len; i++) {
            view = this._views[i];
            const { fully, partially, edges } = inVp(view.element, this.container);
            if ( ( fully || partially ) && edges.percentage > 0 && view.displayed ) {
                displayed.push(view);
            }
            // if(view.displayed){
            //     displayed.push(view);
            // }
        }
        return displayed;
    }

    show(){
        var view;
        var len = this.length;

        for (var i = 0; i < len; i++) {
            view = this._views[i];
            if(view.displayed){
                view.show();
            }
        }
        this.hidden = false;
    }

    hide(){
        var view;
        var len = this.length;

        for (var i = 0; i < len; i++) {
            view = this._views[i];
            if(view.displayed){
                view.hide();
            }
        }
        this.hidden = true;
    }

    onEnter(view, el, viewportState) {
        // console.log("AHOY VIEWS ONENTER", view, viewportState);
        if ( ! view.displayed ) {
            // console.log("AHOY SHOULD BE SHOWING", view);
            this.emit("view.display", { view: view, viewportState: viewportState });
        }
    }

    onExit(view, el, viewportState) {
        // console.log("AHOY VIEWS ONEXIT", view, viewportState);
        view.unload();
    }
}

EventEmitter(Views.prototype);
export default Views;
