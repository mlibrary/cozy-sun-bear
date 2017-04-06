# cozy sun bear

ePub widgets and support based around and with code from [epub.js](https://github.com/futurepress/epub.js)

## Development

### Initial Setup

* clone the repository
* You have node installed (maybe with [nodenv](https://github.com/wfarr/nodenv))
* `npm install`
* `npm run build`

Some of the examples use the IDPF epub3-samples examples; these are expected to 
be checked out in same directory containing `cozy-sun-bear`:

```bash
# Start in your cozy-sun-bear directory...
$ cd ..
# ./cozy-sun-bear/books/epub3-samples links to ./epub3-samples so clone it...
$ git clone https://github.com/IDPF/epub3-samples.git
# ./cozy-sun-bear/books/epub3-local links to ./epub3-local so create it...
$ mkdir epub3-local
$ cd cozy-sun-bear
```

#### To run the examples

* `./tools/serve`
* Point your browser to http://0.0.0.0:8080/examples
* When you make changes to /src, re-run `npm run build` to build your changes
* ...or you can run `npm run watch` to have npm watch for changes to the javascript
