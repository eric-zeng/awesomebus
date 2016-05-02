'use strict';

/*****************************************************************************/
/*******     DATA       ******************************************************/
/*****************************************************************************/
var routes = [];  // All route data. To be populated by routePathData.json
var selectedRoutes = []; //  Subset of routeData that is currently selected.

//Global var to keep track of whether something is selected:
var selected = false;

// Pull in processed KC Metro GTFS data
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
  // Set global variables
  routes = features;
  selectedRoutes = features;
  render();
});

/*****************************************************************************/
/*******     MAP RENDERING        ********************************************/
/*****************************************************************************/
// Setup SVG where map will be rendered
let width = window.innerWidth;
let height = window.innerHeight;
var svg = d3.select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

// Set up underlying map projection, representation
var tiler = d3.geo.tile()
    .size([width, height]);

var projection = d3.geo.mercator()
    .center([-122.3321, 47.6362])
    .scale((1 << 21) / 2 / Math.PI)
    .translate([width / 2, height / 2]);

var geoPath = d3.geo.path()
    .projection(projection);

// Render background map using static vector tiles from OpenStreetMap.
// Source: http://bl.ocks.org/mbostock/5616813
svg.selectAll("g")
    .data(tiler
      .scale(projection.scale() * 2 * Math.PI)
      .translate(projection([0, 0])))
  .enter().append("g")
    .on("click", onMapClicked)
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
              .on("click", onMapClicked)
              .attr("class", function(d) { return d.properties.kind; })
              .attr("d", geoPath);
        });
      });
    });

/*****************************************************************************/
/*******     ROUTE RENDERING        ******************************************/
/*****************************************************************************/
function getColor(feature)
{
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
}

function getRouteWidth(feature) {
  var route = feature.properties.route;
  if (route === 'LINK') {
    return 6;  // Link Light Rail
  } else if (route.startsWith('Stcr') || route.endsWith('Line')) {
    return 5;  // Streetcar and RapidRide
  } else  {
    return 3;  // Buses
  }
}

function render() {
  var bus = svg.append("g");
  bus.selectAll("path")
    .data(selectedRoutes)
    .enter()
      .append("path")
      .attr("d", geoPath)
      .attr("class", "route")
      .on("click", onRouteClicked)
      // Set route color based on transit mode
      .style("stroke", getColor)
      // Set width of line based on transit mode
      .style("stroke-width", getRouteWidth)
 }

function onRouteClicked(params) {
  // Set opacity of every other route to .25
  // Also set opacity of self to 1, in case another route was previously selected
  var self = this;
  var newOpacity = .25;
  // others
  d3.selectAll(".route")
    .filter(function (z) {return self != this;})
    .style("stroke-opacity", newOpacity)
    .style("stroke-width", getRouteWidth)
    .style('stroke', 'gray');
  // self
  d3.select(this)
    .style("stroke-opacity", 1)
    .style("stroke-width", 6)
    .style('stroke', getColor);
}

function onMapClicked(params) {
  // Reset opacity of everything to 1 (normal)
  // Reset colors to what they were
  d3.selectAll(".route")
    .style('stroke', getColor)
    .style("stroke-opacity", 1)
    .style("stroke-width", getRouteWidth);
}

/**
 * Utility function for randomizing colors
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
