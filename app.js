var express = require('express')
  , http = require('http')
  , path = require('path')
  , uuid = require("node-uuid")
  , WebSocketServer = require('ws').Server;

var app = express();

// all environments
app.set('port', process.env.PORT || 8192);
app.use(express.logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var server = http.createServer(app);
var upstreamServer = new WebSocketServer({
  'server': server,
  'path': '/upstream'
});
var downstreamServer = new WebSocketServer({
  'server': server,
  'path': '/downstream'
});

var downstreams = [];

upstreamServer.on('connection', function(ws) {
  ws.on('close', function() {
  });
  ws.on('message', function(message) {
    downstreams.forEach(function(conn) {
        try {
          conn.send(message);
        } catch(e) {
        }
    });
  });
  ws.send(JSON.stringify({'id': uuid.v4(), 'color': getColor()}));
});

downstreamServer.on('connection', function(ws) {
  downstreams.push(ws);
  ws.on('close', function() {
    downstreams.splice(downstreams.indexOf(ws), 1);
  });
});
/*
var getColor = function() {
  var color = 0;
  for (var i = 0; i < 3; i++) {
    color = color << 8;
    color += Math.floor(Math.random() * 0x80) + 0x80;
  }
  return ('000000' + color.toString(16)).slice(-6);
};
*/
var getColor = function() {
  var rnd = Math.random();
  var r, g, b;
  switch(true) {
  case rnd < 1 / 6 : b = 0x00; r = 0xff; g = 0xff *      (rnd - 0 / 6) * 6 ; break;// r:ff g:up b:00
  case rnd < 2 / 6 : g = 0xff; b = 0x00; r = 0xff * (1 - (rnd - 1 / 6) * 6); break;// r:dw g:ff b:00
  case rnd < 3 / 6 : r = 0x00; g = 0xff; b = 0xff *      (rnd - 2 / 6) * 6 ; break;// r:00 g:ff b:up
  case rnd < 4 / 6 : b = 0xff; r = 0x00; g = 0xff * (1 - (rnd - 3 / 6) * 6); break;// r:00 g:dw b:ff
  case rnd < 5 / 6 : g = 0x00; b = 0xff; r = 0xff *      (rnd - 4 / 6) * 6 ; break;// r:up g:00 b:ff
  case rnd < 6 / 6 : r = 0xff; g = 0x00; b = 0xff * (1 - (rnd - 5 / 6) * 6); break;// r:ff g:00 b:dw
  }
  var color = (Math.floor(r) << 16) + (Math.floor(g) << 8) + (Math.floor(b));
  return ('000000' + color.toString(16)).slice(-6);
};

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});
