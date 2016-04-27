# SQL query helper functions
from schema import *
schema = constructSchema()

#TODO: more testing.

def termIsValid(term, tables):
    print "checking term", term, "with tables", tables
    # Terms can either be 'table.field' or just 'field' if there's only one table
    # Handle the 'table.field' case first
    if "." in term:
        term = term.split('.')
        if len(term) != 2:
            return False
        table = term[0]
        field = term[1]
        if table not in tables:
            return False
        # the table is valid ... so now check if the field is in the table
        schemaTable = schema.getTableByName(table)
        for schemaField in schemaTable.fields:
            if field == schemaField.name:
                return True
        return False

    # this field isn't qualified by table, so there must only one table.
    if len(tables) == 1:
        schemaTable = schemaTable.getTableByName(tables[0])
        for schemaField in schemaTable.fields:
            if term == schemaField:
                return True

    return False

def validateSelect(select, frm):
    select = select.strip()
    if select == "*":
        return "*"

    # look at what is in the from clause to find the tables we're selecting from
    tables = validateFrom(frm)
    if tables is None:
        return None
    tables = tables.split(", ")

    # Break on commas/spaces
    select = select.replace(" ", "").split(",")

    # Check if each term is valid for the tables given
    for term in select:
        if not termIsValid(term, tables):
            return None
    return ", ".join(select)

def validateFrom(frm):
    frm = frm.strip()
    if frm == "*":
        return "*"
    # Break on commas/spaces
    # must be table names
    frm = frm.replace(" ", "").split(",")
    # frm should now be a list of legit tables.
    for potential_table_name in frm:
        if not schema.isTable(potential_table_name):
            return None
    return ", ".join(frm)

#TODO
def validateWhere(where):
    where = where.strip()
    # Where clauses can use boolean logic
    # In order to make this as simple as possible, ignore the logic
    # 1. Add spaces around any parenthesis that don't already have them
    # 2. split on spaces and check each term is one of the following:
    #   a. parentheses (numer/direction don't matter)
    #   b. 'and'/'or' 
    #   c. a valid term
    return where

def validateLimit(limit):
    if limit.isdigit():
        return limit
    return None
    
# Constructs a valid SQL query from json
#TODO: this doesn't support the full functionality of SQL -- add more as needed
def constructSQLquery(j):
    # For example:
    # j = [{"where": "", "from": "routes", "limit": "10", "select": "*"}]
    # TODO: will there ever be more than one of these?
    command = j[0]
    select = ""
    frm = ""
    where = ""
    limit = ""
    clauses = command.keys()
    # select, from, where, limit, count, group by, join, on
    if 'from' in clauses:
        frm = validateFrom(command['from'])
        if frm is None:
            return ""
        frm = "from " + frm + " "
    if 'select' in clauses:
        select = validateSelect(command['select'], command['from'])
        if select is None:
            return ""
        select = "select " + select + " "
    if 'where' in clauses:
        where = validateWhere(command['where'])
        if where is None:
            return ""
        where = "where " + where + " "
    if 'limit' in clauses :
        limit = validateLimit(command['limit'])
        if limit is not None:
            limit = "limit " + limit + " "
    # TODO check that the clauses have select, fomr, where, or join, etc

    print select, frm, where, limit
    return select + frm + where + limit



