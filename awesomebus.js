'use strict';
var d3 = require('d3');

var svg = d3.select("body").append("svg")
    .attr("width", 1024)
    .attr("height", 768);
 
var xhr = require('xhr');

xhr.post( {
    url: 'http://localhost:5000/query',
    /* CHANGE THIS PART!!!
    TODO: functionize this??*/
    json: 
      [{
        "select" : "routes.route_id, shapes.shape_id",
        "from"  : "routes, trips, shapes", 
        "where" : "routes.route_id='100001'",
        "limit" : "10"
      }]
  }, 
  function(error, response, body) {
    console.log(body)
});
 