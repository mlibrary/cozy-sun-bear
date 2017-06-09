var connect = require('connect');
var express = require('express');
var http = require('http');
var fs = require('fs');
var serveStatic = require('serve-static');
var morgan  = require('morgan');
var colors = require('colors');
var	argv = require('optimist').argv;
var	portfinder = require('portfinder');
var path = require('path');
var logger, port;
var log = console.log;
var proxy = require('express-http-proxy');

function start(_port) {
 if (!_port) {
    portfinder.basePort = 8080;
    portfinder.getPort(function (err, openPort) {
      if (err) throw err;
      port = openPort
      listen(port);
    });
  } else {
    listen(_port);
  }
}

//CORS middleware
function allowCrossDomain(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    next();
}


function listen(port) {

  var app = express();
  var staticServer = serveStatic(path.resolve(__dirname, '../'), {'index': ['index.html', 'index.htm']})
  var appPath = path.resolve(__dirname + '/../');
  var indexPaths = [];
  indexPaths.push(path.resolve(appPath, 'books/epub3-samples'));
  indexPaths.push(path.resolve(appPath, 'books/epub3-local'));
  // var indexPathInfo = '/books/epub3-samples';

  var server = http.createServer(app);

  app.use(allowCrossDomain);

  if ( process.env.USE_DEV_EPUB ) {
    var epubJsPath = path.resolve(process.env.USE_DEV_EPUB);
    app.get('/vendor/javascripts/engines/epub.js', function(req, res) {
      res.sendFile(epubJsPath + '/epub.js');
    });
    app.get('/vendor/javascripts/engines/epub.js.map', function(req, res) {
      res.sendFile(epubJsPath + '/epub.js.map');
    });
  }

  app.get('/examples/books.json', function(req, res) {
    var books = [];
    var queue = indexPaths.slice(0);
    while ( queue.length ) {
      var thisPath = queue.shift();
      var items = fs.readdirSync(thisPath);
      for(var i in items) {
        if ( items[i][0] == '.' ) { continue; }
        var fullPath = path.resolve(thisPath, items[i]);
        var stat = fs.statSync(fullPath);
        if ( stat.isDirectory() ) {
          if ( fs.existsSync(path.resolve(fullPath, "mimetype")) ) {
            // actual book
            var indexPathInfo = fullPath.replace(appPath, '');
            books.push(indexPathInfo + "/");
          } else {
            queue.push(fullPath);
          }
        }
      }
    }
    res.send(books);
  })
  app.use('/common', proxy('https://babel.hathitrust.org/common', { 
    https: true,
    forwardPath: function(req) {
      return '/common' + require('url').parse(req.url).path;
    }
  }));
  app.use(staticServer);

  if(!logger) app.use(morgan('dev'))

  server.listen(port, '127.0.0.1');

  log('Starting up Server, serving '.yellow
    + __dirname.replace("tools", '').green
    + ' on port: '.yellow
    + port.toString().cyan);
  log('Hit CTRL-C to stop the server');

}

process.on('SIGINT', function () {
  log('Server stopped.'.red);
  process.exit();
});

module.exports = start;
