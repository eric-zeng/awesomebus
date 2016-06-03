#!/usr/bin/python
import json
import sqlHelper

# This query gets lat/long, route name, and sequence number for every route.
# See queries.sql for better formatting, explanation
rows = sqlHelper.queryFromFile('routePathQuery.sql')

export = dict()
export_file = open('routePathData.json', 'w')

for row in rows:
    lon = row[0]
    lat = row[1]
    route = row[2]
    if route not in export:
        export[route] = list()
    export[route].append([str(lon), str(lat)])

json.dump(export, export_file)
