#!/usr/bin/python
from pprint import pprint

__author__ = 'averaart'

from logging import *
from pymongo import Connection
from bson.code import Code
from pearson import pearson
from math import fabs

basicConfig(level=DEBUG,
    format='%(asctime)s %(levelname)-8s %(message)s',
    datefmt='%m-%d %H:%M',
    filename='debug.log')

connection = Connection()
db = connection.opendata

request = {"Straatmeubilair": ["STRAATNAAM"],
           "Lichtmastlocaties": ["STRAATNAAM"]}

bounds = ((50.91434265748467, 3.461112261746166), (52.92762956096251, 5.482655764553783))
raster_size = 20

# determine the width and height of one raster field
width = (bounds[1][1]-bounds[0][1]) / raster_size
height = (bounds[1][0]-bounds[0][0]) / raster_size

sets = {}

for request_set in request:
    objects = db[request_set]
    attributes = request[request_set]

    map = Code("""
    function (key, values){
        var attributes = """+str(attributes)+""";
        var lat = this.location.lat;
        var lng = this.location.lon;
        var rel_lat = lat - """+str(bounds[0][0])+""";
        var rel_lng = lng - """+str(bounds[0][1])+""";
        y = Math.floor(rel_lat / """+str(height)+""");
        x = Math.floor(rel_lng / """+str(width)+""");
        index = x + (y * """+str(raster_size)+""");
        for (i in attributes){
            emit(attributes[i], {value: this.properties[attributes[i]], index: index});
        }
    }
    """)

    reduce = Code("""
    function (key, values) {
        var result = {};

        values.forEach(function(value) {
            if (!result[value.value]){
                result[value.value]=[]
                for (var i=0; i<"""+str(raster_size*raster_size)+"""; i++){
                    result[value.value][i]=0;
                }
                result[value.value][value.index]=0;
            }
            result[value.value][value.index] += 1;
        });

        return result;
    }
    """)

    sets[request_set] = objects.inline_map_reduce(map, reduce, query={"location": {"$within" : {"$box" : bounds}}})

for set in sets:
    print set
    for attribute in sets[set]:
        for value_x in attribute["value"]:
            for set_y in sets:
                for attribute_y in sets[set_y]:
                    for value_y in attribute_y["value"]:
                        my_pearson = pearson(attribute["value"][value_x], attribute_y["value"][value_y])
                        if fabs(my_pearson) > 0.9 and my_pearson != 2.0 and value_x != value_y:
                            print "\t"+set+" - "+attribute["_id"]+" - "+value_x+" <---> "+set_y+" - "+attribute_y["_id"]+" - "+value_y+": "+str(my_pearson)


