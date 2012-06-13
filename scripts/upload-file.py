#!/usr/bin/env python
import shutil

__author__ = 'Maarten'
import cgi, os
import cgitb; cgitb.enable()
from pymongo import Connection, GEO2D
import shpUtils
import rd2gps
import shutil

try: # Windows needs stdio set for binary mode.
    import msvcrt
    msvcrt.setmode (0, os.O_BINARY) # stdin  = 0
    msvcrt.setmode (1, os.O_BINARY) # stdout = 1
except ImportError:
    pass

form = cgi.FieldStorage()

# A nested FieldStorage instance holds the file
shp = form['shp']
dbf = form['dbf']
coll = form['collection'].value


# Test if the file was uploaded
if shp.filename and dbf.filename:

    os.mkdir('upload')
    # strip leading path from file name to avoid directory traversal attacks
    fnShp = os.path.basename(shp.filename)
    open('upload/' + fnShp, 'wb').write(shp.file.read())
    message = '1'

    fnDbf = os.path.basename(dbf.filename)
    open('upload/' + fnDbf, 'wb').write(dbf.file.read())
    message = '2'

    # this needs to be generalized
    connection = Connection()
    db = connection.opendata
    my_collection = db[coll]
    my_collection.ensure_index([("location", GEO2D)])
    att_collection = db.attributes

    try:
        attributes = set()

        # load the shapefile
        shpRecords = shpUtils.loadShapefile('upload/' + fnShp)

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

else:
    print "Status: 303 See other"
    print "Location: /"
    print



#print """\
#Content-Type: text/html\n
#<html><body>
#<p>%s</p>
#</body></html>
#""" % (message,)