/**
 * Created with PyCharm.
 * User: Maarten
 * Date: 19-6-12
 * Time: 16:29
 */

Grid = {

    tiles : new Array(), // stores all the tiles of the tiles
    map : null,         // holds the map
    columns: 10,        // number of colums of tiles
    rows: 10,           // number of rows of tiles

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
    addGridTileListener : function(t, data) {
        var infowindow = new google.maps.InfoWindow({
            content: 'sample',
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


AnalyzeResults = {

    correlations: new Array(),

    countAvgDeviationViolation: function() {
        if(this.correlations.length > 0) {
            var zone_violation_count = new Array();

            //initial value
            for (var i = 0; i < this.correlations[0].sub.length; i++) {
                zone_violation_count[i] = 0
            }

            //count violations of avg_deviation for each zone
            for (var j = 0; j < this.correlations.length; j++) {
                var threshold = this.correlations[j].pearsons - this.correlations[j].avg_deviation;
                for (var k = 0; k < this.correlations[j].sub.length; k++) {
                    if(this.correlations[j].sub[k] < threshold){
                        zone_violation_count[k]++;
                    }
                }
            }
            return zone_violation_count;
        }
    },

    fabricateCorrelation: function(item) {
        var c = Correlation;
        c.avg_deviation     = item["avg_deviation"];
        c.pearsons          = item["pearsons"];

        c.set_a.amountTotal = item["set_a"]["amount-total"];
        c.set_a.amountValue = item["set_a"]["amount-value"];
        c.set_a.attribute   = item["set_a"]["attribute"];
        c.set_a.set         = item["set_a"]["set"];
        c.set_a.value       = item["set_a"]["value"];

        c.set_b.amountTotal = item["set_b"]["amount-total"];
        c.set_b.amountValue = item["set_b"]["amount-value"];
        c.set_b.attribute   = item["set_b"]["attribute"];
        c.set_b.set         = item["set_b"]["set"];
        c.set_b.value       = item["set_b"]["value"];

        for (var i = 0; i < item["sub"].length; i++){
            c.sub[i] = item["sub"][i];
        }

        console.log(c.avg_deviation);
        console.log(c.pearsons);
        console.log(c.set_a.amountTotal);
        console.log(c.set_b.amountTotal);
        console.log(c.sub[2]);
        console.log('======');

        this.correlations.push(c);
    }
};


Correlation = {
    avg_deviation: 0,
    pearsons: 0,
    set_a: {
        amountTotal: 0,
        amountValue: 0,
        attribute: 0,
        set: '',
        value: ''
    },
    set_b: {
        amountTotal: 0,
        amountValue: 0,
        attribute: 0,
        set: '',
        value: ''
    },
    sub : new Array()


};