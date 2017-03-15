import {Control, control} from './Control';
import {PageNext, PagePrevious, pageNext, pagePrevious} from './Control.Paging';
import {Contents, contents} from './Control.Contents';

// import {Zoom, zoom} from './Control.Zoom';
// import {Attribution, attribution} from './Control.Attribution';

Control.PageNext = PageNext;
Control.PagePrevious = PagePrevious;
control.pagePrevious = pagePrevious;
control.pageNext = pageNext;

Control.Contents = Contents;
control.contents = contents;

export {Control, control};
