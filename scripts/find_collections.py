#!/usr/bin/python

__author__ = 'averaart'


from pymongo import Connection

connection = Connection()
db = connection.opendata
collections = db.collection_names()

collections = [str(collection) for collection in collections]
if "system.indexes" in collections: collections.remove('system.indexes')
if "objects" in collections: collections.remove('objects')
if "new_objects" in collections: collections.remove('new_objects')
if "attributes" in collections: collections.remove('attributes')

collections = sorted(collections, key=str.lower)

print "Content-type: text/html"
print
print collections