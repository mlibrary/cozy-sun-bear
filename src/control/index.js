import {Control, control} from './Control';
import {PageNext, PagePrevious, pageNext, pagePrevious} from './Control.Paging';
import {Contents, contents} from './Control.Contents';
import {Title, title} from './Control.Title';
import {PublicationMetadata, publicationMetadata} from './Control.PublicationMetadata';
import {Preferences, preferences} from './Control.Preferences';

// import {Zoom, zoom} from './Control.Zoom';
// import {Attribution, attribution} from './Control.Attribution';

Control.PageNext = PageNext;
Control.PagePrevious = PagePrevious;
control.pagePrevious = pagePrevious;
control.pageNext = pageNext;

Control.Contents = Contents;
control.contents = contents;

Control.Title = Title;
control.title = title;

Control.PublicationMetadata = PublicationMetadata;
control.publicationMetadata = publicationMetadata;

Control.Preferences = Preferences;
control.preferences = preferences;

export {Control, control};
