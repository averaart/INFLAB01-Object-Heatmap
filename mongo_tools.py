import cgi
from bson.code import Code

__author__ = 'averaart', 'Maarten'
from pymongo import Connection

class MongoTools():

    def load_collections(self):
        connection = Connection()
        db = connection.opendata
        collections = db.collection_names()

        collections = [str(collection) for collection in collections]
        # Some collections we don't want to see, so remove them from the list.
        excl = ['system.indexes', 'objects', 'new_objects', 'attributes']
        for name in excl:
            if name in collections:
                collections.remove(name)

        return sorted(collections, key=str.lower)

    def load_attributes(self, set):
        connection = Connection()
        db = connection.opendata
        att_coll = db.attributes

        if not set:
            return ""

        doc = att_coll.find_one({"_id":set})
        if doc is None:
            attributes = ""
        else:
            attributes = [str(att) for att in doc['attributes']]

        return attributes
