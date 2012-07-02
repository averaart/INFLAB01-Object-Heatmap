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
        ]
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