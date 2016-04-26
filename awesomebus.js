'use strict';
var postgres = require('ps');
var d3 = require('d3');

var svg = d3.select("body").append("svg")
    .attr("width", 1024)
    .attr("height", 768);

console.log(d3);
console.log(postgres);
console.log('something');
