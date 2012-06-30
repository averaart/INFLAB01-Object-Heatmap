/**
 * Created with PyCharm.
 * User: Maarten
 * Date: 19-6-12
 * Time: 16:29
 */

// Little helper function
Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

Grid = {

    tiles : new Array(), // stores all the tiles of the tiles
    map : null,         // holds the map
    columns: 3,        // number of colums of tiles
    rows: 3,           // number of rows of tiles

    /**
     *
     * Build a grid overlay over the map.
     */
    buildGrid : function buildGrid() {

        var bounds = this.map.getBounds();

        var x = bounds.getSouthWest().lng();
        var y = bounds.getNorthEast().lat();
        var xDiff = (bounds.getNorthEast().lng() - x)/this.columns;
        var yDiff = (y - bounds.getSouthWest().lat())/this.rows;

        var rectOpt = {
            clickable: true,
            strokeColor: "#000",
            strokeOpacity: 1,
            strokeWeight: 0.5,
            fillColor: "#FF0000",
            fillOpacity: 0.0,
            map: this.map
        };

        for (var j = 0; j < this.rows; j++) {  // Goes vertical
            for (var i = 0; i < this.columns; i++) { // Goes horizontal
                // Create LatLngBounds for each tile.
                rectOpt.bounds = new google.maps.LatLngBounds(
                    new google.maps.LatLng(
                        y - Number(yDiff * j),
                        x + Number(xDiff * (i))
                    ),
                    new google.maps.LatLng(
                        y - Number(yDiff * (j+1)),
                        x + Number(xDiff * (i+1))
                    )
                );
                // Make Tile, store it, and add listener to it.
                var r = new google.maps.Rectangle(rectOpt);
                this.tiles[j*this.columns+i] = r;
                this.addGridTileListener(r, j*this.columns+i+1);
            }
        }
    },

    /**
     * Add a listener to a tile to display information about a tile.
     * @param t Rectangle Object
     * @param data The data to be displayed
     */
    addGridTileListener : function(t, tiledata) {
        var infowindow = new google.maps.InfoWindow({
            content: String(tiledata),
            position: t.bounds.getCenter()
        });
        google.maps.event.addListener(t, 'click', function() {
            infowindow.open(this.map);
        });
    },


    /**
     * Removes the grid from the map.
     */
    removeGrid : function() {
        for(var i = 0; i < this.tiles.length; i++){
            this.tiles[i].setMap(null);
        }
        this.tiles = new Array();
    }
};



function countAvgDeviationViolation(correlations) {
    if(Object.size(correlations) > 0) {
        var zone_violation_count = new Array();
        //initial value
        for (var i = 0; i < Math.pow($("#zones-val").html(),2); i++) {
            zone_violation_count[i] = 0;
        }

        //count violations of avg_deviation for each zone

        // each correlation
        for (var j in correlations){
            var lowerThreshold = correlations[j].pearsons - correlations[j].avg_deviation;
            var upperThreshold = correlations[j].pearsons + correlations[j].avg_deviation;
            // each zone
            for (var k = 0; k < correlations[j].sub.length; k++) {
                if(correlations[j].sub[k] != 'X' &&
                    (   correlations[j].sub[k] < lowerThreshold ||
                        correlations[j].sub[k] > upperThreshold))
                {
                    zone_violation_count[k] += 1;
                }
            }
        }
        return zone_violation_count;
    }
}

/**
 * HSV to RGB color conversion
 *
 * H runs from 0 to 360 degrees
 * S and V run from 0 to 100
 *
 * Ported from the excellent java algorithm by Eugene Vishnevsky at:
 * http://www.cs.rit.edu/~ncs/color/t_convert.html
 */
function hsvToRgb(h, s, v) {
    var r, g, b;
    var i;
    var f, p, q, t;

    // Make sure our arguments stay in-range
    h = Math.max(0, Math.min(360, h));
    s = Math.max(0, Math.min(100, s));
    v = Math.max(0, Math.min(100, v));

    // We accept saturation and value arguments from 0 to 100 because that's
    // how Photoshop represents those values. Internally, however, the
    // saturation and value are calculated from a range of 0 to 1. We make
    // That conversion here.
    s /= 100;
    v /= 100;

    if(s == 0) {
        // Achromatic (grey)
        r = g = b = v;
        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    h /= 60; // sector 0 to 5
    i = Math.floor(h);
    f = h - i; // factorial part of h
    p = v * (1 - s);
    q = v * (1 - s * f);
    t = v * (1 - s * (1 - f));

    switch(i) {
        case 0:
            r = v;
            g = t;
            b = p;
            break;

        case 1:
            r = q;
            g = v;
            b = p;
            break;

        case 2:
            r = p;
            g = v;
            b = t;
            break;

        case 3:
            r = p;
            g = q;
            b = v;
            break;

        case 4:
            r = t;
            g = p;
            b = v;
            break;

        default: // case 5:
            r = v;
            g = p;
            b = q;
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
