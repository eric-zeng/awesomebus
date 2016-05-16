// precompute all the intersections for each bus route and store in intersections.json

var fs = require('fs');
var d3 = require('d3'),
  http = require('http');
var gju = require('geojson-utils');
var routeData = require('/Users/lucy/Desktop/datavis/a3/a3-lucysimko-eric-zeng/data/routePathData.json');

var routesWithCoords = [];
var routesNoCoords = []
var intersections = {};


// UL: 47.675464, -122.435742
// UR: 47.668591, -122.247118
// LL: 47.598978, -122.424198
// LR: 47.599812, -122.241676

// Lat range: 47.598978 - 47.675464
// Long range: -122.424198 - -122.241676
var lowLat = 47.598978;
var highLat = 47.675464
var lowLong = -122.424198;
var highLong = -122.241676;


// Convert data to GeoJSON format
var features = [];
for (var route in routeData) {
  // Check that all coordinates are in-bounds
  var coordsInBounds = [];
  for (var c = 0; c < routeData[route].length; c++)
  {
    var coordinates = routeData[route][c]
    var long = coordinates[0];
    var lat = coordinates[1];
    //.log(long);
    if (long < highLong 
      && long > lowLong
      && lat < highLat
      && lat > lowLat)
    {
      coordsInBounds.push(coordinates);
    }
  }

  if (coordsInBounds.length == 0)
  {
    console.log("route not on map: " + route);
    continue;
  }

  console.log("route on map:  " + route);
  var routeCoordsFeature = {
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": coordsInBounds//routeData[route]
    },
    properties: {
      "route": route
    }
  };
  routesWithCoords.push(routeCoordsFeature);

  var routeFeature = {
        "type": "Feature",
    properties: {
      "route": route
    }
  };
  routesNoCoords.push(routeFeature);
}
//  Remove coordinates that aren't in the bounding box

// Double loop to find all intersections and put in a mapping.
console.log("num of routes: " + routesWithCoords.length + " ... " + routesNoCoords.length);
for (var i = 0; i < routesWithCoords.length; i++) {
  var thisRouteIntersections = []
  for (var j = 0; j < routesWithCoords.length; j++) {
    if (j == i) {
      continue;
    }
    var intersect = gju.lineStringsIntersect(routesWithCoords[i].geometry, routesWithCoords[j].geometry);
    if (intersect) {
      thisRouteIntersections.push(routesNoCoords[j]);
    }
  }
  intersections[routesNoCoords[i].properties.route] = thisRouteIntersections;
  console.log("got intersections for route " + routesWithCoords[i].properties.route+ " (" + (i+1) + "/" + (routesWithCoords.length-1) + ")");
  /*console.log("intersections for " + routesWithCoords[i].properties.route + ":");
  for (var k = 0; k < thisRouteIntersections.length; k++)
  {
    console.log("  " + thisRouteIntersections[k].properties.route);
  }*/

}
console.log("writing out ... ");

// Write out
fs.writeFile("data/intersections.json", JSON.stringify(intersections), (err) => {
  if (err) {
    throw err;
    console.log('error writing out.'); 
    console.log(err); }
  }
);













