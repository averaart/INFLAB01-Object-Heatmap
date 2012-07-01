import os
from flask import Flask, render_template
from upload import DataSetUploader

app = Flask(__name__)
module_dir = os.path.dirname(os.path.abspath(__file__))
app.config['TEMP_FOLDER'] = os.path.join(module_dir, "temp")

@app.route("/")
def main():
    return render_template('base.html')

@app.route('/upload-data-set', methods=['POST'])
def upload():
    dsu = DataSetUploader()
    dsu.upload()
    return render_template('base.html')


if __name__ == "__main__":
    app.run(debug=True)