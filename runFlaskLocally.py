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

app = Flask(__name__, static_url_path='')
app.config['SERVER_NAME'] = "localhost:5000"

with app.app_context():
    url_for('static', filename='static-awesomebus-bundle.js')

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



####################################################################
#                          FLASK FUNCTIONS                         #
####################################################################
@app.route("/")
def index():
    return render_template('index.html')

@app.route("/query", methods=["POST"])
def test():
    cur = connectToDB()
    if cur is None:
        print "Could not connect to database."
        return ""
    sql_args = request.get_json()
    sql = constructSQLquery(sql_args)
    print "SQL: " + sql
    cur.execute(sql)
    rows = cur.fetchall()
    #print rows
    print "made it"
    return str(rows)


if __name__ == '__main__':
    app.run()
