#!/usr/bin/python

__author__ = 'averaart'


from pymongo import Connection

connection = Connection()
db = connection.opendata
collections = db.collection_names()

collections = [str(collection) for collection in collections]
collections.remove('system.indexes')
collections.remove('objects')
collections.remove('new_objects')
collections.remove('attributes')

collections = sorted(collections, key=str.lower)

print "Content-type: text/html"
print
print collections