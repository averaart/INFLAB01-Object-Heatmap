__author__ = 'averaart', 'Maarten'

import math
from logging import *
import urllib
from flask import request
from bson.code import Code
from pymongo import Connection
from pearson import Pearson

class Analyzer():

    def analyze(self):
        basicConfig(level=DEBUG,
            format='%(asctime)s %(levelname)-8s %(message)s',
            datefmt='%m-%d %H:%M',
            filename='debug.log')

        f = request.form

        # sets_request is a dictionary. Each key is the name of a set. Each value is a list of attribute-names.
        # This should, of course, be supplied via GET or POST values later on.
        request_sets = {"Speeltoestellen": ["TYPE", "MATERIAAL"]}
        if f.has_key('sets'):
            request_sets = eval(f['sets'])


        # bounds defines the area that's being examined.
        # The two tuples indicate lower-left and upper-right corners of the area.
        #
        bounds = ((51.91434265748467, 4.461112261746166), (51.92762956096251, 4.482655764553783))  # <---- 1km3 gebied
        #bounds = ((50.0, 3.0), (52.0, 5.0)) # <---- TEST
        #bounds = ((51.807766, 4.286041), (51.967962, 4.700775)) # <---- Rotterdam
        if f.has_key('bounds'):
            bounds = eval(urllib.url2pathname(f["bounds"]))


        # raster_size defines how many fields the raster has on ONE side.
        # A value of 20 would result in a raster of (20 * 20 =) 400 fields.
        # This means that the pearson's formula will be called with lists of 400 elements each.
        raster_size = 10
        if f.has_key('rasterSize'):
            raster_size = int(f["rasterSize"])

        zones = 10
        if f.has_key('zones'):
            zones = int(f["zones"])
        elif f.has_key('rasterSize'):
            zones = int(f["rasterSize"])



        #print "Het hele gebied"
        sets = self.map_sets(bounds, request_sets, raster_size)

        macro_correlations = self.build_correlations(sets)
        #macro_correlations = dict((k, cor) for k, cor in macro_correlations.iteritems() if fabs(cor["pearsons"])>threshold and cor["pearsons"]!=2.0)

        for cor in macro_correlations:
            macro_correlations[cor]["sub"] = []

        #print "En nu voor de verdeling"

        width = (bounds[1][1]-bounds[0][1]) / zones
        height = (bounds[1][0]-bounds[0][0]) / zones

        for y in range(zones):
            for x in range(zones):

            #        print "Vlak "+str(zones*y+(x+1))

                sub_bounds = (
                    (bounds[1][0]-((y+1)*height),bounds[0][1]+(x*width)),
                    (bounds[1][0]-(y*height),bounds[0][1]+((x+1)*width))
                    )
                sub_sets = self.map_sets(sub_bounds, request_sets, raster_size)

                for cor in macro_correlations:
                    macro_correlations[cor]["sub"].append("X")

                if not all(sub_sets.values()):
                    continue

                sub_correlations = self.build_correlations(sub_sets)

                for sub_cor in sub_correlations:
                    if sub_correlations[sub_cor]["pearsons"] == 2: continue
                    if macro_correlations.has_key(sub_cor):
                        cor = macro_correlations[sub_cor]
                        last_index = len(cor["sub"])-1
                        cor["sub"][last_index] = sub_correlations[sub_cor]["pearsons"]
                    else:
                        reverse = "_".join(reversed(sub_cor.split('_')))
                        if macro_correlations.has_key(reverse):
                            cor = macro_correlations[reverse]
                            last_index = len(cor["sub"])-1
                            cor["sub"][last_index] = sub_correlations[sub_cor]["pearsons"]


        for cor in macro_correlations:
            sub = [x for x in macro_correlations[cor]['sub'] if x != "X"]
            dev = [(x-macro_correlations[cor]["pearsons"])**2 for x in sub]
            if len(sub) < 1:
                continue
            avg_dev = math.sqrt((1.0/len(sub))*sum(dev))
            macro_correlations[cor]["avg_deviation"]=avg_dev

        return macro_correlations


    def map_sets(self, bounds, request_sets, raster_size):
        connection = Connection()
        db = connection.opendata
        sets = {}

        # determine the width and height of one raster field
        width = (bounds[1][1]-bounds[0][1]) / raster_size
        height = (bounds[1][0]-bounds[0][0]) / raster_size

        # Pearson's correlation coefficient takes two 1D lists.
        # Therefore, the raster will be mapped into a list, starting top left to right,
        # then moving down row for row. In a 5x5 raster, element 20 would represent the lower left corner (zero-based!)

        # for each dataset in "sets_request" a separate map/reduce query will be run
        for request_set in request_sets:
            objects = db[request_set]
            attributes = request_sets[request_set]

            # The first part of the map function determines in what raster-field the object is located, stored as "index"
            # Then, for each attribute in "request" emit() is called with the value of the attribute and its place in the list.
            map = """
            function (){
                var attributes = """+str(attributes)+""";
                var lat = this.location.lat;
                var lng = this.location.lon;
                var rel_lat = lat - """+str(bounds[0][0])+""";
                var rel_lng = lng - """+str(bounds[0][1])+""";
                var y = Math.floor(rel_lat / """+str(height)+""");
                var x = Math.floor(rel_lng / """+str(width)+""");
                var index = x + (y * """+str(raster_size)+""");
                var length = """+str(raster_size**2)+""";
                for (i in attributes){
                    var key = { attribute: attributes[i], value: this.properties[attributes[i]] };
                    var fields = new Array();
                    for (var i=0; i<length; i++){
                        if (i==index){
                            fields.push(1);
                        } else {
                            fields.push(0);
                        }
                    }
                    emit(key, { fields: fields });
                }
                var key = { attribute: "TOTAAL", value: "TOTAAL" }
                var fields = new Array();
                for (var i=0; i<length; i++){
                    if (i==index){
                        fields.push(1);
                    } else {
                        fields.push(0);
                    }
                }
                emit(key, { fields: fields });
            }
            """

    #        print map
            map = Code(map)

            # The emit() calls by the map function result in calls of the reduce function for each unique key (in this case
            # the attribute-names) followed by a list of values from each emit() for that unique key.
            # The reduce function builds an array for each possible value, where each element of the array represents a field
            # on the raster. All elements are set to zero. Then all occurrences of that value are counted for each field.
            reduce = """
            function (key, values) {
                var length = """+str(raster_size**2)+""";
                var fields = new Array();
                for (var i=0; i<length; i++){
                    fields.push(0);
                }
                for(var i in values) {
                    for (var j=0; j<length; j++){
                        fields[j]+=values[i].fields[j];
                    }
                }

                return {fields: fields};
            }
            """

    #        print
    #        print reduce
            reduce = Code(reduce)

            # sets is a dictionary where the key is the name of a data-set and the value is a list of dictionaries.
            # In each dictionary, "_id" contains the name of an attribute and "value" contains a new dictionary.
            # The innermost dictionary has possible values for the aforementioned attribute as keys, and the list of counts of
            # that value for each raster_field.
            sets[request_set] = objects.inline_map_reduce(map, reduce, query={"location": {"$within" : {"$box" : bounds}}})

        result = {}

        for set in sets:
            result[set]={}
            for comb in sets[set]:
                if not result[set].has_key(comb['_id']['attribute']):
                    result[set][comb['_id']['attribute']] = {}
                if not result[set][comb['_id']['attribute']].has_key(comb['_id']['value']):
                    result[set][comb['_id']['attribute']][comb['_id']['value']] = comb['value']['fields']

        return result

    def build_correlations(self, sets):
        # Here the script loops through all acquired lists (by looping through data-sets, attributes and their possible values)
        # and runs the pearson function against all acquired lists (including itself).
        pearson = Pearson()
        correlations = {}

        for set_i, set_x in enumerate(sets):
            set_total_x = sets[set_x]["TOTAAL"]["TOTAAL"]
            for att_i, attribute_x in enumerate(sets[set_x]):
                if attribute_x == "TOTAAL":
                    continue
                for val_i, value_x in enumerate(sets[set_x][attribute_x]):
                    for set_j, set_y in enumerate(sets):
                        set_total_y = sets[set_y]["TOTAAL"]["TOTAAL"]
                        set_total = [sum(pair) for pair in zip(set_total_x, set_total_y)]
                        count_x = [val for enum, val in enumerate(sets[set_x][attribute_x][value_x]) if set_total[enum]>0]
                        if len(count_x)<=1:
                            continue
                        for att_j, attribute_y in enumerate(sets[set_y]):
                            if attribute_y == "TOTAAL":
                                continue
                            for val_j, value_y in enumerate(sets[set_y][attribute_y].keys()[:val_i+1]):
                                if set_x == set_y and attribute_x == attribute_y and value_x == value_y:
                                    continue
                                count_y = [val for enum, val in enumerate(sets[set_y][attribute_y][value_y]) if set_total[enum]>0]
                                if len(count_y)<=1:
                                    continue
                                my_pearson = pearson.calculate(count_x, count_y)
                                if my_pearson == 2:
                                    continue
                                key = str(set_x)+"-"+str(attribute_x)+"-"+str(value_x)+"_"+str(set_y)+"-"+str(attribute_y)+"-"+str(value_y)
                                correlations[key] = ({"set_a":{"set":set_x,
                                                              "attribute":attribute_x,
                                                              "value":value_x,
                                                              "amount-value": sum(count_x),
                                                              "amount-total": sum(set_total_x)},
                                                     "set_b":{"set":set_y,
                                                              "attribute":attribute_y,
                                                              "value":value_y,
                                                              "amount-value": sum(count_y),
                                                              "amount-total": sum(set_total_y)},
                                                     "pearsons":my_pearson})
        return correlations