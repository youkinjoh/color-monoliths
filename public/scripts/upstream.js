var ws = null;
var id = null;
var color = null;
var dtm = new Date().getTime();

var pow = Math.pow;

var initialize = function() {
  var protocol = (location.protocol === 'https:') ? 'wss' : 'ws';
  var url = protocol + '://' + location.host + '/upstream';
  ws = new WebSocket(url);
  ws.addEventListener('open', function() {
  }, false);
  ws.addEventListener('message', function(data) {
    var json = JSON.parse(data.data);
    id = json.id;
    color = json.color;
    document.body.style.backgroundColor = "#" + color;
    initializeAcceleration();
  }, false);
};

var initializeAcceleration = function() {
  window.addEventListener('devicemotion', function(evt) {
    var gravity = evt.accelerationIncludingGravity;
    var x = gravity.x;
    var y = gravity.y;
    var z = gravity.z;
    var acc = pow(pow(x, 2) + pow(y, 2) + pow(z, 2), 1 / 2);
    var now = new Date().getTime();
    x /= acc;
    y /= acc;
    z /= acc;
    if (ws.readyState == 1 && ws.bufferedAmount == 0 && dtm + 30 < now) {
      dtm = now;
      ws.send(JSON.stringify({'x':x , 'y': y, 'z': z, 'color': color, 'id': id}));
    }
  }, false);
};

window.addEventListener('load', initialize, false);
