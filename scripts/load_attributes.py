#!/usr/bin/python
__author__ = 'averaart'

import cgi
from pymongo import Connection

# Connect to Mongo
connection = Connection()
db = connection.opendata
att_coll = db.attributes

fs = cgi.FieldStorage()

if fs.has_key('set'):
    set = fs["set"].value
else:
    set = "CivieleKunstwerken"

doc = att_coll.find_one({"_id":set})
if doc is None:
    attributes = ""
else:
    attributes = [str(att) for att in doc['attributes']]

print "Content-type: text/html"
print
print attributes