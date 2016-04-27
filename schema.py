# describes an SQL schema

class Field:
    DECIMAL = "decimal"
    TEXT = "text"
    def __init__(self, name="", datatype=""):
        self.name = name
        self.datatype = datatype

    def __eq__(self, other):
        if type(self) != type(other):
            return False
        return self.name == other.name

    def __str__(self):
        return self.name

class Table:
    def __init__(self, name):
        self.name = name
        self.fields = []

    

class Schema:
    def __init__(self):
        self.tables = []

    def isTable(self, potential_table_name):
        for table in self.tables:
            if potential_table_name==table.name:
                return True
        return False

    def getTableByName(self, tableName):
        if not self.isTable(tableName):
            return None
        for table in self.tables:
            if table.name == tableName:
                return table

# Constructs the Schema object that will be used to check queries
# only need to call this once
# This shouldn't really be in this file, but it makes the other one a LOT more readable
def constructSchema():
    s = Schema()
    trip_table = Table("trips")
    trip_table.fields.append(Field("route_id", Field.DECIMAL))
    trip_table.fields.append(Field("service_id", Field.DECIMAL))
    trip_table.fields.append(Field("trip_id", Field.DECIMAL))
    trip_table.fields.append(Field("trip_headsign", Field.TEXT))
    trip_table.fields.append(Field("trip_short_name", Field.TEXT))
    trip_table.fields.append(Field("direction_id", Field.DECIMAL))
    trip_table.fields.append(Field("block_id", Field.DECIMAL))
    trip_table.fields.append(Field("shape_id", Field.DECIMAL))
    trip_table.fields.append(Field("peak_flag", Field.DECIMAL))
    trip_table.fields.append(Field("fare_id", Field.DECIMAL))

    routes_table = Table("routes")
    routes_table.fields.append(Field("route_id", Field.DECIMAL))
    routes_table.fields.append(Field("agency_id", Field.TEXT))
    routes_table.fields.append(Field("route_short_name", Field.TEXT))
    routes_table.fields.append(Field("route_long_name", Field.TEXT))
    routes_table.fields.append(Field("route_desc", Field.TEXT))
    routes_table.fields.append(Field("route_type", Field.DECIMAL))
    routes_table.fields.append(Field("route_url", Field.TEXT))
    routes_table.fields.append(Field("route_color", Field.TEXT))
    routes_table.fields.append(Field("route_text_color", Field.TEXT))

    shapes_table = Table("shapes")
    shapes_table.fields.append(Field("shape_id", Field.DECIMAL))
    shapes_table.fields.append(Field("shape_pt_lat", Field.DECIMAL))
    shapes_table.fields.append(Field("shape_pt_lon", Field.DECIMAL))
    shapes_table.fields.append(Field("shape_pt_sequence", Field.DECIMAL))
    shapes_table.fields.append(Field("shape_dist_traveled", Field.DECIMAL))

    s = Schema()
    s.tables.append(trip_table)
    s.tables.append(routes_table)
    s.tables.append(shapes_table)
    return s