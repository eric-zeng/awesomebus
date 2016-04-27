# describes an SQL schema

class Value:
    DECIMAL = "decimal"
    TEXT = "text"
    def __init__(self, name="", datatype=""):
        self.name = name
        self.datatype = datatype

class Table:
    def __init__(self, name):
        self.name = name
        self.values = []

class Schema:
    def __init__(self):
        self.tables = []

# Constructs the Schema object that will be used to check queries
# only need to call this once
# This shouldn't really be in this file, but it makes the other one a LOT more readable
def constructSchema():
    s = Schema()
    trip_table = Table("trips")
    trip_table.values.append(Value("route_id", Value.DECIMAL))
    trip_table.values.append(Value("service_id", Value.DECIMAL))
    trip_table.values.append(Value("trip_id", Value.DECIMAL))
    trip_table.values.append(Value("trip_headsign", Value.TEXT))
    trip_table.values.append(Value("trip_short_name", Value.TEXT))
    trip_table.values.append(Value("direction_id", Value.DECIMAL))
    trip_table.values.append(Value("block_id", Value.DECIMAL))
    trip_table.values.append(Value("shape_id", Value.DECIMAL))
    trip_table.values.append(Value("peak_flag", Value.DECIMAL))
    trip_table.values.append(Value("fare_id", Value.DECIMAL))

    routes_table = Table("routes")
    routes_table.values.append(Value("route_id", Value.DECIMAL))
    routes_table.values.append(Value("agency_id", Value.TEXT))
    routes_table.values.append(Value("route_short_name", Value.TEXT))
    routes_table.values.append(Value("route_long_name", Value.TEXT))
    routes_table.values.append(Value("route_desc", Value.TEXT))
    routes_table.values.append(Value("route_type", Value.DECIMAL))
    routes_table.values.append(Value("route_url", Value.TEXT))
    routes_table.values.append(Value("route_color", Value.TEXT))
    routes_table.values.append(Value("route_text_color", Value.TEXT))

    shapes_table = Table("shapes")
    shapes_table.values.append(Value("shape_id", Value.DECIMAL))
    shapes_table.values.append(Value("shape_pt_lat", Value.DECIMAL))
    shapes_table.values.append(Value("shape_pt_lon", Value.DECIMAL))
    shapes_table.values.append(Value("shape_pt_sequence", Value.DECIMAL))
    shapes_table.values.append(Value("shape_dist_traveled", Value.DECIMAL))

    s = Schema()
    s.tables.append(trip_table)
    s.tables.append(routes_table)
    s.tables.append(shapes_table)
    return s