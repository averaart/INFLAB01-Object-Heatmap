/**
 * Created with PyCharm.
 * User: Maarten
 * Date: 19-6-12
 * Time: 16:29
 */

AnalyzeResults = {

    grid : new Array(), // stores all the tiles of the grid
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
                this.grid[j*this.columns+i] = r;
                this.addGridTileListener(r, j*this.columns+i);
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
            content: 'sample data',
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
        for(var i = 0; i < this.grid.length; i++){
            this.grid[i].setMap(null);
        }
        this.grid = new Array();
    }

};
