var xhr = require('xhr');

function drawRoute(body, routeNum)
{

  var data = JSON.parse(body);
  // The data returned are in the format:
  // [long, lat, seq]
  // there may be duplicates for seq -- take the first of each one.
  // the duplicate nature is because there are sometimes different values for
  // trips.service_id and shapes.shape_dist_traveled ... as an example, look at the 49.
  var dedupedData = [];
  var seqSeen = [];
  for (var i = 0; i < data.length; i++)
  {
    var row = data[i];
    var seq = row[2];
    var newSeq= true;
    for (var j = 0; j < seqSeen.length; j++)
    {
      if (seqSeen[j] == seq)
      {
        newSeq = false;
        break;
      }
    }
    if (newSeq)
    {
      dedupedData.push(row);
      seqSeen.push(seq);
    }
  }

  var coords = dedupedData.map(function(row) {
    return [row[0], row[1]];
  });

  var geoJSONroute = {
    "type": "LineString",
    "coordinates" : coords
  }

  var bus = svg.append("g");

  bus.selectAll("path")
    //.data([geoJSONbus49])
    .data([geoJSONroute])
    .enter()
    .append("path")
    .attr("class", "path")
    .attr("d", geoPath);

}

function getRouteShapes(routeNum, callback) {
  xhr.get({
    url: 'http://localhost:5000/shapes?route=' + routeNum
  }, callback);
}

let width = window.innerWidth;
let height = window.innerHeight;

var tiler = d3.geo.tile()
    .size([width, height]);

var projection = d3.geo.mercator()
    .center([-122.3321, 47.6362])
    .scale((1 << 21) / 2 / Math.PI)
    .translate([width / 2, height / 2]);

var svg = d3.select("body")
  .append("svg")
  .attr("width", width)
  .attr("height", height);

var geoPath = d3.geo.path()
    .projection(projection);

svg.selectAll("g")
    .data(tiler
      .scale(projection.scale() * 2 * Math.PI)
      .translate(projection([0, 0])))
  .enter().append("g")
    .each(function(d) {
      var g = d3.select(this);
      var server = ["a", "b", "c"][(d[0] * 31 + d[1]) % 3];
      d3.json("http://" + server + ".tile.openstreetmap.us/vectiles-highroad/" + d[2] + "/" + d[0] + "/" + d[1] + ".json", function(error, roads) {
        d3.json("http://" + server + ".tile.openstreetmap.us/vectiles-water-areas/" + d[2] + "/" + d[0] + "/" + d[1] + ".json", function(error, water) {
          var sortedRoads = roads.features.sort(function(a, b) {
            return a.properties.sort_key - b.properties.sort_key;
          })
          var allData = water.features.concat(sortedRoads);
          g.selectAll("path")
              .data(allData)
            .enter().append("path")
              .attr("class", function(d) { return d.properties.kind; })
              .attr("d", geoPath);
        });
      });
    });


function drawAllRoutes() {
  xhr.get({
    url: 'http://localhost:5000/allRoutes'
  }, function (err, response, body)
  {
    var routes = JSON.parse(body);
    for (i = 0; i < routes.length; i++)
    {
      getRouteShapes(routes[i], function(err, response, body) {
        drawRoute(body, '#900')
      });
    }
  })
}


drawAllRoutes();
