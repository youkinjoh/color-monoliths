var meshes = {};
var scene = null;

var pow = Math.pow;

var initialize = function() {
  initializeDraw();
  initializeWebSocket();
};

var initializeDraw = function() {

  var renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(640, 640);
  renderer.setClearColorHex(0x000000, 1);
  document.body.appendChild(renderer.domElement);

  scene = new THREE.Scene();

  var camera = new THREE.PerspectiveCamera(15, 500 / 500);
  camera.position = new THREE.Vector3(0, 0, 30);
  camera.lookAt(new THREE.Vector3(0, 0, 0));
  scene.add(camera);

  var light1 = new THREE.DirectionalLight(0xffffff);
  light1.position = new THREE.Vector3(0.577, 0.577, 0.577);
  var light2 = new THREE.DirectionalLight(0x666666);
  light2.position = new THREE.Vector3(-0.577, -0.577, 0.577);
  var ambient = new THREE.AmbientLight(0x333333);
  scene.add(light1);
  scene.add(light2);
  scene.add(ambient);

  var baseTime = new Date();
  function render() {
    requestAnimationFrame(render);
    Object.keys(meshes).forEach(function(id) {
      if (meshes[id].dtm + 1000 < new Date().getTime()) {
        scene.remove(meshes[id]);
        meshes[id] = null;
        delete meshes[id];
      }
    });
    var ids = Object.keys(meshes);
    var gridX = 1;
    var gridY = 1;
    while(true) {
      if (gridX * gridY >= ids.length) {
        break;
      }
      if (gridX > gridY) {
        gridY++;
      } else {
        gridX++;
      }
    }
    var scale = 1 / Math.max(gridX, gridY) * 0.75;
    var areaSize = 3.6;
    var areaSizeX = areaSize / gridX;
    var areaSizeY = areaSize / gridY;
    for (var y = 0; y < gridY; y++) {
      for (var x = 0; x < gridX; x++) {
         var mesh = meshes[ids[y * gridX + x]];
         if (!mesh) {break;}
         mesh.scale.x = mesh.scale.y = mesh.scale.z = scale;
         mesh.position.x = -areaSizeX * (gridX - 1) + areaSizeX * x * 2;
         mesh.position.y = -(-areaSizeY * (gridY - 1) + areaSizeY * y * 2);
      }
    }
    renderer.render(scene, camera);
  };
  render();

};

var initializeWebSocket = function() {
  var protocol = (location.protocol === 'https:') ? 'wss' : 'ws';
  var url = protocol + '://' + location.host + '/downstream';
  var ws = new WebSocket(url);
  ws.addEventListener('message', function(data) {
    receiveMessage(JSON.parse(data.data));
  }, false);
};

var receiveMessage = function(data) {
  var messageType = data.message_type;
  var id = data.id;
  var color = parseInt(data.color, 16);
  var x = data.x;
  var y = data.y;
  var z = data.z;
  var mesh = null;
  if (!(id in meshes)) {
    var geometry = new THREE.CubeGeometry(4, 9, 1);
    var material = new THREE.MeshPhongMaterial({
      'color': color, 'specular': color, 'shininess':100, 'ambient': color,
      'side': THREE.DoubleSide, 'opacity': 1
    });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    meshes[id] = mesh;
  } else {
    mesh = meshes[id];
  }
  mesh.dtm = new Date().getTime();
  mesh.rotation.x = Math.atan2(pow(pow(x, 2) + pow(z, 2), 1/2), y) * (z < 0 ? 1 : -1);
};

window.addEventListener('load', initialize, false);
