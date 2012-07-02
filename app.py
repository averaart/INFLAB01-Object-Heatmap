import os
from flask import Flask, render_template
from flask.globals import request
from analyze import Analyzer
from mongo_tools import MongoTools
from upload import DataSetUploader
import json

app = Flask(__name__)

@app.route("/")
def main():
    return render_template('home.html')

@app.route('/voeg-dataset-toe', methods=['GET', 'POST'])
def new_data_set():
    if request.method == 'POST':
        dsu = DataSetUploader()
        dsu.upload()
        # ToDo: add dynamic notification
        return render_template('upload.html', success=True)
    else:
        return render_template('upload.html')

@app.route('/analyseer', methods=['POST'])
def analyze():
    a = Analyzer()
    return json.dumps(a.analyze())

@app.route('/collecties', methods=['POST'])
def collections():
    mt = MongoTools()
    return str(mt.load_collections())

@app.route('/attributen', methods=['POST'])
def attributes():
    mt  = MongoTools()
    return str(mt.load_attributes(request.form['set']))


if __name__ == "__main__":
    app.run()