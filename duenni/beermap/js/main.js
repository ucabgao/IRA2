/* @flow */

//-----------------------------Map stuff---------------------------------
//Tile Provider
var mapbox_streets = new L.tileLayer('https://{s}.tiles.mapbox.com/v4/duenni.847e1c91/{z}/{x}/{y}.png?access_token='+apikey.mapbox+'',{
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> | <a href="https://www.mapbox.com/map-feedback/">Improve this map</a>'
});

var mapbox_satellite = new L.tileLayer('https://{s}.tiles.mapbox.com/v4/duenni.ng3a7ocm/{z}/{x}/{y}.png?access_token='+apikey.mapbox+'',{
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> | <a href="https://www.mapbox.com/map-feedback/">Improve this map</a>'
});

var mapbox_choropleth = new L.tileLayer('https://{s}.tiles.mapbox.com/v4/duenni.ngild633/{z}/{x}/{y}.png?access_token='+apikey.mapbox+'',{
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://www.mapbox.com/about/maps/">Mapbox</a> | <a href="https://www.mapbox.com/map-feedback/">Improve this map</a>'
});

var openstreetmap_mapnik = L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
	maxZoom: 19,
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
});

//Base map
var baseMaps = {
    "Mapbox Streets": mapbox_streets,
    "Mapbox Satellite": mapbox_satellite,
    "OpenStreetMap Mapnik": openstreetmap_mapnik,
    "Choropleth": mapbox_choropleth,
};

//Initialize map
var map = new L.map('map', {
    center: [20.0, 5.0],
    zoom: 2,
    worldCopyJump: true,
    layers: [mapbox_streets]
});

//Add Layer switcher to map
L.control.layers(baseMaps, null, {position: 'topleft'}).addTo(map);

//Change marker icon
var myIcon = L.icon({
    iconUrl: './images/bier24.png',
    iconRetinaUrl: './images/bier48.png',
    iconSize: [24, 24],
});

//-----------------------------EasyButton---------------------------------
//EasyButton Wiki
L.easyButton('fa fa-beer', 
    function (){
        window.open('http://www.massafaka.at/massawiki/doku.php?id=bierstats:uebersicht');
    },
 'Bieruebersicht'
).addTo(map);

//EasyButton Github
L.easyButton('fa fa-github', 
    function (){
        window.open('https://github.com/duenni/beermap');
    },
    'Github'
).addTo(map);

//EasyButton more stats
L.easyButton('fa fa-bar-chart', 
    function (){
        $('#modal-link')[0].click();
    },
    'More stats'
).addTo(map);

//-----------------------------Kimono---------------------------------
var marker;
var markergroup = L.layerGroup();
var loadboundaries;
//Use kimonolabs for scraping 
$.ajax({
    "url":"https://www.kimonolabs.com/api/6qium7f6?apikey="+apikey.kimonolabs,
    "crossDomain": true,
    "dataType": "jsonp",
    //Make a call to the Kimono API following the "url" 

    'success': function(response){ 
        //write api response to var
        var collection = response.results.bierherkunft;
        
        //read biere.json and generate markers and popups
        for (var i=0; i < markers.length; i++) 
        {
            for (var i = 0; i < collection.length; i++)
            {   
                //Iterate over all results and add them as markers to a layer group
                marker = L.marker( [markers[i].lat, markers[i].long], {icon: myIcon});
                marker.bindPopup('<i class="fa fa-flag"></i> <a target="_blank" href='+collection[i].name.href+'>'+collection[i].name.text+'</a> <br> <i class="fa fa-slack"></i> '+collection[i].anzahl);
                marker.addTo(markergroup);
            }
        }
        
        //---------------------------------Choropleth-----------------------------------------
        //Load GeoJSON file with country borders
        loadboundaries = L.geoJson(worldboundaries, {onEachFeature: onEachFeature});

        //throws an error when setStyle is used on L.geoJson so we wait until its ready
        loadboundaries.on('ready', loadboundaries.setStyle(function (feature) {
            return {
                fillColor: getColor(feature.properties.density),
                weight: 2,
                opacity: 1,
                color: 'white',
                dashArray: '3',
                fillOpacity: 0.7
            };
        }));

        //coloring the choropleth map
        function getColor(d) {
            return d > 1000 ? '#B10026' :
                   d > 100  ? '#E31A1C' :
                   d > 50   ? '#FC4E2A' :
                   d > 30   ? '#FD8D3C' :
                   d > 20   ? '#FEB24C' :
                   d > 10   ? '#FED976' :
                   d > 0    ? '#FFEDA0' :
                              '#FFFFCC';
        }

        //merge count data from api response so it can be used in getColor
        function onEachFeature(feature, layer) {
            feature.properties.density = 0;
            for (i in collection) {
                if(collection[i].name.text === feature.properties.name_de) {
                    feature.properties.density = parseInt(collection[i].anzahl);
                }
              }
              layer.bindPopup('<i class="fa fa-flag"></i> '+feature.properties.name_de+'<br> <i class="fa fa-slack"></i> '+feature.properties.density);
        }
        
        //legend for choropleth explaining color codes
        legend.onAdd = function (map) {
            var div = L.DomUtil.create('div', 'info legend'),
                grades = [1, 10, 20, 30, 50, 100, 1000],
                labels = [];

            // loop through our density intervals and generate a label with a colored square for each interval
            for (var i = 0; i < grades.length; i++) {
                div.innerHTML +=
                    '<i style="background:' + getColor(grades[i] + 1) + '"></i> ' +
                    grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
            }

            return div;
        };
        //-----------------------------Choropleth end----------------------------------
        
        //Calculate sum of all beers
        var sum = 0;
        for( var i = 0; i < collection.length; i++ ) 
        {
            sum += parseInt(collection[i].anzahl);
        }
        $( "#sum" ).html( '<i class="fa fa-folder-open">&nbsp;</i>Biere im Wiki: ' + sum );
    }
}); 

//Display marker group on initial load
map.on('load', markergroup.addTo(map));

//If selected layer is "Choropleth" display GeoJSON file
map.on('baselayerchange', baseLayerChange);

//legend when choropleth is displayed
var legend = L.control({position: 'bottomright'});

function baseLayerChange(event){
    if (event.name == 'Choropleth') {
        map.removeLayer(markergroup);
        map.addLayer(loadboundaries);
        legend.addTo(map);
    }
    else{
        map.removeLayer(loadboundaries);
        map.addLayer(markergroup);
        legend.removeFrom(map);
        }
};

//Modal content
function makeChart() {  
    $.ajax({
        url:"https://www.kimonolabs.com/api/ba3gx8yk?apikey="+apikey.kimonolabs,
        crossDomain: true,
        dataType: "jsonp",
        success: function (response) {
            //If calling the API was successful create a canvasjs chart
            var collection = response.results.biersorten;
            var finals = [];
            for(var i = 0; i < collection.length; i++)
            {
                finals.push({ 'y': parseInt(collection[i].anzahl), 'label': collection[i].sorte.text, 'link': collection[i].sorte.href });
            }
                    
            var chart = new CanvasJS.Chart("chartContainer",{
                animationEnabled: true,
                title:{
                    text: "Biersorten"
                },
                
                data: [
                {
                    type: "pie",
                    toolTipContent: '<a target="_blank" href={link}>{label}</a> <br> Anzahl: {y}',
                    dataPoints: finals
                }
                ]
            });
            chart.render();
        },
        error: function (xhr, status) {
            //handle errors
        }
    });
}

//Only render the chart when modal gets clicked
$(document).ready(function() {
    var clickLink = document.getElementById("modal-link");
    clickLink.addEventListener('click', makeChart);
});
