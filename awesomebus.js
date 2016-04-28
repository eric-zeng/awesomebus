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

d3.json("static/city-limits.json", function(json){
  console.log(json);
  svg.selectAll("path") // selects path elements, will make them if they don't exist
       .data(json.features) // iterates over geo feature
       .enter() // adds feature if it doesn't exist as an element
       .append("path") // defines element as a path
       .attr( "fill", "#ccc" )
       .attr("d", geoPath) // path generator translates geo data to SVG
});

getRouteShapes(48, function(err, response, body) {
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
  console.log(geoJSON);

  var buspoints = svg.append('g');

  buspoints.selectAll('path')
    .data(geoJSON)
    .enter()
      .append('path')
      .attr('fill', '#900')
      .attr('stroke', '#999')
      .attr('d', geoPath);
});
