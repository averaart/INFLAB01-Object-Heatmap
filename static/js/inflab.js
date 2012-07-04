/**
 * User: Maarten
 * Date: 1-7-12
 */

var minAbsCorr;
var maxAbsCorr;


/**
 * Keeper of all data! :P
 * After each analysis, the result is stored here.
 */
var data;

/**
 * I've got the Key, I've got the secreeeeet!...
 * Oh, ahem, sorry...
 *
 * This is the key of the element in "data" that is being inspected.
 * Look at the function showZoneDetails to see why.
 */
var key;

/**
 * Well..., the map. Duh!
 */
var map;

/**
 * The grid that gets drawn over the map
 */
var grid = {

    tiles : new Array(), // stores all the tiles of the tiles
    map : null,         // holds the map
    columns: null,        // number of colums of tiles
    rows: null,           // number of rows of tiles

    /**
     * Init this grid
     */
    init : function init(map, zones){
        this.map = map;
        this.columns = zones;
        this.rows = zones;
    },

    /**
     * Update settings
     */
    update : function update(zones){
        this.columns = zones;
        this.rows = zones;
    },

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
                r.my_number = j*this.columns+i;
                var zone = (j*this.columns+i);
                google.maps.event.addListener(r, 'click', function() {
                    showZoneDetails(this.my_number);
                });
                this.tiles[j*this.columns+i] = r;
            }
        }
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


initAnalysisPage = function(){
    /**
     * Initialize a Google maps map
     */
    initMap("map-area");

    /**
     * Init the pearson accuracy slider.
     */
    var pearsonAccuracy = 10;
    $( "#pearson-accuracy-value").html(pearsonAccuracy);
    $( "#pearson-accuracy-slider" ).slider({
        value: pearsonAccuracy,
        min: 3,
        max: 20,
        step: 1,
        slide: function(event, ui){
            $( "#pearson-accuracy-value" ).html( ui.value );
        }
    });

    /**
     * Init the zone size slider.
     */
    var zoneValue = 7;
    $( "#zone-size-value").html(zoneValue*zoneValue);
    $( "#zone-size-slider" ).slider({
        value: zoneValue,
        min: 2,
        max: 15,
        step: 1,
        slide: function(event, ui){
            $( "#zone-size-value" ).html( ui.value*ui.value );
        }
    });

    minAbsCorr = 0.5;
    maxAbsCorr = 1.0;
    $( "#absolute-pearson-range-value-1").html(minAbsCorr);
    $( "#absolute-pearson-range-value-2").html(maxAbsCorr);
    $( "#absolute-pearson-range-slider" ).slider({
        values: [minAbsCorr, maxAbsCorr],
        min: 0.0,
        max: 1.0,
        step: 0.1,
        slide: function(event, ui) {
            //
        }
    });

    /**
     * Init the data set and attributes selectors.
     */
    $.ajax({ url: "/collecties", type: 'POST' }).done(
        function( collectionData ) {
            var collections = eval(collectionData);

            /**
             * Init data set selectors
             */
            for (var i = 1; i <= 3; i++){
                $('#data-set-' + i ).select2({
                    placeholder: "Kies een dataset",
                    allowClear: true
                }).bind('change', function(){
                        if ($(this).val()){
                            var id = $(this).attr('id').split('-')[2];
                            $.post('/attributen', { set: $(this).val() }).done(
                                function( attributesData ){
                                    var attributes = eval( attributesData );
                                    if (attributes != undefined ){
                                        var select = $('#attributes-data-set-' + id);
                                        $(select).select2('enable')
                                            .empty()
                                            .append($('<option>'))
                                            .select2('val', {id: null, text: null});
                                        for (var i = 0; i < attributes.length; i++) {
                                            $(select).append($('<option>').val(attributes[i]).text(attributes[i]));
                                        }
                                    }
                                }
                            );
                        } else {
                            $('#attributes-data-set-' + $(this).attr('id').split('-')[2])
                                .empty()
                                .append($('<option>'))
                                .select2('val', {id: null, text: null})
                                .select2('disable');
                        }
                    });
                /**
                 * Add the options (collections) to the data set selectors.
                 */
                for (var j = 0; j < collections.length; j++) {
                    $('#data-set-' + i ).append($("<option>").val(collections[j]).text(collections[j]));
                }

                /**
                 *  Init attribute selectors for the current data set selector
                 */
                $('#attributes-data-set-' + i)
                    .select2({
                        placeholder: "Kies één of meerdere attributen",
                        allowClear: true
                    })
                    // Disable by default
                    .select2('disable')
                    // Check maximum number selections of five.
                    .bind('change', function(){
                        if($(this).val() && $(this).val().length > 5){
                            // Make it five selections instead of more.
                            $(this).select2('val', $(this).val().slice(0, 5));
                        }
                    });
            }
        }
    );


    /**
     * Init the grid
     */
    grid.init(map, $( "#zone-size-slider" ).slider('option','value'));



    $("#start-analysis").click(function() {
        // Clear current results in table
        $('#analysis-results').dataTable().fnClearTable();
        // Clear the current grid and update the grid with the most recent settings.
        grid.removeGrid();
        grid.update($( "#zone-size-slider" ).slider('option','value'));
        // Show loading image
        $("#loading-analysis-results").css('display', 'inline');
        // Request analysis results
        $.ajax({ url: '/analyseer', type: 'POST'}).done(
            function( response ) {
                $("#loading-analysis-results").css('display', 'none');
                data = $.parseJSON(response);
                var dataToAdd = [];
                // Push each result to data
                $.each(data, function(key, item){
                    dataToAdd.push([
                        item["set_a"]["set"]+"<br>" +
                            item["set_a"]["attribute"]+"<br>" +
                            item["set_a"]["value"] +"<br>",
                        item["set_b"]["set"]+"<br>" +
                            item["set_b"]["attribute"]+"<br>" +
                            item["set_b"]["value"] +"<br>",
                        parseFloat(item["pearsons"]).toFixed(3),
                        key
                    ]);
                });
                $('#analysis-results').dataTable().fnAddData(dataToAdd);

                // Hier iets met het opbouwen van dat raster??
                grid.buildGrid();
            });
    });




    /**
     * Make a data table of the results of the analysis.
     * It can sort on the third column (pearson correlation).
     */
    $.fn.dataTableExt.oStdClasses.sPagePrevEnabled = 'btn';
    $.fn.dataTableExt.oStdClasses.sPagePrevDisabled = 'btn disabled';
    $.fn.dataTableExt.oStdClasses.sPageNextEnabled = 'btn';
    $.fn.dataTableExt.oStdClasses.sPageNextDisabled = 'btn disabled';
    $('#analysis-results').dataTable({
        'aaSorting': [[ 2, 'desc' ]],
        'bPaginate': true,
        'aoColumnDefs': [
            { 'bSortable': false, 'aTargets': [ 0, 1 ] }
        ],
        "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
            var rgb = hsvToRgb((Number(aData[2])+1.0)*20+40, 60, 100);
            $('td:eq(2)', nRow).css( 'background-color', 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')');
//            $(this).bind('click', function(){console.log(iDisplayIndex + ' ' + iDisplayIndexFull)});
            rowKey = $('#analysis-results').dataTable()._(nRow)[0][3];
            $(nRow).bind('click', function(){showDetails($('#analysis-results').dataTable()._(this)[0][3])});
        }
    });
    $.fn.dataTableExt.afnFiltering.push(
        function( oSettings, aData, iDataIndex ) {
            var iMin = minAbsCorr;
            var iMax = maxAbsCorr;
            var pearson = Math.abs(aData[2]);
            return ( iMin <= pearson && pearson <= iMax );
        }
    );
    $('#absolute-pearson-range-slider').slider()
        .bind('slide', function(event, ui){
            console.log('asd');
            $( "#absolute-pearson-range-value-1" ).html( ui.values[0]);
            $( "#absolute-pearson-range-value-2" ).html( ui.values[1]);
            minAbsCorr = ui.values[0];
            maxAbsCorr = ui.values[1];
            $('#analysis-results').dataTable().fnDraw(true);
        });

    ////////////////////////////////////////
    // Hack the result table controls to  //
    // be displayed under the map         //
    ////////////////////////////////////////

    $('<div/>', { class: 'control-group' }).append($('#analysis-results_paginate'))
        .insertBefore($('#data-table-controls').find('.control-group').first());
    $('#analysis-results_paginate').addClass('controls');

    $('<label/>', { class: 'control-label'}).append('Pagineer')
        .insertBefore($('#analysis-results_paginate'));

    $('#analysis-results_paginate').append($('#analysis-results_info'));
    $('#analysis-results_info').addClass('help-block');


    $($('<div/>', { class: 'controls' }).appendTo($('#analysis-results_length')));
    $('#analysis-results_length')
        .addClass('control-group')
        .insertBefore($('#data-table-controls').find('.control-group').first())
        .find('select').first()
        .appendTo($('#analysis-results_length').find('.controls').first())
        .select2();
    $('#analysis-results_length')
        .find('label').first().attr('class', 'control-label').html('Aantal resultaten per pagina');




    $($('<div/>', { class: 'controls' }).appendTo($('#analysis-results_filter')));
    $('#analysis-results_filter')
        .addClass('control-group')
        .appendTo('#data-table-controls')
        .find('input').first()
            .appendTo($('#analysis-results_filter').find('.controls').first());
    $('#analysis-results_filter')
        .find('label').first().attr('class', 'control-label')
        .html("<i class='icon-question-sign' rel=\"popover\" data-original-title='Uitleg' " +
        "data-content='Dit zoekveld filtert de resultaten op de termen die hier ingevuld worden. Het is mogelijk om " +
        "meerdere termen in te voeren door ze te scheiden met een spatie.'></i> Zoek");

    ////////////////////////////////////////
    // End of hack                        //
    ////////////////////////////////////////


    /**
     * Initialize all tooltips
     */
    $('.icon-question-sign').popover();

};


function initMap(id) {
    var myLatlng = new google.maps.LatLng(51.9209866008, 4.47188401315);
    var options = {
        zoom: 15,
        center: myLatlng,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        disableDefaultUI: false,
        scrollwheel: true,
        draggable: true,
        navigationControl: true,
        mapTypeControl: false,
        scaleControl: true,
        disableDoubleClickZoom: false
    };
    map = new google.maps.Map(document.getElementById("map-area"), options);
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


function showDetails(combKey){
    key = combKey
    var pearson = data[combKey]["pearsons"];
    var sub = data[combKey]["sub"];
    var dev = data[combKey]["avg_deviation"];
    var diff = [];
    for (var field in sub){
        if (sub[field] == "X"){
            diff.push("X");
        } else {
            diff.push(sub[field]-pearson);
        }
    }
    for (var i in diff){
        var my_rectOpt;
        // if diff is either X, or within standard deviation
        if (diff[i] == "X") {
            my_rectOpt = {
                fillColor: "#000000",
                fillOpacity: 0.2
            };
        } else {
            if (diff[i] > dev){
                my_rectOpt = {
                    fillColor: "#00FF00",
                    fillOpacity: 0.5
                };
            } else if (diff[i] < -dev){
                my_rectOpt = {
                    fillColor: "#FF0000",
                    fillOpacity: 0.5
                };
            } else {
                my_rectOpt = {
                    fillOpacity: 0.0
                };
            }
        }

        grid.tiles[i].setOptions(my_rectOpt);
    }
}

function round(num, dec) {
    var result = Math.round(num*Math.pow(10,dec))/Math.pow(10,dec);
    return result;
}

function showZoneDetails(zone){
    var pearson = data[key]["pearsons"];
    var sub = data[key]["sub"];
    var dev = data[key]["avg_deviation"];

    var result = "<p>";
    result += "Algemene correlatie: "+round(pearson, 3)+"<br>";
    result += "Gemiddelde afwijking: +/-"+round(dev, 3)+"<br>";
    if (sub[zone]=="X"){
        result += "De gekozen combinatie komt in deze zone niet voor.<br>";
    } else {
        result += "Locale correlatie: "+round(sub[zone], 3)+"<br>";
    }
    result += "</p>";
    $("#zone-info-container").html(result);


    console.log(zone);
    var my_rectOpt;
    for (var i in grid.tiles){
        my_rectOpt = { strokeColor: "#000",
                       strokeWeight: 0.5};
        grid.tiles[i].setOptions(my_rectOpt);
    }
    my_rectOpt = { strokeColor: "#F00",
                   strokeWeight: 1};
    grid.tiles[zone].setOptions(my_rectOpt);
}