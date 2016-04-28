'use strict';
var d3 = require('d3');
var xhr = require('xhr');

var svg = d3.select("body").append("svg")
    .attr("width", 1024)
    .attr("height", 768);

let queryUrl = 'http://localhost:5000/query';

function getRouteShapes(routeNum, callback) {
  xhr.post({
    url: queryUrl,
    json: [{
      'select': 'shapes.shape_pt_lat, shapes.shape_pt_lon',
      'from': 'routes, trips, shapes',
      'where': 'routes.route_short_name=' + routeNum + ' AND trips.route_id=routes.route_id AND shapes.shape_id=trips.shape_id'
    }]
  }, callback);
}


getRouteShapes(48, function(err, response, body) {
  console.log(err);
  console.log(response);
});
