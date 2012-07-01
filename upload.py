#!/usr/bin/env python
import os
import shutil
import rd2gps
from flask import request
from pymongo.connection import Connection
from pymongo import GEO2D
import shpUtils


class DataSetUploader:

    def upload(self):
        shp = request.files['shp-file']
        dbf = request.files['dbf-file']
        data_set_name = request.form['data-set-name']

        if shp.filename and dbf.filename and data_set_name:
            # strip leading path from file name to avoid directory traversal attacks
            os.mkdir('temp')
            fnShp = os.path.basename(shp.filename)
            open('temp/' + fnShp, 'wb').write(shp.file.read())

            fnDbf = os.path.basename(dbf.filename)
            open('temp/' + fnDbf, 'wb').write(dbf.file.read())

            # this needs to be generalized
            connection = Connection()
            db = connection.opendata
            my_collection = db[data_set_name]
            my_collection.ensure_index([("location", GEO2D)])
            att_collection = db.attributes

            try:
                attributes = set()
                # load the shapefile
                shpRecords = shpUtils.loadShapefile('temp/' + fnShp)

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
                    for att in record["properties"].keys():
                        attributes.add(att)
                    my_collection.insert(record)
                attributes = {"_id":my_collection.name, "attributes":sorted(list(attributes))}
                att_collection.insert(attributes)
            except Exception:
                my_collection.drop()
            shutil.rmtree('temp')
