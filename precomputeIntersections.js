// precompute all the intersections for each bus route and store in intersections.json

var fs = require('fs');
var d3 = require('d3'),
  http = require('http');
var gju = require('geojson-utils');
var routeData = require('/Users/lucy/Desktop/datavis/a3/a3-lucysimko-eric-zeng/data/routePathData.json');
var routes = [];
console.log(routes);
var intersections = {};

// Convert data to GeoJSON format
for (var route in routeData) {

  var routeFeature = {
    "type": "Feature",
    "geometry": {
      "type": "LineString",
      "coordinates": routeData[route]
    },
    properties: {
      "route": route
    }
  };
  routes.push(routeFeature);
}
//  Remove coordinates that aren't in the bounding box

// Double loop to find all intersections and put in a mapping.
console.log("num of routes: " + routes.length);
for (var i = 0; i < routes.length; i++) {
  var thisRouteIntersections = []
  for (var j = 0; j < routes.length; j++) {
    if (j == i) {
      continue;
    }
    var intersect = gju.lineStringsIntersect(routes[i].geometry, routes[j].geometry);
    if (intersect) {
      thisRouteIntersections.push(routes[j].properties.route);
      continue;
    }
  }
  intersections[routes[i].properties.route] = thisRouteIntersections;
  console.log("intersections for route " + routes[i].properties.route+ " (" + (i+1) + "/" + (routes.length-1) + "):");
  console.log(routes[i].properties.route + "-->" + intersections[routes[i].properties.route]);


}
console.log("writing out ... ");

// Write out
fs.writeFile("data/allIntersections.json", JSON.stringify(intersections), (err) => {
  if (err) {
    throw err;
    console.log('error writing out.'); 
    console.log(err); }
  }
);













