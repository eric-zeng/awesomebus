'use strict';
/*****************************************************************************/
/*******     MAP RENDERING        ********************************************/
/*****************************************************************************/
// Setup SVG where map will be rendered
let width = window.innerWidth - 280;
let height = window.innerHeight;

// Intialize map div
var mapElement = d3.select('body')
  .append('div')
  .attr('id', 'map')
  .style('width', width + 'px')
  .style('height', height + 'px');

// Initialize MapBox
L.mapbox.accessToken = 'pk.eyJ1IjoiZXJpYy16ZW5nIiwiYSI6ImNpb3ZyZngxYTAxZGF1MG00N3VlNmllcWgifQ.c8Wd_V-zL2osmIPKcyCfDA';
var map = L.mapbox.map('map', 'mapbox.streets')
  .setView([47.63, -122.33], 12);

// Initialize SVG for drawing routes
var svg = d3.select(map.getPanes().overlayPane).append('svg').attr('class', 'd3-pane');
var routeLayer = svg.append("g").attr('class', 'leaflet-zoom-hide');
var stopLayer = svg.append('g').attr('class', 'leaflet-zoom-hide');

// Implement projection from coordinates to latitude-longitude points on the SVG
function projectPoint(lng, lat) {
  var point = map.latLngToLayerPoint(new L.LatLng(lat, lng));
  this.stream.point(point.x, point.y);
}
var leafletProjection = d3.geo.transform({point: projectPoint});
// Implement inverted projection from x,y points to latitude-longitude
leafletProjection.invert = function(point) {
  var coords = map.layerPointToLatLng(point);
  return [coords.lng, coords.lat];
}

// Set up d3 with projection
var geoPath = d3.geo.path().projection(leafletProjection);

// Resets the SVG bounds when the map layer position/zoom changes
function resetSVGBounds() {
  var bounds = geoPath.bounds({'type': 'FeatureCollection', 'features': routes});
  var topLeft = bounds[0];
  var bottomRight = bounds[1];

  svg.attr("width", bottomRight[0] - topLeft[0])
     .attr("height", bottomRight[1] - topLeft[1])
     .style("left", topLeft[0] + "px")
     .style("top", topLeft[1] + "px");

  routeLayer.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
  stopLayer.attr("transform", "translate(" + -topLeft[0] + "," + -topLeft[1] + ")");
  if (svgRoutes) {
    svgRoutes.attr('d', geoPath);
  }
  if (svgStops) {
    svgStops.attr('d', geoPath);
  }
}
map.on("viewreset", resetSVGBounds);

/*****************************************************************************/
/*******     POLYGON SELECTION       *****************************************/
/*****************************************************************************/
// This function is opied directly from https://github.com/substack/point-in-polygon/blob/master/index.js
function pointInPolygon (point, vs) {
  // ray-casting algorithm based on
  // http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html

  var x = point[0], y = point[1];

  var inside = false;
  for (var i = 0, j = vs.length - 1; i < vs.length; j = i++) {
      var xi = vs[i][0], yi = vs[i][1];
      var xj = vs[j][0], yj = vs[j][1];

      var intersect = ((yi > y) != (yj > y))
          && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
  }

  return inside;
};


function findRoutesInPolygon (polygon) {
  //polygon is an array of points
  // Search for routes with the same coordinates
  var intersectingRoutes = []
  for (var i = 0; i < routes.length; i++) {
    var geometry = routes[i].geometry.coordinates;
    for (var j = 0; j < geometry.length; j++) {
      var coords = [parseFloat(geometry[j][0]), parseFloat(geometry[j][1])];
      if (pointInPolygon(coords, polygon)) {
        intersectingRoutes.push(routes[i]);
        // We found at least one coord in the box; don't need to look through the rest.
        break;
      }
    }
  }

  d3.selectAll(".route")
    .filter(function(feature) {
      for (var i = 0; i < intersectingRoutes.length; i++) {
        if (feature.properties.route == intersectingRoutes[i].properties.route) {
          return true;
        }
      }
      return false;
    })
    .classed("selected", true)
    .classed("visible", isRouteWithinTimes)
    .classed("unselected", false);
  displayRoutes();
}

// polygon intersact code from http://bl.ocks.org/bycoffe/5575904 (modified)
// and https://www.mapbox.com/mapbox.js/example/v1.0.0/show-polygon-area/
var featureGroup = L.featureGroup().addTo(map);

var drawControl = new L.Control.Draw({
  edit: {
    featureGroup: featureGroup
  },
  draw: {
    polygon: true,
    polyline: false,
    rectangle: true,
    circle: false,
    marker: false
  }
}).addTo(map);

map.on('draw:created', function(e) {
  showIntersectingRoutes(e);

  // Swap the leaflet-draw SVG and the SVG used by d3 so that d3 is on top
  var overlay = document.getElementsByClassName('leaflet-overlay-pane')[0];
  overlay.insertBefore(overlay.childNodes[1], overlay.childNodes[0]);
});

// remove stupid toolbar since we're not using the edit/delete buttons
var div = document.getElementsByClassName('leaflet-draw-toolbar')[1];
if (div)
  div.parentNode.removeChild(div)


function showIntersectingRoutes(e) {
  var points = [];
  for (var i = 0; i < e.layer._latlngs.length; i++) {
    var coords = [e.layer._latlngs[i].lng, e.layer._latlngs[i].lat];
    points.push(coords);
  }
  findRoutesInPolygon(points);
}

/*****************************************************************************/
/*******     SLIDER STUFF        *********************************************/
/*****************************************************************************/
// Taken (sort of) from https://github.com/MasterMaps/d3-slider
d3.select('#slider')
  .call(d3.slider()
    .axis(true).min(0).max(2400).step(25)
    .value( [ 0, 2400 ] )
    .on("slideend", function(evt, value) {
      // Convert values to time strings & update current slider values
      // I'm sure there's a better way to do this.
      var start_mm = (value[0] % 100) * .6;
      var end_mm = (value[1] % 100) * .6;
      start_mm = start_mm.toString();
      if (start_mm.length == 1)
        start_mm += "0";
      end_mm = end_mm.toString();
      if (end_mm.length == 1)
        end_mm += "0";

      var start_hh = Math.floor(value[0] / 100);
      var end_hh = Math.floor(value[1] / 100);
      currentSliderValues = [start_hh.toString() + start_mm.toString(),
        end_hh.toString() + end_mm.toString()];
      d3.selectAll(".route")
        .classed("visible", isRouteWithinTimes);

      displayRoutes();
}));

function isRouteWithinTimes(feature) {
  debug_count += 1

  for (var t = 0; t < feature.properties.times.length; t++) {
    var times = feature.properties.times[t];
    // If one end of a time block is between the sliders, return true
    if (parseInt(times[0]) < currentSliderValues[1] && parseInt(times[0]) > currentSliderValues[0]) {
      return true;
    }
    if (parseInt(times[1]) < currentSliderValues[1] && parseInt(times[1]) > currentSliderValues[0]) {
      return true;
    }
    // If the time block start is before the slider start AND the time block
    // end is after the slider end, return true
    if (parseInt(times[0]) <= currentSliderValues[0] && parseInt(times[1]) >= currentSliderValues[1]) {
      return true;
    }
  }
  return false;
}

/*****************************************************************************/
/*******     DATA       ******************************************************/
/*****************************************************************************/
// Data to be populated from JSON files
var routes = [];
var stops = [];
var routeIntersections = {};
var busTimes = {};

// SVG representation of the data
var svgRoutes;
var svgStops;

var rectXY_0 = [0, 0];
var rectXY_1 = [0, 0];
var currentSliderValues = [0, 2400];
var debug_count = 0;

// Define the div for the tooltip
var divTooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Pull in route time data
d3.json('data/busTimesData.json', function(err, data) {
  for (var route in data) {
    busTimes[route] = data[route]
  }
});

// Pull in processed KC Metro GTFS data
d3.json('data/routePathData.json', function(err, data) {
  // Convert data to GeoJSON format
  for (var route in data) {
    var routeFeature = {
      "type": "Feature",
      "geometry": {
        "type": "LineString",
        "coordinates": data[route]
      },
      properties: {
        "route": route,
        "times": busTimes[route]
      }
    };
    routes.push(routeFeature);
  }

  svgRoutes = renderRoutes();
  resetSVGBounds();
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
    }
    routeIntersections[route] = intersectingRoutes;
  }

});

d3.json('data/stopData.geojson', function(err, data) {
  if (err) {
    console.error(err);
    return;
  }
  stops = data;
  svgStops = renderStops();
  resetSVGBounds();
});

/*****************************************************************************/
/*******     ROUTE RENDERING        ******************************************/
/*****************************************************************************/

function renderRoutes() {
  return routeLayer.selectAll("path")
    .data(routes)
    .enter()
      .append("path")
      .attr("d", geoPath)
      .attr("class", "route")
      .classed("unselected", true)
      .classed("selected", false)
      .classed("visible", true)
      .on("click", onRouteClicked)
      .on("dblclick", onRouteDoubleClicked)
      .on("mouseover", onRouteMousedOver)
      .on("mouseout", onRouteMouseOut)
      // Set route color based on transit mode
      .style("stroke", getColor)
      // Set width of line based on transit mode
      .style("stroke-width", getRouteWidth)
}

// color palette taken from http://jnnnnn.blogspot.com.au/2015/10/selecting-different-colours-for.html
// (slightly modified to get rid of the grays)
// This isn't perfect because there are still some collisions.. but it is better.
var colors = [
  "#015eff", "#0cc402", "#fc0a18", "#ff15ae", "#d99f07", "#11a5fe", "#037e43",
  "#ba4455", "#d10aff", "#9354a6", "#7b6d2b", "#08bbbb", "#95b42d", "#b54e04",
  "#ee74ff", "#2d7593", "#e19772", "#fa7fbe", "#fe035b", "#aea0db", "#905e76",
  "#92b27a", "#03c262", "#878aff", "#4a7662", "#ff6757", "#fe8504", "#9340e1",
  "#2a8602", "#07b6e5", "#d21170", "#526ab3", "#ff08e2", "#bb2ea7", "#e4919f",
  "#09bf91", "#90624c", "#a26c05", "#5c7605", "#df89e7", "#b0487c", "#ee9345",
  "#70b458", "#ec5206", "#ff678c", "#b55b3e", "#8054cc", "#c480b3", "#d9102d",
  "#5a783f", "#fe66d2", "#bc13c8", "#62bd33", "#8f31ff", "#fd8581", "#049279",
  "#0e6ad6", "#747151", "#01878d", "#0380bf", "#bf81fd", "#8ba1fb", "#887a02",
  "#d04096", "#a583da", "#8ca149", "#b16368", "#c23e37", "#fd7b40", "#d12153",
  "#b24cd2", "#56a66f", "#5dafbd", "#78aceb", "#2375fe", "#d49f54", "#ea41d3",
  "#885e92", "#8468fd", "#cf4eff", "#c93716", "#c563af", "#d66886", "#664dfd",
  "#468530", "#6d60be", "#fa8a64", "#059843", "#ff55a1", "#638b8e", "#ff0f7a",
  "#3f93ff", "#ff5167", "#d68201"
];

function getColor(feature) {
  if (feature.properties.route === 'LINK') {
    return "#2b376c";  // Link Light Rail - blue
  } else if (feature.properties.route.startsWith('Stcr')) {
    return "#d67114";  // Seattle Streetcar - orange
  } else if (feature.properties.route.endsWith('Line')) {
    return "#cc0000";  // RapidRide - red
  }
  var index = routes.indexOf(feature);
  var colorIndex = index % colors.length
  return d3.rgb(colors[colorIndex]).darker(.25).toString();;
}

function getRouteWidth(feature) {
  var zoomFactor = map.getZoom() / 4;
  var route = feature.properties.route;
  if (route === 'LINK') {
    return zoomFactor * 1.5;  // Link Light Rail
  } else if (route.startsWith('Stcr') || route.endsWith('Line')) {
    return zoomFactor * 1;  // Streetcar and RapidRide
  } else  {
    return zoomFactor * 0.7;  // Buses
  }
}

function getSelectedRouteWidth(feature) {
  return map.getZoom() / 2;
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

function makeTextboxRouteText() {
  var routeHref = "";
  var routeText = "";
  d3.selectAll(".route.selected").filter(".visible")
    .filter( function(feature) {
      var routeHref = '<a href="' + makeRouteURL(feature.properties.route)
     + '">' + feature.properties.route + '</a> ';
     if (routeText == '') {
      routeText = routeHref;
    }
    else {
      routeText += ", " + routeHref
    }
    });
  // filter is not the right thing to use... but it works.
  return routeText;
}

function unsetSelectedRoutes() {
  d3.select('#selected-route').style('visibility', 'hidden');
  d3.select('#selected-text').html('');
  d3.selectAll(".route.selected")
    .classed("unselected", true)
    .classed("selected", false)
    .classed("visible", false);

}

function resetRoutes() {
  d3.selectAll(".route")
    //.sort(d3.ascending)          // Reset z-ordering
    .classed("selected", false)
    .classed("unselected", true)
    .classed("visible", false)
    .style('stroke', getColor)   // Reset colors
    .style("stroke-opacity", 1)  // Reset opacity
    .style("stroke-width", getRouteWidth);  // Reset width

  unsetSelectedRoutes();
  document.getElementById('route-input').value = '';
}


/*****************************************************************************/
/*******     STOP RENDERING       ********************************************/
/*****************************************************************************/
function renderStops() {
  return stopLayer.selectAll('path')
    .data(stops)
    .enter()
      .append('path')
      .attr('d', geoPath)
      .attr('class', 'stop')
      .style('visibility', map.getZoom() < 14 ? 'hidden' : 'visible')
}


/*****************************************************************************/
/*******     EVENT HANDERS        ********************************************/
/*****************************************************************************/
function selectRoute(feature) {
    moveSelectedRouteToTop(feature.properties.route);
}

function displayRoutes() {
  d3.selectAll(".route")
    .style("stroke-opacity", .25)
    .style("stroke-width", getRouteWidth)
    .style('stroke', '#6E91B9');

  d3.selectAll(".route.selected").filter(".visible")
    .style("stroke-width", 6)
    .style("stroke-opacity", 1)
    .style('stroke', getColor);

  d3.select('#selected-text').html(makeTextboxRouteText());
  d3.select('#selected-route').style('visibility', 'visible');
}

function onRouteClicked(feature) {
  d3.select(this)
    .classed("selected", !d3.select(this).classed("selected"))
    .classed("visible", isRouteWithinTimes)
    .classed("unselected", !d3.select(this).classed("unselected"));
  displayRoutes();
}
function onRouteDoubleClicked(feature) {
  var intersectingRoutes = routeIntersections[feature.properties.route];
  d3.selectAll(".route")
    .filter(function(feature) {
      for (var i = 0; i < intersectingRoutes.length; i++) {
        if (feature.properties.route == intersectingRoutes[i].properties.route) {
          return true;
        }
      }
      return false;
    })
    .classed("selected", true)
    .classed("visible", isRouteWithinTimes)
    .classed("unselected", false);
  displayRoutes();
}

map.on('zoomend', function() {
  // Resize the width of the routes based on the new zoom level
  d3.selectAll('.route')
    .style('stroke-width', getRouteWidth)
  d3.selectAll('.selected')
    .style('stroke-width', getSelectedRouteWidth)

  // Hide stops if zoomed far out
  if (map.getZoom() < 14) {
    d3.selectAll('.stop').style('visibility', 'hidden');
  } else {
    d3.selectAll('.stop').style('visibility', 'visible')
  }
});

// Make stops invisible when zooming so that they don't stay in their old
// positions as the map changes.
map.on('zoomstart', function() {
  d3.selectAll('.stop').style('visibility', 'hidden');
})

function makeRouteURL(route) {
  var routenum = route.toString();
  if (routenum.length == 1) {
    routenum = "00" + routenum;
  }
  else if (routenum.length == 2) {
    routenum = "0" + routenum;
  }
  // a line, c line, etc
  else if (routenum.indexOf(" ") != -1) {
    routenum = routenum.replace(" ", "-");
  }
  else if (routenum == "LINK") {
    return "http://www.soundtransit.org/schedules/light-rail/link-light-rail/weekday/outbound"
  }
  var link = "http://kingcounty.gov/depts/transportation/metro/schedules-maps/";
  var extension = ".aspx";

  return link + routenum + extension;
}
function onRouteMousedOver(feature) {
  var self = this;
  d3.selectAll(".route.selected").filter(".visible")
    .filter(function(feature) {return this==self})
    .filter(function(feature) {
        var routeHref = '<a href="' + makeRouteURL(feature.properties.route) + '">' + feature.properties.route + '</a> ';

        // show a tooltip with the route name
          divTooltip.transition()
            .duration(200)
            .style("opacity", .95);
          divTooltip.html(feature.properties.route)
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
  });
}


function hideToolTip() {
  divTooltip.transition()
    .duration(500)
    .style("opacity", 0);
}
function onRouteMouseOut(d) {
  // TODO - set actual delay and make this link actually do a thinggggggg
  window.setTimeout(hideToolTip, 0);

}

/*****************************************************************************/
/*******     END EVENT HANDERS        ****************************************/
/*****************************************************************************/

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
    .style("stroke-width", getSelectedRouteWidth)
    .style('stroke', getColor);

  unsetSelectedRoutes();
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
