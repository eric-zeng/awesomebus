AwesomeBus: Visualizing Seattle Public Transit
===============

## Team Members

1. Lucy Simko (simkol)
2. Eric Zeng (ericzeng)

## AwesomeBus

AwesomeBus is a d3-based visualization of the bus, light rail, streetcar, and ferry routes in the Seattle metro area. The visualization displays public transport routes overlaid on a map of Seattle. Individual routes can be highlighted by either clicking on the map, or by typing the name of the route in the input box.

We used GTFS data from [King County Metro](http://www.kingcounty.gov/transportation/kcdot/MetroTransit/Developers.aspx) and vector tile data from [OpenStreetMap](https://openstreetmap.us/~migurski/vector-datasource/) to create this visualization.

## Running Instructions

### How to view the visualization on your machine
If you want to view the visualization on a local copy of the repository, your
need to run a local web server since d3 needs to make XHRs to retrieve data.

1. Clone the repository: `git clone git@github.com:CSE512-16S/a3-lucysimko-eric-zeng.git`
2. In the root of the directory, run `python -m SimpleHTTPServer 8888`
3. Open `localhost:8888` in the browser.


### How to generate the data
`data/routePathData.json` contains processed data for the visualization. It was
generated by querying the GTFS data and exporting to JSON. This is how to
reproduce those steps:

Before starting, install PostgreSQL, and make sure the psql service is running.

1. Clone the repository:
```
git clone git@github.com:CSE512-16S/a3-lucysimko-eric-zeng.git
```

2. Create the database. This adds the data from `data/.*_noheader.txt` into your
Postgres instance.
```
cd data
./createDatabase.sh
```
3. Extract the route data to JSON. This runs a query and then converts it to
JSON.
```
./routePathExporter.py
```

## Storyboard

View the storyboard [here](transit-storyboard.pdf?raw=true).

### Changes between Storyboard and the Final Implementation

- Geo mapping is hard - we did not implement panning or zooming. See 'Most Time Consuming Parts' for details.
- We ran out of time to implement route selection using selection boxes, but we plan to implement this for the final project
- Routes traveling on the same street don't appear side-by-side, instead they are stacked. The way d3.geo and SVGs work, we can't do this without modifying the data.


## Development Process

We spent the first few days just trying to extract the data, load it into the browser, and position it properly on a map. This included:

- Figuring out which of the GTFS tables and fields we needed to query in order to get a correct representation of the bus routes
- Deciding what kind of backend database/server was best, setting those up, and writing API endpoints for querying the data (though we eventually realized that we were better off running queries offline and saving the results to a file, so we scrapped the whole database/server setup)

Once we had our database, server, and query set up, the next major piece of the development process was learning what is easily accessible in d3 and what is not--for example, mapping.

d3 includes a geo library, but it turned out that we couldn’t just drop a set of coordinates in and go. There were many steps involved to simply display a set of points on a map: picking a projection, positioning the view, finding map data online, displaying the map layer, reformatting our data, and plotting the points.

After we got a rudimentary map working, we split the work into two parts - Eric worked on getting an accurate map layer with streets and landmasses, while Lucy worked on displaying routes as lines on the map.

Getting a good map layer took a lot of effort. d3 provides no underlying map, just an API to convert coordinates into SVG paths based on the view of the map. We (Eric) considered and rejected many different options, but we ended up using the static vector tiles example (http://bl.ocks.org/mbostock/5616813), because it was too much work getting anything fancier working, and so we had to drop normal map functions like zooming and panning.

While Eric was working on displaying a map, Lucy was trying to display transit routes. For too many hours, this task was simplified to just drawing a line. We discovered GeoJson, which seemed perfect for our purposes because it was specifically for representing points and lines with coordinates in an SVG. Eric was able to plot the bus points on the map, but connecting two points took too long, partially due to faulty and confusing tutorials. But eventually, we were able to display bus routes as lines using the GeoJson LineStrings. This lead into the next phase: although the coordinates provided by the dataset had sequence numbers, meaning we did not have to decipher the order ourselves, there were often multiple coordinate pairs for each sequence number, and it appeared that some pairs were missing or badly out of order. We tried multiple ways of deduping the coordinate pairs, but in the end Eric found a field in the data, trip_id, that perfectly delineated the sequence numbers.


The first four pieces of the process took longer than expected, but finally, we focused our efforts on the interactive part of our application: allowing the user to select transit routes in different ways, and making sure the routes were rendered in a way that would make the most sense to the viewer.

First, we assigned the bus routes random colors so that they can be distinguished. For non-bus routes (Link Light Rail, RapidRide, and streetcars), we assigned colors manually based on the colors commonly used by the transit agencies. Then, we implemented click-based selection, where clicking a route makes it thicker, fades out all of the other routes, and shows the name of the route that has been selected. Lastly, we implemented text query-based selection, where users can type in the route they want to see, which similarly highlights the route and fades out the rest.

### Most Time Consuming parts
Drawing a single line on the map took an incredible amount of time. I (Lucy) think this was a combination of the fact that I had no previous web development experience and the fact that many online d3 tutorials are surprisingly sparse on the comments, which makes abstracting away the useful parts extremely difficult. This was a common and disappointing theme throughout the project. On top of that, some of the tutorials on using GeoJson’s LineString for mapping simply did not work. Thankfully, the pace of work increased rapidly once I started drawing lines.

Another issue we encountered was misleading bus route data. GTFS has a series of fields to help shape a route (stored in shapes.txt), which includes, most importantly, latitude-longitude pairs and a sequence number, which match up with route ids. However, there are frequently more than one unique latitude-longitude pair for each sequence number, because these are also tied to two other fields. Mapping all coordinate pairs for a route meant that there were bus lines drawn where there were no streets because of what appeared to be missing route data, and the lines often jump around within in the route, indicating that the sequencing of the coordinate pairs is sometimes incorrect. We eventually determined that we needed to dedup the data using a different field, trip_id, and that the routes would perfectly follow streets once we did so.

Displaying good underlying map data was also huge pain. As noted above, d3 doesn’t have a standard way to display a map with roads, land, and water, so we had to scavenge the internet for ways to do it. Similar to drawing lines, there were not a lot of specific, well documented instructions on how to do this common task. Here are the things that Eric tried and failed at:
- Downloading all of the street data for King County and hosting it ourselves (too big),
- Using the d3-Google Maps example http://bl.ocks.org/mbostock/5616813 (had to use a totally different API than d3.geo so all of Lucy’s work would be thrown away, also extremely complicated)
- Using the dynamic vector tile example http://bl.ocks.org/mbostock/5593150 (example split the map into multiple svgs, making it super difficult to draw routes).

### Who did what, and how long it took
- Both: Storyboarding, general debugging.
- Eric: Map setup, background map layer, some route debugging, offline data extraction, current serverless architecture, route coloring, text query-based route selection
- Lucy: Database setup, original Flask server development, query construction, route drawing, route debugging, click-based route selection
- Total man-hours: 62

### Future work (starting points for the final project)
- Allow the user to select multiple routes
- Allow the user to draw a selection box/area and select all routes that pass through that
- Implement panning and zooming (may just involve using d3 plug-in Leaflet)
