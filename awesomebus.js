'use strict';

function drawRoute(coords) {
  var geoJSONroute = {
    "type": "LineString",
    "coordinates" : coords
  }

  var bus = svg.append("g");

  bus.selectAll("path")
    .data([geoJSONroute])
    .enter()
    .append("path")
    .attr("class", "path")
    .attr("d", geoPath);
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
      var server = ["a", "b", "c"][(d[0] * 31 + d[1]) % 3];
      d3.json("http://" + server + ".tile.openstreetmap.us/vectiles-highroad/" + d[2] + "/" + d[0] + "/" + d[1] + ".json", function(error, roads) {
        d3.json("http://" + server + ".tile.openstreetmap.us/vectiles-water-areas/" + d[2] + "/" + d[0] + "/" + d[1] + ".json", function(error, water) {
          var sortedRoads = roads.features.sort(function(a, b) {
            return a.properties.sort_key - b.properties.sort_key;
          })
          var allData = water.features.concat(sortedRoads);
          g.selectAll("path")
              .data(allData)
            .enter().append("path")
              .attr("class", function(d) { return d.properties.kind; })
              .attr("d", geoPath);
        });
      });
    });

d3.json('routePathData.json', function(err, data) {
  for (var route in data) {
    drawRoute(data[route]);
  }
});
