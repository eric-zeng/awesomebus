var xhr = require('xhr');

function getRouteShapes(routeNum, callback) {
  xhr.get({
    url: 'http://localhost:5000/shapes?route=' + routeNum
  }, callback);
}

let width = window.innerWidth;
let height = window.innerHeight;

var tiler = d3.geo.tile()
    .size([width, height]);

var projection = d3.geo.mercator()
    .center([-122.3321, 47.6362])
    .scale((1 << 21) / 2 / Math.PI)
    .translate([width / 2, height / 2]);


var svg = d3.select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

var geoPath = d3.geo.path()
    .projection(projection);

svg.selectAll("g")
    .data(tiler
      .scale(projection.scale() * 2 * Math.PI)
      .translate(projection([0, 0])))
  .enter().append("g")
    .each(function(d) {
      var g = d3.select(this);
      d3.json("http://" + ["a", "b", "c"][(d[0] * 31 + d[1]) % 3] + ".tile.openstreetmap.us/vectiles-highroad/" + d[2] + "/" + d[0] + "/" + d[1] + ".json", function(error, json) {
        g.selectAll("path")
            .data(json.features.sort(function(a, b) { return a.properties.sort_key - b.properties.sort_key; }))
          .enter().append("path")
            .attr("class", function(d) { return d.properties.kind; })
            .attr("d", geoPath);
      });
    });


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

// d3.json("static/city-limits.json", function(json){
//   /*console.log(json);*/
//   svg.selectAll("path") // selects path elements, will make them if they don't exist
//        .data(json.features) // iterates over geo feature
//        .enter() // adds feature if it doesn't exist as an element
//        .append("path") // defines element as a path
//        .attr( "fill", "#ccc" )
//        .attr("d", geoPath) // path generator translates geo data to SVG
// });


drawAllRoutes();
