'use strict';

/*****************************************************************************/
/*******     DATA       ******************************************************/
/*****************************************************************************/
var routes = [];  // All route data. To be populated by routePathData.json
var selectedRoutes = []; //  Subset of routeData that is currently selected.
var currentlySelectedRoutes = [] // errr .. how exactly is this different from selectedRoutes? can we merge these?
var routeIntersections = {}


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

// Pull in route intersection data
d3.json('data/intersections.json', function (err, data) {
  if (err) 
    return console.warn(err);
  // This data needs to have the same shape as the route data, even though this is just route numbers.
  // I didn't include coordinates in the data (which would go into the LineString portion, as above),
  // so just omit that. The important part is that it have the shape feature.properties.route = route number.
  for (var route in data) {
    var routeFeature = {
      "type": "Feature",
      properties: {
        "route": route
      }
    };
    // inside loop to make arr of intersecting routes for this one particular route
    var intersectingRoutes = []
    for (var i = 0; i < data[route].length; i++) {

      var intersectingRouteFeature = {
        "type": "Feature",
        properties: {
          "route": data[route][i].properties.route
        }        
      };
      intersectingRoutes.push(intersectingRouteFeature);
      console.log("route: " + data[route][i]);
    }
    routeIntersections[route] = intersectingRoutes;
  }
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
    .on("click", resetRoutes)
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
              .on("click", resetRoutes)
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
      padding += '0'    }
    var color = '#' + padding + hash;
    // Darken the final color
    return d3.rgb(color).darker(1).toString();
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
      .on("dblclick", onRouteDoubleClicked)
      // Set route color based on transit mode
      .style("stroke", getColor)
      // Set width of line based on transit mode
      .style("stroke-width", getRouteWidth)
 }

function moveSelectedRouteToTop(route) {
  // TODO: optimize this. This is slow because we loop through 218 routes every
  // time routes are selected, or something is typed.
  d3.selectAll('.route')
    .sort(function(a, b) {
      if (a.properties.route != route) {
        return -1;
      } else {
        return 1;
      }
    });
}

function setSelectedRoute(route) {

  var updatedRoutes = d3.select('#selected-text').html();
  // check to see if route is already selected.
  var updatedRoutesList = updatedRoutes.split(", ");
  for (var i = 0; i < updatedRoutesList.length; i++) {
    if (route == updatedRoutesList[i])
      return;
  }

  if (updatedRoutes == '') {
    updatedRoutes = route;
  }
  else {
    updatedRoutes += ", " + route
  }
  d3.select('#selected-text').html(updatedRoutes);
  d3.select('#selected-route').style('visibility', 'visible');

  currentlySelectedRoutes.push(route);

}

function unsetSelectedRoute() {
  d3.select('#selected-route').style('visibility', 'hidden');
  d3.select('#selected-text').html('');
  currentlySelectedRoutes = [];

}

function resetRoutes() {
  d3.selectAll(".route")
    .sort(d3.ascending)          // Reset z-ordering
    .style('stroke', getColor)   // Reset colors
    .style("stroke-opacity", 1)  // Reset opacity
    .style("stroke-width", getRouteWidth);  // Reset width

  unsetSelectedRoute();
  document.getElementById('route-input').value = '';
}

/*****************************************************************************/
/*******     EVENT HANDERS        ********************************************/
/*****************************************************************************/
function onRouteClicked(feature) {
  //console.log("selecting route: " + feature.properties.route);
  setSelectedRoute(feature.properties.route);
  //for (var i = 0; i < currentlySelectedRoutes.length; i++)
  //{
  //  console.log("  currently selected route: " + currentlySelectedRoutes[i]);
  //}
  // Set opacity of every other route to .25
  // Also set opacity of self to 1, in case another route was previously selected
  var self = this;
  var newOpacity = .25;
  // others
  d3.selectAll(".route")
    .filter(function (feature) {
      // Check through the list of currently selected routes
      // if this route is on the list, do NOT filter
      for (var i = 0; i < currentlySelectedRoutes.length; i++) {
        if (currentlySelectedRoutes[i] == feature.properties.route) {
          return false;
        }
      }
      return true;
    })
    .style("stroke-opacity", newOpacity)
    .style("stroke-width", getRouteWidth)
    .style('stroke', '#6E91B9');
  // self
  d3.selectAll(".route")
    .filter(function (feature) {

      for (var i = 0; i < currentlySelectedRoutes.length; i++) {
        if (currentlySelectedRoutes[i] == feature.properties.route) {
          return true;
        }
      }
      return false;
    })
    .style("stroke-opacity", 1)
    .style("stroke-width", 6)
    .style('stroke', getColor); 
    
  moveSelectedRouteToTop(feature.properties.route);
}

function onRouteDoubleClicked(feature) {
  var intersectingRoutes = routeIntersections[feature.properties.route];
  for (var i = 0; i < intersectingRoutes.length; i++)
  {
    var intersectingRoute = intersectingRoutes[i];
    onRouteClicked(intersectingRoute);
  }
}


d3.select('#route-input').on('input', function() {
  if (this.value == '') {
    resetRoutes();
    return;
  }

  // Restyle other routes
  d3.selectAll('.route')
    .filter(function(feature) { return feature.properties.route !== this.value }.bind(this))
    .style("stroke-opacity", 0.25)
    .style("stroke-width", getRouteWidth)
    .style('stroke', '#6E91B9');

  // Restyle input routes
  d3.selectAll('.route')
    .filter(function(feature) { return feature.properties.route === this.value }.bind(this))
    .style("stroke-opacity", 1)
    .style("stroke-width", 6)
    .style('stroke', getColor);

  unsetSelectedRoute();
  moveSelectedRouteToTop(this.value);
});

d3.select('#reset').on('click', resetRoutes);

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
