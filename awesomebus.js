'use strict';

/**
 * http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
 */
function stringHash(str) {
  var hash = 0, i, chr, len;
  if (str.length === 0) return hash;
  for (i = 0, len = str.length; i < len; i++) {
    chr   = str.charCodeAt(i);
    hash  = ((hash << 5) - hash) + chr;
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}


function drawRoute(route, coords) {
  var geoJSONroute = {
    "type": "LineString",
    "coordinates" : coords
  }

  var bus = svg.append("g");

  bus.selectAll("path")
    .data([geoJSONroute])
    .enter()
    .append("path")
    .attr("class", "route")
    // Set route color based on transit mode
    .style("stroke", function(d) {
      if (route === 'LINK') {
        return "#2b376c";
      } else if (route.startsWith('Stcr')) {
        return "#d67114";
      } else if (route.endsWith('Line')) {
        return "#cc0000";
      } else {
        // Generate color by hashing route number
        var hash = (stringHash(route) % 0xFFFFFF).toString(16);
        var numPadding = 6 - hash.length;

        var padding = '';
        for (var i = 0; i < numPadding; i++) {
          padding += '0'
        }
        var color = '#' + padding + hash;

        return d3.rgb(color).darker(Math.random() + 1).toString();
      }
     })
    // Set route width based on transit mode
    .style("stroke-width", function(d) {
      if (route === 'LINK') {
        return 6;
      } else if (route.startsWith('Stcr') || route.endsWith('Line')) {
        return 5;
      } else  {
        return 3;
      }
     })
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

d3.json('data/routePathData.json', function(err, data) {
  for (var route in data) {
    drawRoute(route, data[route]);
  }
});
