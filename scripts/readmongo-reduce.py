#!/usr/bin/python
print "Content-type: text/html"
print 

__author__ = 'averaart'

import cgi
import urllib
from logging import *
from pymongo import Connection
from bson.code import Code

basicConfig(level=DEBUG,
    format='%(asctime)s %(levelname)-8s %(message)s',
    datefmt='%m-%d %H:%M',
    filename='debug.log')

connection = Connection()
db = connection.opendata
objects = db.new_objects

fs = cgi.FieldStorage()

if fs.has_key('set'):
    objects = db[fs["set"].value]
else:
    objects = db.CivieleKunstwerken


if fs.has_key('bounds'):
    bounds = eval(urllib.url2pathname(fs["bounds"].value))
    upperleft = list(bounds[0])
    lowerright = list(bounds[1])
else:
    upperleft = [51.9147931040495, 4.461841822601286]
    lowerright = [51.92718009760987, 4.481926203704688]
    bounds=[upperleft,lowerright]

lowerleft = [lowerright[0],upperleft[1]]
upperright = [upperleft[0],lowerright[1]]

#debug(str(bounds)+" - "+str(fs["set"].value))



if fs.has_key('resolution'):
    numWide = eval(urllib.url2pathname(fs["resolution"].value))
else:
    numWide = 30

lonRange = lowerright[1]-upperleft[1]
step = lonRange/numWide

map = Code("""
function (key, values){
    var lat = this.location.lat;
    var lng = this.location.lon;
    var step = """+str(step)+""";
    lat = lat * 1500;
    lng = lng * 1000;
    step = step * 1000;
    lat = step * Math.round(lat/step);
    lng = step * Math.round(lng/step);
    lat = lat / 1500;
    lng = lng / 1000;
    step = step / 1000;
    emit(lat+","+lng, {count: 1});
}
""")

reduce = Code("""
function (key, values) {
    var result = {count: 0};
    values.forEach(function(value) {
      result.count += value.count;
    });
    return result;
}
""")


# Build a dictionary of rasterpoints
lonRange = lowerright[1]-upperleft[1]
latRange = lowerright[0]-upperleft[0]
step = lonRange/numWide
start = (upperleft[0]+(step/2), upperleft[1]+(step/2))

# mongo boxes are defined by specifying lower-left and upper-right corners
box = [ lowerleft, upperright ]
grid = objects.inline_map_reduce(map, reduce, query={"location": {"$within" : {"$box" : box}}})



result = "var testData={ max: "+str(max([item["value"]["count"] for item in grid]))+", data: ["
for i, item in enumerate(grid):
    if i > 0:
        result += ","
    result += "{lat: "+item["_id"].split(",")[0]+", lng: "+item["_id"].split(",")[1]+", count: "+str(item["value"]["count"])+"}"
result += "]}"

print result
