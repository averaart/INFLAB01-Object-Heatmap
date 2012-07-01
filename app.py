import os
from flask import Flask, render_template
from flask.globals import request
from upload import DataSetUploader

app = Flask(__name__)

@app.route("/")
def main():
    return render_template('home.html')

@app.route('/voeg-dataset-toe', methods=['GET', 'POST'])
def newDataSet():
    if request.method == 'POST':
        dsu = DataSetUploader()
        dsu.upload()
        # ToDo: add dynamic notification
        return render_template('upload.html', success=True)
    else:
        return render_template('upload.html')

if __name__ == "__main__":
    app.run(debug=True)