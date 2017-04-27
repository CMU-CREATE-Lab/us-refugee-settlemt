var map;
var gl;
var refugees;
var mapMatrix = new Float32Array(16);
var pixelsToWebGLMatrix = new Float32Array(16);
var timeSlider;


var mapOptions = {
  zoom: 4,
  center: new google.maps.LatLng(39, -92),
  mapTypeId: google.maps.MapTypeId.ROADMAP,
  styles:/* [
    {
      stylers: [{saturation: -85}]
    }, {
      featureType: "water",
      elementType: "geometry",
      stylers: [
        { lightness: -20 }
      ]
    }
  ]*/
[
  {
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#212121"
      }
    ]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#757575"
      },
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#9e9e9e"
      }
    ]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#bdbdbd"
      }
    ]
  },
  {
    "featureType": "administrative.neighborhood",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#181818"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [
      {
        "color": "#1b1b1b"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [
      {
        "color": "#2c2c2c"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.icon",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#8a8a8a"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#373737"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#3c3c3c"
      }
    ]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#4e4e4e"
      }
    ]
  },
  {
    "featureType": "road.local",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#616161"
      }
    ]
  },
  {
    "featureType": "transit",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#757575"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [
      {
        "color": "#000000"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text",
    "stylers": [
      {
        "visibility": "off"
      }
    ]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [
      {
        "color": "#3d3d3d"
      }
    ]
  }
]  
};

var canvasLayerOptions = {
  resizeHandler: resize,
  animate: true,
  updateHandler: update
};

function update() {
  var mapProjection = map.getProjection();
  mapMatrix.set(pixelsToWebGLMatrix);
  var scale = canvasLayer.getMapScale();
  scaleMatrix(mapMatrix, scale, scale);
  var translation = canvasLayer.getMapTranslation();
  translateMatrix(mapMatrix, translation.x, translation.y);  

  var countryLevelZoom = 4;
  var countryPointSizePixels = 2;

  var blockLevelZoom = 10;
  var blockPointSizePixels = 20;

  var pointSize = countryPointSizePixels * Math.pow(blockPointSizePixels / countryPointSizePixels, (map.zoom - countryLevelZoom) / (blockLevelZoom - countryLevelZoom));

  if (refugees.showPerYear && refugees.ready['perYear']) {
    var epoch = timeSlider.getCurrentTime()/1000;
    refugees.drawPerYear(mapMatrix, {pointSize: pointSize, epoch: epoch});    
    timeSlider.animate();
  }
}

function resize() {
  console.log('resize');
  var w = gl.canvas.width;
  var h = gl.canvas.height;
  gl.viewport(0, 0, w, h);
  // matrix which maps pixel coordinates to WebGL coordinates
  pixelsToWebGLMatrix.set([2/w, 0,   0, 0,
    0,  -2/h, 0, 0,
    0,   0,   0, 0,
    -1,   1,   0, 1]);
}

function initTimeSlider() {
  var timeSlider = new TimeSlider({
    startTime: new Date("2002").getTime(),
    endTime: new Date("2016-12-01").getTime(),
    dwellAnimationTime: 3 * 1000,
    increment: 30*24*60*60*1000,
    formatCurrentTime: function(date) {
        var date = new Date(date);
        var year = date.getUTCFullYear();
        return year;
    },
    animationRate: {
      fast: 20,
      medium: 40,
      slow: 80
    }
  });  
  return timeSlider;
}

function init() {
  var mapDiv = document.getElementById('map-div');
  map = new google.maps.Map(mapDiv, mapOptions);

  canvasLayerOptions.map = map;
  canvasLayer = new CanvasLayer(canvasLayerOptions);

  timeSlider = initTimeSlider();

  // initialize WebGL
  gl = canvasLayer.canvas.getContext('experimental-webgl');
  gl.getExtension("OES_standard_derivatives");
  refugees = new Refugees(gl);
  refugees.showPerYear = true;

  getJSON('data/total_per_year.geojson', function(array) {
    refugees.setBuffer('perYear', array);    
  })

  var gui = new dat.GUI();
  gui.add(refugees, 'showPerYear');

}

function LonLatToPixelXY(lon,lat) {
  var x = (lon + 180.0) * 256.0 / 360.0
  var y = 128.0 - Math.log(Math.tan((lat + 90.0) * Math.PI / 360.0)) * 128.0 / Math.PI;
    return [x, y]
}

function propSort(props) {
  if (!props instanceof Array) props = props.split(",");
  return function sort(a, b) {
    var p;
    a = a.properties;
    b = b.properties;
    for (var i = 0; i < props.length; i++) {
      p = props[i];
      if (typeof a[p] === "undefined") return -1;
      if (a[p] < b[p]) return -1;
      if (a[p] > b[p]) return 1;
    }
    return 0;
  };
}

function getBin(url, callback) {
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.open('get', url, true);
    xhr.onload = function () {

      var float32Array = new Float32Array(this.response);
      callback(float32Array);
    };
    xhr.send();
}

var epochs = [];
for (var i = 2002; i < 2018; i++) {
  epochs[i-2002] = new Date(i.toString()).getTime()/1000.0;
}
function getJSON(url, callback) {
    const xhr = new XMLHttpRequest();
    xhr.responseType = 'json';
    xhr.open('get', url, true);
    xhr.onload = function () {
        if (xhr.status >= 200 && xhr.status < 300) {
            //callback(xhr.response);
            //console.log(xhr.response);
            var features = xhr.response.features;
            var points = [];
            //points look like x,y,epoch_1,val_1,epoch_2,val_2
            for (var i = 0; i < features.length; i++) {
              var geo = features[i]['geometry'];
              var totals = features[i]['properties']['totals'];              
              var xy = LonLatToPixelXY(geo['coordinates'][0], geo['coordinates'][1]);
              for (var ii = 0; ii < totals.length - 1; ii++) {
                points.push(xy[0]);
                points.push(xy[1]);
                points.push(epochs[ii]);
                points.push(totals[ii]);
                points.push(epochs[ii+1]);
                points.push(totals[ii+1]);
              }
              points.push(xy[0]);
              points.push(xy[1]);
              points.push(epochs[ii]);
              points.push(totals[ii]);
              points.push(epochs[ii+1]);
              points.push(totals[ii]);
            }
            //console.log(points);
           callback(new Float32Array(points));

        } else {
            throw new Error(xhr.statusText);
        }
    };
    xhr.send();
}


function scaleMatrix(matrix, scaleX, scaleY) {
  matrix[0] *= scaleX;
  matrix[1] *= scaleX;
  matrix[2] *= scaleX;
  matrix[3] *= scaleX;
  matrix[4] *= scaleY;
  matrix[5] *= scaleY;
  matrix[6] *= scaleY;
  matrix[7] *= scaleY;
}

function translateMatrix(matrix, tx, ty) {
  matrix[12] += matrix[0]*tx + matrix[4]*ty;
  matrix[13] += matrix[1]*tx + matrix[5]*ty;
  matrix[14] += matrix[2]*tx + matrix[6]*ty;
  matrix[15] += matrix[3]*tx + matrix[7]*ty;
}
document.addEventListener('DOMContentLoaded', init, false);
window.addEventListener('resize', function () {  google.maps.event.trigger(map, 'resize') }, false);

