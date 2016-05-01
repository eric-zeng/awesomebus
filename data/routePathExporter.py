#!/usr/bin/python
import psycopg2
import os
import json

USER = os.getenv("USER")
DATABASE = "transitdata"

def connectToDB():
    conn = None
    try:
        conn = psycopg2.connect(
            database = DATABASE,
            user = USER,
            password = "",
            host="localhost")
    except psycopg2.Error, e:
        print "I am unable to connect to the database. \nError:"
        print e
        return conn
    if conn is None:
        return conn
    return conn.cursor()

def query(sql_query):
    cur = connectToDB()
    if cur is None:
        print "Could not connect to database."
        return ""
    cur.execute(sql_query)
    return cur.fetchall()

# This query gets lat/long, route name, and sequence number for every route.
# See queries.sql for better formatting, explanation
master_query = "select shapes.shape_pt_lon, shapes.shape_pt_lat, "
master_query += "routes.route_short_name, shapes.shape_pt_sequence "
master_query += "from trips, routes, shapes, ("
master_query += "select routes.route_short_name, MIN(trips.trip_id) as trip_id "
master_query += "from trips, routes "
master_query += "where trips.route_id=routes.route_id "
master_query += "group by routes.route_short_name "
master_query += "order by routes.route_short_name "
master_query += ") as trip_per_route "
master_query += "where trips.route_id=routes.route_id "
master_query += "and trips.shape_id=shapes.shape_id "
master_query += "and trips.trip_id=trip_per_route.trip_id "
master_query += "order by routes.route_short_name, shapes.shape_pt_sequence;"

rows = query(master_query)

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
