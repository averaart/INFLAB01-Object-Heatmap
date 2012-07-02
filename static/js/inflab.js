/**
 * User: Maarten
 * Date: 1-7-12
 */

initAnalysisPage = function(){
    /**
     * Initialize a Google maps  map
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
        max: 50,
        step: 1,
        slide: function(event, ui){
            $( "#pearson-accuracy-value" ).html( ui.value );
        }
    });

    /**
     * Init the zone size slider.
     */
    var zoneValue = 7;
    $( "#zone-size-value").html(zoneValue);
    $( "#zone-size-slider" ).slider({
        value: zoneValue,
        min: 3,
        max: 50,
        step: 1,
        slide: function(event, ui){
            $( "#zone-size-value" ).html( ui.value );
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

    $("#start-analysis").click(function() {
        $("#loading-analysis-results").css('display', 'block');
        $.ajax({ url: '/analyseer', type: 'POST'}).done(
            function( data ) {
                $("#loading-analysis-results").css('display', 'none');
                data = $.parseJSON(data);
                var dataToAdd = [];
                $.each(data, function(key, item){
                    dataToAdd.push([
                        1,
                        item["set_a"]["set"]+"<br>" +
                            item["set_a"]["attribute"]+"<br>" +
                            item["set_a"]["value"] +"<br>",
                        item["set_b"]["set"]+"<br>" +
                            item["set_b"]["attribute"]+"<br>" +
                            item["set_b"]["value"] +"<br>",
                        parseFloat(item["pearsons"]).toFixed(3)
                    ]);
                });
                $('#analysis-results').dataTable().fnAddData(dataToAdd);
            });
    });




    /**
     * Make a data table of the results of the analysis.
     * It can sort on the third column (pearson correlation).
     */
    $('#analysis-results').dataTable({
        'aaSorting': [[ 3, 'desc' ]],
        'bPaginate': false,
        'bFilter': false,
        'aoColumnDefs': [
            { 'bSortable': false, 'aTargets': [ 0, 1, 2 ] }
        ],
        "fnRowCallback": function( nRow, aData, iDisplayIndex, iDisplayIndexFull ) {
            console.log((Number(aData[3])+1.0)*60);
            var rgb = hsvToRgb((Number(aData[3])+1.0)*20+40, 100, 100);
            $('td:eq(3)', nRow).css( 'background-color', 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')');
        }
    });
}







var map;
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