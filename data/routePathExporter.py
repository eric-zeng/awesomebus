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
query_file = open('routePathQuery.sql', 'r')
route_path_query = query_file.read()

rows = query(route_path_query)

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
