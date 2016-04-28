#!/usr/bin/python
import psycopg2
import os
import json
from flask import Flask, render_template, url_for, request
from schema import *
from SQLHelper import *
####################################################################
#                            FLASK SETUP                           #
####################################################################

USER = os.getenv("USER")
DATABASE = "transitdata"

app = Flask(__name__)
app.config['SERVER_NAME'] = "localhost:5000"

with app.app_context():
    url_for('static', filename='static-awesomebus-bundle.js')
    url_for('static', filename='city-limits.json')

####################################################################
#                          HELPER FUNCTIONS                        #
####################################################################

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

def query(sql_query, values):
    cur = connectToDB()
    if cur is None:
        print "Could not connect to database."
        return ""
    cur.execute(sql_query, values)
    return cur.fetchall()

####################################################################
#                          FLASK FUNCTIONS                         #
####################################################################
@app.route("/")
def index():
    return render_template('index.html')

@app.route("/json_query", methods=["POST"])
def test():
    sql_args = request.get_json()
    sql = constructSQLquery(sql_args)
    print "SQL: " + sql

    rows = query(sql)

    #print rows
    print "made it"
    return str(rows)

@app.route("/shapes", methods=["GET"])
def getShapesForRoute():
    routeNum = request.args.get("route")
    sql = "select distinct shapes.shape_pt_lat, shapes.shape_pt_lon from routes, shapes, trips where routes.route_short_name=(%s) and trips.route_id=routes.route_id and trips.shape_id=shapes.shape_id;"
    print sql

    rows = query(sql, (routeNum, ))
    print rows

    formatted = list()
    for row in rows:
        formatted.append([ float(row[1]), float(row[0]) ])

    return json.dumps(formatted)
@app.route("/allRoutes", methods=["GET"])
def getAllRoutes():
    sql = "select distinct route_short_name from routes"
    rows = query(sql, "")
    formatted = list()
    for row in rows:
        formatted.append(row[0])
    return json.dumps(formatted)



if __name__ == '__main__':
    app.run()
