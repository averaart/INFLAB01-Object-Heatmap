#!/usr/bin/python
# __author__ = 'averaart'

# python comes with batteries included
import cgi
import fnmatch
import os
from pprint import pprint
import shutil
import sys
import zipfile

# third party libraries
from pymongo import Connection, GEO2D
import shpUtils

# project library
import rd2gps


def locate(pattern, root=os.curdir):
    '''Locate all files matching supplied filename pattern in and below
    supplied root directory.'''
    for path, dirs, files in os.walk(os.path.abspath(root)):
        for filename in fnmatch.filter(files, pattern):
            yield os.path.join(path, filename)

# make sure the output is valid
# print "Content-Type: text/plain"


# get the file from the form
form = cgi.FieldStorage()
filefield = form['somefile']

# check if it's a zipfile, and if so, extract it
if filefield.file is not None and zipfile.is_zipfile(filefield.file):
    zfile = zipfile.ZipFile(filefield.file)
    zfile.extractall(path='upload')

# find the location of the main shapefile
files = [my_file for my_file in locate("*.shp", "upload")]
filename = files[len(files)-1]

collection_name = filefield.filename.replace('.zip','')

# this needs to be generalized
connection = Connection()
db = connection.opendata
my_collection = db[collection_name]
my_collection.ensure_index([("location", GEO2D)])

try:
    # load the shapefile
    shpRecords = shpUtils.loadShapefile(filename)

    # add all the records in the shapefile to the new collection
    for record in shpRecords:
        if "x" in record["location"]:
            point = (record["location"]["x"], record["location"]["y"])
        elif "xmax" in record["location"]:
            xmax = record["location"]["xmax"]
            xmin = record["location"]["xmin"]
            ymax = record["location"]["ymax"]
            ymin = record["location"]["ymin"]
            x = xmin + ((xmax-xmin)/2)
            y = ymin + ((ymax-ymin)/2)
            point = (x,y)
        else:
            continue
        lon = rd2gps.RD2lng(point[0],point[1])
        lat = rd2gps.RD2lat(point[0],point[1])
        record["location"] = {'lon':lon, 'lat':lat}
        my_collection.insert(record)

    # delete the extracted files
    shutil.rmtree('upload')
    print "Status: 303 See other"
    print "Location: /"
    print

except Exception:
    shutil.rmtree('upload')
    my_collection.drop()
    print "Status: 303 See other"
    print "Location: /"
    print