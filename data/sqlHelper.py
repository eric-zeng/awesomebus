#!/usr/bin/python
import psycopg2
import os

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

def queryFromFile(filename):
    query_file = open(filename, 'r')
    queryString = query_file.read()
    return query(queryString)
