#!/usr/bin/python
from pprint import pprint

__author__ = 'averaart'

from logging import *
from pymongo import Connection
from bson.code import Code
from pearson import pearson
from math import fabs
import simplejson, json

basicConfig(level=DEBUG,
    format='%(asctime)s %(levelname)-8s %(message)s',
    datefmt='%m-%d %H:%M',
    filename='debug.log')

connection = Connection()
db = connection.opendata

# request is a dictionary. Each key is the name of a set. Each value is a list of attribute-names.
# This should, of course, be supplied via GET or POST values later on.
request = {"speeltoestellen": ["TYPE"],
           "CivieleKunstwerken": ["TYPE"]}

# threshold indicates the lowest absolute correlation figure to report
threshold = 0.7

# bounds defines the area that's being examined.
# The two tuples indicate lower-left and upper-right corners of the area.
# bounds = ((51.91434265748467, 4.461112261746166), (51.92762956096251, 4.482655764553783))  # <---- 1km3 gebied
bounds = ((51.807766, 4.286041), (51.967962, 4.700775)) # <---- Rotterdam

# raster_size defines how many fields the raster has on ONE side.
# A value of 20 would result in a raster of (20 * 20 =) 400 fields.
# This means that the pearson's formula will be called with lists of 400 elements each.
raster_size = 30

# determine the width and height of one raster field
width = (bounds[1][1]-bounds[0][1]) / raster_size
height = (bounds[1][0]-bounds[0][0]) / raster_size

# sets will store the results of any map/reduce queries
sets = {}



# Pearson's correlation coefficient takes two 1D lists.
# Therefore, the raster will be mapped into a list, starting top left to right,
# then moving down row for row. In a 5x5 raster, element 20 would represent the lower left corner (zero-based!)


# for each dataset in "request" a separate map/reduce query will be run
for request_set in request:
    objects = db[request_set]
    attributes = request[request_set]

    # The first part of the map function determines in what raster-field the object is located, stored as "index"
    # Then, for each attribute in "request" emit() is called with the value of the attribute and its place in the list.
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
        emit("TOTAAL",{"TOTAAL":1, index: index});
    }
    """)

    # The emit() calls by the map function result in calls of the reduce function for each unique key (in this case
    # the attribute-names) followed by a list of values from each emit() for that unique key.
    # The reduce function builds an array for each possible value, where each element of the array represents a field
    # on the raster. All elements are set to zero. Then all occurrences of that value are counted for each field.
    reduce = Code("""
    function (key, values) {
        var result = {};

        values.forEach(function(value) {
            if (!result[value.value]){
                result[value.value]=[]
                for (var i=0; i<"""+str(raster_size*raster_size)+"""; i++){
                    result[value.value][i]=0;
                }
            }
            result[value.value][value.index] += 1;
        });

        return result;
    }
    """)

    # sets is a dictionary where the key is the name of a data-set and the value is a list of dictionaries.
    # In each dictionary, "_id" contains the name of an attribute and "value" contains a new dictionary.
    # The innermost dictionary has possible values for the aforementioned attribute as keys, and the list of counts of
    # that value for each raster_field.
    sets[request_set] = objects.inline_map_reduce(map, reduce, query={"location": {"$within" : {"$box" : bounds}}})

#pprint(sets)

# Here the script loops through all acquired lists (by looping through data-sets, attributes and their possible values)
# and runs the pearson function against all acquired lists (including itself).

macro_correlations = []

for set in sets:
    for attribute in sets[set]:
        if attribute["_id"] == "TOTAAL": continue
        for ix, value_x in enumerate(attribute["value"]):
            for set_y in sets:
                for attribute_y in sets[set_y]:
                    if attribute_y["_id"] == "TOTAAL": continue
                    for iy, value_y in enumerate(attribute_y["value"]):
                        # So that we don't check connections in both directions
                        if set == set_y and attribute["_id"] == attribute_y["_id"] and ix >= iy:
                            continue
                        set_total_a = [att for att in sets[set] if att["_id"]=="TOTAAL"][0]["value"]["undefined"][:(raster_size**2)]
                        set_total_b = [att for att in sets[set_y] if att["_id"]=="TOTAAL"][0]["value"]["undefined"][:(raster_size**2)]
                        set_total = [sum(pair) for pair in zip(set_total_a, set_total_b)]
                        set_att_a = [val for enum, val in enumerate(attribute["value"][value_x]) if set_total[enum-1]>0]
                        set_att_b = [val for enum, val in enumerate(attribute_y["value"][value_y]) if set_total[enum-1]>0]
                        my_pearson = pearson(attribute["value"][value_x], attribute_y["value"][value_y])
                        macro_correlations.append({"set_a":{"set":set,
                                                            "attribute":attribute["_id"],
                                                            "value":value_x},
                                                   "set_b":{"set":set_y,
                                                            "attribute":attribute_y["_id"],
                                                            "value":value_y},
                                                   "pearsons":my_pearson})
#                        if fabs(my_pearson) > 0.5 and my_pearson != 2.0 and value_x != value_y:
#                            print "\t"+set+" - "+attribute["_id"]+" - "+value_x+" <---> "+set_y+" - "+attribute_y["_id"]+" - "+value_y+": "+str(my_pearson)


macro_correlations = [cor for cor in macro_correlations if fabs(cor["pearsons"])>threshold and cor["pearsons"]!=2.0]

print "Content-type: application/json"
print
print json.dumps(macro_correlations)