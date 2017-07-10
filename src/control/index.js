import {Control, control} from './Control';
import {PageNext, PagePrevious, pageNext, pagePrevious, PageFirst, pageFirst, PageLast, pageLast} from './Control.Paging';
import {Contents, contents} from './Control.Contents';
import {Title, title} from './Control.Title';
import {PublicationMetadata, publicationMetadata} from './Control.PublicationMetadata';
import {Preferences, preferences} from './Control.Preferences';
import {Widget, widget} from './Control.Widget';
import {Citation, citation} from './Control.Citation';
import {CitationOptions, citationOptions} from './Control.CitationOptions';
import {Download, download} from './Control.Download';

// import {Zoom, zoom} from './Control.Zoom';
// import {Attribution, attribution} from './Control.Attribution';

Control.PageNext = PageNext;
Control.PagePrevious = PagePrevious;
Control.PageFirst = PageFirst;
Control.PageLast = PageLast;
control.pagePrevious = pagePrevious;
control.pageNext = pageNext;
control.pageFirst = pageFirst;
control.pageLast = pageLast;

Control.Contents = Contents;
control.contents = contents;

Control.Title = Title;
control.title = title;

Control.PublicationMetadata = PublicationMetadata;
control.publicationMetadata = publicationMetadata;

Control.Preferences = Preferences;
control.preferences = preferences;

Control.Widget = Widget;
control.widget = widget;

Control.Citation = Citation;
control.citation = citation;

Control.CitationOptions = CitationOptions;
control.citationOptions = citationOptions;

Control.Download = Download;
control.download = download;

export {Control, control};
