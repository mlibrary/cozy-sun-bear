export function pdf(href, options) {
    if ( window.require !== undefined ) {
        window.pdf = require("pdf");
    }
    return window.pdf(href, options);
}
