#!/usr/bin/python
import json
import sqlHelper

# stop_name, stop_lat, stop_lon, route_short_name
rows = sqlHelper.queryFromFile('stopsQuery.sql')

stops = dict()
stops_file = open('stopsData.json', 'w')

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

json.dump(stops, stops_file)
