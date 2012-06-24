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






//function fabricateCorrelation(item) {
//    var c = {};
//    c['avg_deviation     = item["avg_deviation"];
//    c['pearsons          = item["pearsons"];
//
//    c['set_a = {};
//    c['set_a.amountTotal = item["set_a"]["amount-total"];
//    c['set_a.amountValue = item["set_a"]["amount-value"];
//    c['set_a.attribute   = item["set_a"]["attribute"];
//    c['set_a.set         = item["set_a"]["set"];
//    c['set_a.value       = item["set_a"]["value"];
//
//    c['set_b = {};
//    c['set_b.amountTotal = item["set_b"]["amount-total"];
//    c.set_b.amountValue = item["set_b"]["amount-value"];
//    c.set_b.attribute   = item["set_b"]["attribute"];
//    c.set_b.set         = item["set_b"]["set"];
//    c.set_b.value       = item["set_b"]["value"];
//
//    c.sub = item["sub"];
//
//    return c;
//}

//
//Correlation = {
//    avg_deviation: 0,
//    pearsons: 0,
//    set_a: {
//        amountTotal: 0,
//        amountValue: 0,
//        attribute: 0,
//        set: '',
//        value: ''
//    },
//    set_b: {
//        amountTotal: 0,
//        amountValue: 0,
//        attribute: 0,
//        set: '',
//        value: ''
//    },
//    sub : new Array()
//
//
//};