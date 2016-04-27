'use strict';
var d3 = require('d3');

var svg = d3.select("body").append("svg")
    .attr("width", 1024)
    .attr("height", 768);
 
var xhr = require('xhr');

var query = 'test'

xhr.get({

    url: 'http://localhost:5000/' + query

}, function (error, response, body) {
    //console.log(JSON.parse(body));
    console.log("hello!");
    console.log(body);

});
 