'use strict';
/*****************************************************************************/
/*******     MAP RENDERING        ********************************************/
/*****************************************************************************/
// Setup SVG where map will be rendered
let width = window.innerWidth - 290;
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

map.doubleClickZoom.disable();

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

// Master update function. Call whenever route or stop selections are updated.
function update() {
  updateRoutes();
  updateStops();
  updateSidebar();
}

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


function findRoutesInPolygon(polygon) {
  //polygon is an array of points
  // Search for routes with the same coordinates
  var intersectingRoutes = []
  for (var i = 0; i < routes.length; i++) {
    var geometry = routes[i].geometry.coordinates;
    for (var j = 0; j < geometry.length; j++) {
      var coords = [parseFloat(geometry[j][0]), parseFloat(geometry[j][1])];
      if (pointInPolygon(coords, polygon)) {
        if (routes[i].properties.route) {
          intersectingRoutes.push(routes[i].properties.route);
        }
        // We found at least one coord in the box; don't need to look through the rest.
        break;
      }
    }
  }

  selectedRoutes = intersectingRoutes;
  update();
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
  if (overlay.childNodes[1].classList[0] != 'd3-pane') {
    overlay.insertBefore(overlay.childNodes[1], overlay.childNodes[0]);
  }
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
function updateTimeFilter() {
  visibleRoutes = [];
  for (var i in routes) {
    if (isRouteWithinTimes(routes[i])) {
      visibleRoutes.push(routes[i].properties.route);
    }
  }
  update();
}

$("#slider-range").slider({
  range: true,
  min: 0,
  max: 2400,
  values: [ 800, 2200 ],
  step: 50,

  stop: function( event, ui ) {
    currentSliderValues = ui.values;
    updateTimeFilter();
  }
}).slider('pips', {
    first: 'label',
    last: 'label',
    rest: 'label',
    step: 6,
    labels: ['12am', '3am', '6am', '9am', '12pm', '3pm', '6pm', '9pm', '12am'],
    prefix: "",
    suffix: ""
});


function isRouteWithinTimes(feature) {

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

var selectedRoutes = [];
var selectedStop = undefined;
var visibleRoutes = [];

var rectXY_0 = [0, 0];
var rectXY_1 = [0, 0];
var currentSliderValues = [0, 2400];

// Returns whether the route feature is in the selectedRoutes array.
function isSelected(feature) {
  return selectedRoutes.indexOf(feature.properties.route) != -1;
}

// Returns whether the route features in the visibleRoutes array,
// which indicates whether the route runs in the times specified by the lister
function isVisible(feature) {
  return visibleRoutes.indexOf(feature.properties.route) != -1;
}

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
    visibleRoutes.push(route);
  }

  svgRoutes = renderRoutes();
  resetSVGBounds();
});

// Pull in route intersection data
d3.json('data/allIntersections.json', function (err, data) {
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
          "route": data[route][i]
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
      .on("click", onRouteClicked)
      .on("dblclick", onRouteDoubleClicked)
      .on("mouseover", onRouteMousedOver)
      .on("mouseout", onRouteMouseOut)
      .style("stroke", getRouteColor)
      .style("stroke-width", getRouteWidth)
      .style('stroke-opacity', getRouteOpacity)
}

function updateRoutes() {
  d3.selectAll(".route")
    .style("stroke-opacity", getRouteOpacity)
    .style("stroke-width", getRouteWidth)
    .style('stroke', getRouteColor);
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

function getRouteColor(feature) {
  if ((selectedRoutes.length != 0 && !isSelected(feature)) || !isVisible(feature)) {
    return '#6E91B9';
  }
  return routeNumToColor(feature.properties.route);
}

function routeNumToColor(route) {
  if (route === 'LINK') {
    return "#2b376c";  // Link Light Rail - blue
  } else if (route.startsWith('Stcr')) {
    return "#d67114";  // Seattle Streetcar - orange
  } else if (route.endsWith('Line')) {
    return "#cc0000";  // RapidRide - red
  }
  var index = routes.findIndex(function(feature) {
    return feature.properties.route == route;
  });
  var colorIndex = index % colors.length
  return d3.rgb(colors[colorIndex]).darker(.25).toString();;
}

function getRouteWidth(feature) {
  if (isSelected(feature) && isVisible(feature)) {
    return map.getZoom() / 2;
  }

  var zoomFactor = map.getZoom() / 4;
  var route = feature.properties.route;
  if (route === 'LINK') {
    return zoomFactor * 1.5;  // Link Light Rail
  } else if (route.startsWith('Stcr') || route.endsWith('Line')) {
    return zoomFactor * 1.2;  // Streetcar and RapidRide
  } else  {
    return zoomFactor * 0.7;  // Buses
  }
}

function getRouteOpacity(feature) {
  if (isSelected(feature) && isVisible(feature)) {
    return 1;
  } else if (selectedRoutes.length == 0) {
    if (feature.properties.route == 'LINK' ||
        feature.properties.route.startsWith('Stcr')) {
      return 0.8
    } else {
      return 0.5;
    }
  } else {
    return 0.25;
  }
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

function resetRoutes() {
  document.getElementById('route-input').value = '';
  selectedRoutes = [];
  selectedStop = undefined;
  update();
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
      .on('click', onStopClicked)
      .style('visibility', map.getZoom() < 14 ? 'hidden' : 'visible')
      .style('fill', getStopColor)
      .style('fill-opacity', getStopOpacity)
      .on('mouseover', onStopMousedOver)
      .on('mouseout', onStopMouseOut);
}

function getStopColor(feature) {
  if (selectedStop == feature) {
    return '#2bdf14';
  } else {
    return '#306929';
  }
}

function getStopOpacity(feature) {
  if (selectedStop == feature) {
    return 1;
  } else if (!selectedStop) {
    return 0.8;
  } else {
    return 0.6;
  }
}

function updateStops() {
  // Update radius of stop circles based on zoom levels
  geoPath.pointRadius(function(feature) {
    if (feature == selectedStop) {
      return map.getZoom() - 9;
    } else {
      return map.getZoom() - 11;
    }
  });

  // Update stops based on selection, zoom
  d3.selectAll('.stop')
    .attr('d', geoPath)
    .style('fill', getStopColor)
    .style('fill-opacity', getStopOpacity)
    .style('visibility', map.getZoom() < 14 ? 'hidden' : 'visible');

}

function onStopClicked(feature) {
  selectedStop = feature;
  selectedRoutes = feature.properties.routes;
  update();
}

function onStopMousedOver(feature) {
  // prettify list of routes.
  var routes = "";
  var numRoutesInThisLine = 0;
  for (var r in feature.properties.routes) {
    routes += feature.properties.routes[r];
    if (r != feature.properties.routes.length - 1) {
      routes += ", "
    }
  }
  divTooltip.transition()
    .duration(200)
    .style("opacity", .95);
  divTooltip.html(routes)
    .style("left", (d3.event.pageX) + "px")
    .style("top", (d3.event.pageY - 28) + "px");
}

function onStopMouseOut(feature) {
  hideToolTip();
}

/*****************************************************************************/
/*******     SIDEBAR              ********************************************/
/*****************************************************************************/
function oneBusAwayUrl(feature) {
  return 'http://pugetsound.onebusaway.org/where/standard/stop.action?id=1_' +
          feature.properties.id;
}

function updateSidebar() {
  var selectedAndVisibleRoutes = [];
  for (var i in selectedRoutes) {
    if (visibleRoutes.indexOf(selectedRoutes[i]) != -1) {
       selectedAndVisibleRoutes.push(selectedRoutes[i]);
    }
  }
  // Display selected routes in the sidebar
  var routeLinks = d3.select('#selected-routes').selectAll('span')
    .data(selectedAndVisibleRoutes);

  routeLinks.enter()
    .append('span')
      .attr('class', 'route-link')
      .append('a')
        .attr('target', '_blank')
        .style('color', routeNumToColor)

  routeLinks.select('a')
    .attr('href', function(route) { return makeRouteURL(route) })
    .text(function(route) { return route });

  routeLinks.exit()
    .remove();

  // Show stop information if selected
  if (selectedStop) {
    d3.select('#stop-info').style('visibility', 'visible');
    d3.select('#stop-header').text(selectedStop.properties.name);
    d3.select('#oba').attr('href', oneBusAwayUrl(selectedStop));
  } else {
    d3.select('#stop-info').style('visibility', 'hidden');
  }
}

// Sidebar input box
d3.select('#route-input').on('input', function() {
  if (this.value == '') {
    resetRoutes();
    return;
  }

  var isRoute = routes.find(function(feature) {
      return feature.properties.route == this.value;
  }.bind(this));

  if (!isRoute) {
    return;
  }

  selectedRoutes = [this.value];
  update();
  moveSelectedRouteToTop(this.value);
});

// Sidebar reset button
d3.select('#reset').on('click', resetRoutes);

/*****************************************************************************/
/*******     EVENT HANDERS        ********************************************/
/*****************************************************************************/

function onRouteClicked(feature) {
  var route = feature.properties.route;
  var index = selectedRoutes.indexOf(feature.properties.route);
  if (index == -1) {
    selectedRoutes.push(route);
  } else {
    selectedRoutes.splice(index, 1);
  }
  update();
}

function onRouteDoubleClicked(feature) {
  if (!isSelected(feature)) {
    selectedRoutes.push(feature.properties.route);
  }

  var intersectingRoutes = routeIntersections[feature.properties.route];
  if (intersectingRoutes) {
    intersectingRoutes.forEach(function(intersectingFeature) {
      if (!isSelected(intersectingFeature)) {
        selectedRoutes.push(intersectingFeature.properties.route);
      }
    });
  }
  update();
}

map.on('zoomend', update);

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
  if (isSelected(feature)) {
    // bring route to top
    moveSelectedRouteToTop(feature.properties.route);
    // show a tooltip with the route name
    divTooltip.transition()
      .duration(200)
      .style("opacity", .95);
    divTooltip.html(feature.properties.route)
      .style("left", (d3.event.pageX) + "px")
      .style("top", (d3.event.pageY - 28) + "px");
 }
}

function hideToolTip() {
  divTooltip.transition()
    .duration(500)
    .style("opacity", 0);
}
function onRouteMouseOut(d) {
  hideToolTip();

}
