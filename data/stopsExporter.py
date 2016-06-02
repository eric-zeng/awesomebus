#!/usr/bin/python
import json
import sqlHelper

# stop_name, stop_lat, stop_lon, route_short_name
rows = sqlHelper.queryFromFile('stopsQuery.sql')

stops = dict()
outputFile = open('stopData.geojson', 'w')

for row in rows:
    name = row[0]
    lat = row[1]
    lon = row[2]
    route = row[3]

    if name not in stops:
        stops[name] = { 'lat': str(lat), 'lon': str(lon), 'routes': list() }

    stop = stops[name]

    if route not in stop['routes']:
        stop['routes'].append(route)

# Convert to GeoJSON representation
features = list()
for name, stop in stops.iteritems():
    features.append({
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': [stop['lon'], stop['lat']]
        },
        'properties': {
            'name': name,
            'routes': stop['routes']
        }
    })

json.dump(features, outputFile, indent=2)
