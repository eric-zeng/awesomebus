'use strict';
var d3 = require('d3');

var svg = d3.select("body").append("svg")
    .attr("width", 1024)
    .attr("height", 768);
 
var xhr = require('xhr');

var query = 'test';
var sqlVars = 'select * from shapes limit 10';
/*
xhr.get({

    url: 'http://localhost:5000/' + query  + "/" + sqlVars

}, function (error, response, body) {
    //console.log(JSON.parse(body));
    console.log("hello!");
    console.log(body);

});*/


console.log("done with the get");
xhr.post( {
    url: 'http://localhost:5000/query',
    /* CHANGE THIS PART!!!
    TODO: functionize this??*/
    json: 
      [{
        "select" : "*",
        "from"  : "routes", 
        "where" : "route_id='100001'",
        "limit" : "10"
      }]
  }, 
  function(error, response, body) {
    /*console.log(body)*/
    console.log("????!");
});
 