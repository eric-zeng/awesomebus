#!/usr/bin/python
import psycopg2
import os
import json
from datetime import datetime

USER = os.getenv("USER")
DATABASE = "transitdata"
TIME_FORMAT = '%H:%M:%S'


class TimeBlock:
    def __init__(self, start=None, end=None):
        if start.startswith('24'):
            start = '00' + start[2:]
        elif start.startswith('25'):
            start = '01' + start[2:]
        elif start.startswith('26'):
            start = '02' + start[2:]        
        elif start.startswith('27'):
            start = '03' + start[2:]        
        elif start.startswith('28'):
            start = '04' + start[2:] 

        if end.startswith('24'):
            end = '00' + end[2:]
        elif end.startswith('25'):
            end = '01' + end[2:]
        elif end.startswith('26'):
            end = '02' + end[2:]        
        elif end.startswith('27'):
            end = '03' + end[2:]        
        elif end.startswith('28'):
            end = '04' + end[2:]        

        self.start = datetime.strptime(start, TIME_FORMAT)
        self.end = datetime.strptime(end, TIME_FORMAT)

    def __str__(self):
        return str(self.start) + ", " + str(self.end)

class Route:
    def __init__(self, name, timeblock):
        self.name = name
        self.trips = [timeblock]
        self.times = []


    def __eq__(self, other):
        if type(other) != type(self):
            return False
        return self.name == other.name
    
    def cullStartEndTimes(self, trips=None, times=None):
        if trips == None:
            trips = self.trips
        if times == None:
            times = self.times
        madeModification, times= self.cullStartEndTimes_helper(trips)
        while madeModification:
            madeModification, times = self.cullStartEndTimes_helper(times)

        self.times = times



    def cullStartEndTimes_helper(self, trips):
        times  = []
        for trip in trips:
            if len(times) == 0:
                times.append(trip)
                continue             
            # time1 > time2 # means that time1 is after time2
            # time1 < time2 means that time1 is before time2
            newBlockOfTime = True
            for i in range(len(times)):
                temp_time = times[i]
                if trip.start >= temp_time.start and trip.end <=temp_time.end:
                    newBlockOfTime = False
                    break
                # If the start in this trip is between the start and end of this time,
                # and if the end of this trip is AFTER the end of this time, replace the time.end with trip.end 
                # (lengthen the time block)
                # Trip:     A       B
                # Time:  A      B
                # -->    A          B
                if trip.start <= temp_time.end and \
                   trip.start >= temp_time.start and \
                   trip.end > temp_time.end:
                   times[i].end=trip.end
                   newBlockOfTime = False
                   break

                # If the end of this trip is between the start and end of this time,
                # and if the start of this trip is BEFORE the start of this time,
                # replace the time.start with trip.start
                # Trip:  A       B
                # Time:      A      B
                # -->    A          B
                if trip.end >= temp_time.start and \
                     trip.end <= temp_time.end and \
                     trip.start < temp_time.start:
                     times[i].start = trip.start
                     newBlockOfTime = False
                     break

            # if we couldn't find a block to extend, add this trip as a new block.
            if newBlockOfTime:
                times.append(trip)

        if len(times) == len(trips):
            madeModification = False
        else:
            madeModification = True
        return madeModification, times



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

# This query gets the route short name, trip_id, earliest time, and latest time of operation for that trip
# See queries.sql for better formatting, explanation
query_file = open('busTimesQuery.sql', 'r')
route_path_query = query_file.read()

rows = query(route_path_query)

export = dict()
export_file = open('busTimesData.json', 'w')
routes = []
for row in rows:
    # Rows are
    # route_short_name | trip_id  |   min    |   max   
    route = row[0]
    trip_id = row[1]
    trip_id_starttime = row[2]
    trip_id_endtime = row[3]
    found = False
    for i in range(len(routes)):
        if route == routes[i].name:
            routes[i].trips.append(TimeBlock(trip_id_starttime, trip_id_endtime))
            found = True
    if not found:
        routes.append(Route(route, TimeBlock(trip_id_starttime, trip_id_endtime)))
    #export[route].append((str(trip_id_starttime), str(trip_id_endtime)))

for r in routes:
    r.cullStartEndTimes()
    print "ROUTE NAME: ", r.name
    for time in r.times:
        print time

    print
    print
    print





#json.dump(export, export_file)
