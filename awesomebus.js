var d3 = require('d3');
var xhr = require('xhr');

function getRouteShapes(routeNum, callback) {
  xhr.get({
    url: 'http://localhost:5000/shapes?route=' + routeNum
  }, callback);
}

let width = 1024
let height = 768

var svg = d3.select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

var g = svg.append( "g" );

var albersProjection = d3.geo.albers()
  .scale(150000)
  .rotate([122.3321, 0])
  .center([0, 47.6062])
  .translate([1024 / 2, height / 2]);

var geoPath = d3.geo.path()
    .projection(albersProjection);

function drawAllRoutes() {
  xhr.get({
    url: 'http://localhost:5000/allRoutes'
  }, function (err, response, body) 
  {
    var routes = JSON.parse(body);
    for (i = 0; i < routes.length; i++)
    {
      getRouteShapes(routes[i], function(err, response, body) {
        drawRoute(body, '#900')
      });
    }
  })
  
}


function drawRoute(body, fill) {
  let data = JSON.parse(body);

  let geoJSON = data.map((point) => {
    return {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": point
      },
      "properties": {}
    }
  });
  /*console.log(geoJSON);*/

  var buspoints = svg.append('g');

  buspoints.selectAll('path')
    .data(geoJSON)
    .enter()
      .append('path')
      .attr('fill', fill)
      .attr('stroke', '#999')
      .attr('d', geoPath);
}

/* END FUNCTION DEFINITION SECTION */

d3.json("static/city-limits.json", function(json){
  /*console.log(json);*/
  svg.selectAll("path") // selects path elements, will make them if they don't exist
       .data(json.features) // iterates over geo feature
       .enter() // adds feature if it doesn't exist as an element
       .append("path") // defines element as a path
       .attr( "fill", "#ccc" )
       .attr("d", geoPath) // path generator translates geo data to SVG
});


drawAllRoutes();
