#!/usr/bin/python
from pprint import pprint

__author__ = 'averaart'


from pymongo import Connection
from bson.code import Code

print "Content-type: text/html"
print

connection = Connection()
db = connection.opendata
collections = db.collection_names()
objects = db.CivieleKunstwerken
att_collection = db.attributes

map = Code("""
function() {
    for (var key in this.properties) { emit(key, 0); }
}
""")

reduce = Code("""
function(key, values) {
    return key;
}
""")



mapreduce = objects.inline_map_reduce(map, reduce, query={})

attributes = {"_id":objects.name, "attributes":[]}

for att in mapreduce:
    attributes["attributes"].append(att["_id"])

pprint(attributes)

att_collection.insert(attributes)

