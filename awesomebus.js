'use strict';

/**
 * Utility function
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


function drawRoutes(features) {
  var bus = svg.append("g");

  bus.selectAll("path")
    .data(features)
    .enter()
      .append("path")
      .attr("d", geoPath)
      .attr("class", "route")
      // Set route color based on transit mode
      .style("stroke", function(feature) {
        var route = feature.properties.route;
        if (route === 'LINK') {
          return "#2b376c";  // Link Light Rail - blue
        } else if (route.startsWith('Stcr')) {
          return "#d67114";  // Seattle Streetcar - orange
        } else if (route.endsWith('Line')) {
          return "#cc0000";  // RapidRide - red
        } else {
          // Randomly assign colors for bus routes by hashing route number.
          var hash = (stringHash(route) % 0xFFFFFF).toString(16);
          var numPadding = 6 - hash.length;
          var padding = '';
          for (var i = 0; i < numPadding; i++) {
            padding += '0'
          }
          var color = '#' + padding + hash;
          // Darken the final color
          return d3.rgb(color).darker(Math.random() + 1).toString();
        }
       })
      // Set width of line based on transit mode
      .style("stroke-width", function(feature) {
        var route = feature.properties.route;
        if (route === 'LINK') {
          return 6;  // Link Light Rail
        } else if (route.startsWith('Stcr') || route.endsWith('Line')) {
          return 5;  // Streetcar and RapidRide
        } else  {
          return 3;  // Buses
        }
       });
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
/**
 * Render background map using static vector tiles from OpenStreetMap.
 * Source: http://bl.ocks.org/mbostock/5616813
 */
svg.selectAll("g")
    .data(tiler
      .scale(projection.scale() * 2 * Math.PI)
      .translate(projection([0, 0])))
  .enter().append("g")
    .each(function(d) {
      var g = d3.select(this);
      // Pick OpenStreetMap server shard
      var server = ["a", "b", "c"][(d[0] * 31 + d[1]) % 3];
      // Get street data
      d3.json("http://" + server + ".tile.openstreetmap.us/vectiles-highroad/" + d[2] + "/" + d[0] + "/" + d[1] + ".json", function(error, roads) {
        // Get water data
        d3.json("http://" + server + ".tile.openstreetmap.us/vectiles-water-areas/" + d[2] + "/" + d[0] + "/" + d[1] + ".json", function(error, water) {
          // Sort overlapping roads by the given rankings
          var sortedRoads = roads.features.sort(function(a, b) {
            return a.properties.sort_key - b.properties.sort_key;
          })
          // Merge road features with water features
          var allData = water.features.concat(sortedRoads);
          // Render features in SVG
          g.selectAll("path")
              .data(allData)
            .enter().append("path")
              .attr("class", function(d) { return d.properties.kind; })
              .attr("d", geoPath);
        });
      });
    });

/**
 * Pull in processed KC Metro GTFS data
 */
d3.json('data/routePathData.json', function(err, data) {
  // Convert data to GeoJSON format
  var features = [];
  for (var route in data) {
    var routeFeature = {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": data[route]
      },
      properties: {
        "route": route
      }
    };
    features.push(routeFeature);
  }
  drawRoute(features);
});
