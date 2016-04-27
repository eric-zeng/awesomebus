# SQL query helper functions
from schema import *
schema = constructSchema()

#TODO
def validateSelect(select):
    return True
#TODO
def validateFrom(frm):
    return True
#TODO
def validateWhere(where_clause):
    return True
#TODO
def validateLimit(limit_clause):
    return True
    
# Constructs a valid SQL query from json
#TODO: this doesn't support the full functionality of SQL -- add more as needed
def constructSQLquery(j):
    query = ""
    # For example:
    # j = [{"where": "", "from": "routes", "limit": "10", "select": "*"}]
    # TODO: will there ever be more than one of these?
    command = j[0]
    clauses = command.keys()
    print clauses
    # select, from, where, limit, count, group by, join, on
    if 'select' in clauses and validateSelect(command['select']):
        query += "select " + command['select'] + " "
    if 'from' in clauses and validateFrom(command['from']):
        query += "from " + command['from'] + " "
    if 'where' in clauses:# and validateWhere['where']:
        query += "where " + command['where'] + " "
    if 'limit' in clauses: # and validateLimit['limit']:
        query += "limit " + str(command['limit'])
    # TODO check that the clauses have select, fomr, where, or join, etc
    return query