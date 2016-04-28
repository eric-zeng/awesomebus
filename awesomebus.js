'use strict';
var d3 = require('d3');
var xhr = require('xhr');

var svg = d3.select("body").append("svg")
    .attr("width", 1024)
    .attr("height", 768);

function getRouteShapes(routeNum, callback) {
  xhr.get({
    url: 'http://localhost:5000/shapes?route=' + routeNum
  }, callback);
}


getRouteShapes(48, function(err, response, body) {
  console.log(JSON.parse(body));
});
