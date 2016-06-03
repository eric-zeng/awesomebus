#!/usr/bin/python
import json
import sqlHelper

# stop_name, stop_lat, stop_lon, route_short_name
rows = sqlHelper.queryFromFile('stopsQuery.sql')

stops = dict()
outputFile = open('stopData.geojson', 'w')

for row in rows:
    id = row[0]
    name = row[1]
    lat = row[2]
    lon = row[3]
    route = row[4]

    if id not in stops:
        stops[id] = { 'name': name, 'lat': str(lat), 'lon': str(lon), 'routes': list() }

    stop = stops[id]

    if route not in stop['routes']:
        stop['routes'].append(route)

# Convert to GeoJSON representation
features = list()
for id, stop in stops.iteritems():
    features.append({
        'type': 'Feature',
        'geometry': {
            'type': 'Point',
            'coordinates': [stop['lon'], stop['lat']]
        },
        'properties': {
            'id': str(id),
            'name': stop['name'],
            'routes': stop['routes']
        }
    })

json.dump(features, outputFile, indent=2)
