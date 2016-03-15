var mapFirstDraw = true;
var map;
function getWeather(lat, lon)
{
	// get current weather conditions 
	var weatherGetURL = "https://dustyspringfield.airmanopus.net:8000?lat=" + lat + "&lon="  + lon;
	var weatherGet = new XMLHttpRequest();
	weatherGet.addEventListener('load', weatherTransferComplete, false);
	weatherGet.open('GET',weatherGetURL,true);
	weatherGet.send();

	function weatherTransferComplete()
	{
		var weatherResponse = JSON.parse(weatherGet.responseText);
		console.log(weatherGet.statusText);
		console.log(weatherResponse);

		var state = weatherResponse.state;						// 2 letter abbrev
		var countyBasename = weatherResponse.county.basename; 	// 'Milwaukee' or 'Bossier'
		var countyName = weatherResponse.county.name;		  	// 'Milwaukee County' or 'Bossier Parish'

		var weatherIconDiv = document.getElementById("weatherIcon");
		weatherIconDiv.innerHTML = "<img src='" + weatherResponse.weather.icon + "' alt='" + "Icon " + weather.description + "'></img>";

		var weatherTextDiv = document.getElementById("weatherText");
		weatherTextDiv.innerHTML = weatherResponse.weather.city + ", " + weatherResponse.weather.state + "<br>";
		weatherTextDiv.innerHTML += weatherResponse.county.name + "<br>";
		weatherTextDiv.innerHTML += lat + ", " + lon + "<br>";
		weatherTextDiv.innerHTML += weatherResponse.weather.description + " and " + weatherResponse.weather.tempF + "\xB0" + "F<br>";
		if (weatherResponse.weather.precip !== null)
		{
			weatherTextDiv.innerHTML += "Precip " + weatherResponse.weather.precip + "<br>";
		}
		weatherTextDiv.innerHTML += "Humiditity %" + weatherResponse.weather.humidity + "<br>";
		weatherTextDiv.innerHTML += "Wind " + weatherResponse.weather.windDir + " at " + weatherResponse.weather.windSpeed + " mph<br>";
		if (weatherResponse.weather.windChill !== null) 
		{
			if (weatherResponse.weather.tempF <= 40)
			{
				weatherTextDiv.innerHTML += "Wind Chill " + weatherResponse.weather.windChill + "\xB0" + "F<br>"; 
			}
		}	

		if (weatherResponse.weather.heatIndex !== null) 
		{
			if (weatherResponse.weather.tempF >= 70)
			{
				weatherTextDiv.innnerHTML += "Heat Index " + weatherResponse.weather.heatIndex + "\xB0" + "F<br>"; 
			}
		}
		weatherTextDiv.innerHTML += "Visibility " + weatherResponse.weather.visibility + " mi<br>";	

		var observationTime = moment(weatherResponse.weather.obsTime, 'YYYY-MM-DD hh:mm am pm');
		var updatedWhen = observationTime.fromNow();
		weatherTextDiv.innerHTML += "Updated " + updatedWhen + "<br>";
		displayRadarImages(state);

		// https://alerts.weather.gov/cap/pdf/CAP%20v12%20guide%20web%2006052013.pdf
		var numAlerts = weatherResponse.alerts.length;
		var alerts = [];
		var polygons = [];
		var TORNADO = '#FF0000';
		var THUNDERSTORM = '#FF0000';
		var FLOOD = '#00FF00';
		var MARINE = '#FF9900';
		var DEFAULT_COLOR = '#000000';
		var WIND = '#990099';

		var identifiers = [];
		document.getElementById('alerts').innerHTML = '';
		if (weatherResponse.alerts.length !== 0) {
			if (weatherResponse.alerts[0] !== null) {
				for (var i=0; i < numAlerts; i++) {
					var alertInfoAreaDesc = weatherResponse.alerts[i].alert.info[0].area[0];
					var alertPolygon = weatherResponse.alerts[i].alert.info[0].area[0].polygon[0];
					var alertCounties = weatherResponse.alerts[i].alert.info[0].area[0].areaDesc[0];
					var alertMsgType = weatherResponse.alerts[i].alert.msgType[0];
					var alertNote = weatherResponse.alerts[i].alert.note[0]; 
					var alertScope = weatherResponse.alerts[i].alert.scope[0];
					var alertSent = weatherResponse.alerts[i].alert.sent[0];
					var alertStatus = weatherResponse.alerts[i].alert.status[0];
					var alertIdentifier = weatherResponse.alerts[i].alert.identifier[0];
					// see http://alerts.weather.gov/cap/product_list.txt for the list of NWS products that might be sent
					// see http://www.ecfr.gov/cgi-bin/retrieveECFR?gp=&SID=005d56ac769e65d969fce03119c99e43&n=47y1.0.1.1.12&r=PART&ty=HTML
					// for the products and their 3-letter event codes
					//
					// we want to give categories of events their own polygon color
					var alertEvent = weatherResponse.alerts[i].alert.info[0].event[0];
					var alertEventCode = weatherResponse.alerts[i].alert.info[0].eventCode;
					
					var alertColor = DEFAULT_COLOR;
					if (alertEvent.search('Tornado') !== -1)
					{
						alertColor = TORNADO;
					} 
					if (alertEvent.search('Thunderstorm') !== -1)
					{
						alertColor = THUNDERSTORM;
					}
					if (alertEvent.search('Flood') !== -1)
					{
						alertColor = FLOOD;
					}
					if (alertEvent.search('Marine') !== -1)
					{
						alertColor = MARINE;
					}
					if (alertEvent.search('Wind') !== -1)
					{
						alertColor = WIND;
					}


					// TODO  also check the alert to see if it applies to the current US state.
					// this will be sort of a kludge until I can fix app.js to not return all of
					// the alerts that we've potentially previously viewed.
					// see issue #115, #120

					// only display the alert if it applies to the county we are in
					// and we haven't already displayed it
					var alreadyDisplayed = false;
					for (var b=0; b < identifiers.length; b++) {
						if (identifiers[b] === alertIdentifier) {
							alreadyDisplayed = true;
						}
					}

					if (alreadyDisplayed === false) {
						var matchedCountyName = alertCounties.search(countyBasename);
						if (matchedCountyName !== -1) {
							displayAlert(weatherResponse.alerts[i]);
							identifiers.push(alertIdentifier);
						}
					}

					// always display the polygon if there is one to display
					// even if it is in a different county within the same state
					var a = 0;
					while (typeof weatherResponse.alerts[i].alert.info[0].area[0].geocode[a] !== 'undefined') {
						if (weatherResponse.alerts[i].alert.info[0].area[0].geocode[a].valueName[0] === "UGC") {
							var ugcValue = weatherResponse.alerts[i].alert.info[0].area[0].geocode[a].value[0];
							var ugcState = ugcValue.substr(0,2);
							if (ugcState === weatherResponse.state) {
								if (alertPolygon !== '' && alertPolygon.length > 2) {
									drawPolygon(alertPolygon, alertColor);
								}
							}
						}
						a++;
					}

				}
			}
			weatherResponse = null;
		} else {
			document.getElementById("alerts").innerHTML += "<p>All clear: there are no active watches, warnings or advisories for your location.</p>";

		}

	}	
}

function drawPolygon(polygon, lineColor) {
	//console.log("enter drawPolygon");
	// draw this alert's polygon
	//console.log('drawPolygon', polygon); 
	var polygonCoords = [];
	polygonCoords[0] = polygon.split(' ');
	for(i=0; i < polygonCoords[0].length; i++) {
		var tmpLatLon = polygonCoords[0][i].split(',');
		var tmp = L.latLng(tmpLatLon[0],tmpLatLon[1]);
		polygonCoords[0][i] = tmp;
	}

	var polylineOptions = {
		color: lineColor,
		weight: '4',
		opacity: '2',
		fill: 'true',
		fillOpacity: '0.05',
		clickable: 'false'
	};
	var polyline = L.polyline(polygonCoords[0], polylineOptions).addTo(map);
	//console.log("exit drawPolygon");
}

function displayAlert(alertContents) {
		
		var timeSent = moment(alertContents.alert.sent[0]);
		var timeEffective = moment(alertContents.alert.info[0].effective[0]).format('dddd hh:mm A');
		var timeExpires = moment(alertContents.alert.info[0].expires[0]).format('dddd hh:mm A');

		
		console.log('displayAlert' + alertContents.alert.info[0].event[0]);
		console.log(alertContents.alert.identifier[0]);
		document.getElementById('alerts').innerHTML += '<pre>';
		document.getElementById('alerts').innerHTML += alertContents.alert.info[0].event[0] + '<br>';
		say(alertContents.alert.info[0].event[0]);
		document.getElementById('alerts').innerHTML += 'Effective beginning ' + timeEffective + ' until ' + timeExpires + '<br>'; 
		document.getElementById('alerts').innerHTML += alertContents.alert.info[0].senderName[0] + '<br>';
		document.getElementById('alerts').innerHTML += 'Areas affected include ' + alertContents.alert.info[0].area[0].areaDesc[0] + '<br>';
		document.getElementById('alerts').innerHTML += alertContents.alert.info[0].description[0] + '<br>';
		if (typeof alertContents.alert.note[0] !== undefined || alertContents.alert.note[0] === '') {
			document.getElementById('alerts').innerHTML += alertContents.alert.note[0] + '<br>';
		}
		if (alertContents.alert.info[0].instruction !== undefined) {
			if (alertContents.alert.info[0].instruction[0] !== '') {
				document.getElementById('alerts').innerHTML += alertContents.alert.info[0].instruction[0] + '<br>';
			}
		}
		document.getElementById('alerts').innerHTML += '</pre>';
}	

	
function displayRadarImages(currentState) 
{
	var lat = arguments[0];
	var lon = arguments[1];
	var usStates = {
		'AK': [' '],
		'AL': ['FL', 'GA', 'MS', 'TN'],
		'AR': ['LA', 'MO', 'MS', 'OK', 'TN', 'TX'],
		'AZ': ['CA', 'CO', 'NM', 'NV', 'UT'],
		'CA': ['NV', 'OR'], 
		'CO': ['KS', 'NE', 'NM', 'OK', 'UT', 'WY'],
		'CT': ['MA', 'NY', 'RI'],
		'DC': ['MD', 'VA'],
		'DE': ['MD', 'NJ', 'PA'],
		'FL': ['AL', 'GA'],
		'GA': ['NC', 'SC', 'TN', 'FL'],
		'HI': [' '],
		'IA': ['IL', 'MN', 'MO', 'NE', 'SD', 'WI'],
		'ID': ['MT', 'NV', 'OR', 'UT', 'WA', 'WY'],
		'IL': ['IN', 'KY', 'MO', 'WI'],
		'IN': ['KY', 'MI', 'OH'],
		'KS': ['CO', 'MO', 'NE', 'OK'],
		'KY': ['MO', 'OH', 'TN', 'VA', 'WV'],
		'LA': ['AR', 'MS', 'TX'],
		'MA': ['CT', 'NH', 'NY', 'RI', 'VT'],
		'MD': ['DC', 'PA', 'VA', 'WV'],
		'ME': ['NH'],
		'MI': ['IN', 'OH', 'WI'],
		'MN': ['IA', 'ND', 'SD', 'WI'],
		'MO': ['AR', 'IA', 'IL', 'KS', 'KY', 'NE', 'OK', 'TN'],
		'MS': ['LA', 'AR', 'TN', 'AL'],
		'MT': ['ID', 'ND', 'SD', 'NE', 'WY'],
		'NC': ['SC', 'TN', 'VA'],
		'ND': ['MN', 'SD', 'MT'],
		'NE': ['CO', 'IA', 'KS', 'MO', 'SD', 'WY'],
		'NH': ['VT', 'ME', 'MA'],
		'NJ': ['DE', 'PA', 'NY'],
		'NM': ['AZ', 'UT', 'CO', 'OK', 'TX'],
		'NV': ['CA', 'AZ', 'UT', 'ID', 'OR'],
		'NY': ['OH', 'MA', 'PA', 'CA'],
		'OH': ['IN', 'MI', 'PA', 'KY', 'WV'],
		'OK': ['AK', 'TX', 'NM', 'CO', 'KS', 'MO'],
		'OR': ['WA', 'ID', 'NV', 'CA'],
		'PA': ['OH', 'WV', 'MD', 'NJ', 'NY'],
		'RI': ['CT', 'MA', 'NY'],
		'SC': ['GA', 'NC'],
		'SD': ['ND', 'IA', 'NE', 'MN', 'MT', 'WY'],
		'TN': ['AK', 'MS', 'AL', 'GA', 'NC', 'VA', 'MO', 'AR'],
		'TX': ['NM', 'OK', 'AR', 'LA'],
		'UT': ['CO', 'NM', 'AZ', 'NV', 'ID', 'WY'],
		'VA': ['NC', 'KY', 'WV', 'MD'],
		'WA': ['ID', 'OR'],
		'WV': ['OH', 'PA', 'MD', 'KY'],
		'WI': ['IA', 'IL', 'MN', 'MI'],
		'WY': ['MT', 'SD', 'NE', 'CO', 'UT', 'ID']
	};


		var adjacentStates = [];		// states adj to where we are, we want radar for these too
		adjacentStates = usStates[currentState]; 
	
		// add the state we are in to the list of states we need to retreive radar pics from
		// the state we are in is adjacent to itself
		adjacentStates.push(currentState);

		// now we can make processed radar images from our server into map layers
		// once for each state and once for each radar site in a given state
		for (var s = 0; s < adjacentStates.length; s++)
		{
			singleStateRadar(adjacentStates[s]);
		}
		
		function singleStateRadar()
		{
			thisState = arguments[0];

			// these states dont have radar sites so we just ignore them
			var skipStates = [ 'CT', 'NH', 'RI' ];

			for (k=0; k < skipStates.length; k++) {
				if (thisState === skipStates[k]) {
				   return;
				}   	   
			}

			var stateKMLUrl = "https://www.airmanopus.net/weathercheck/kml/" + thisState + "_Radar_data.kml";
			var stateKMLfile = new XMLHttpRequest();
			stateKMLfile.addEventListener('load', stateKMLComplete, false);
			stateKMLfile.addEventListener('error', stateKMLError, false);
			stateKMLfile.open('GET',stateKMLUrl,true);
			stateKMLfile.send();

			function stateKMLComplete()
			{
				var stateKMLStatus = (stateKMLfile.statusText);
				var stateKMLDoc = stateKMLfile.responseXML;

				// how many radar sites in this state?
				var radarSites = stateKMLDoc.getElementsByTagName('href');
				var numRadarSites = radarSites.length;
		
				// holds urls to each individual site radar image 
				var radarLink;
		
				// each radar site gets its own layer and its own image bounds
				var imageBounds=[];
				var radarLayer;
			
				// holds lat and lon bounds the coverage of a single radar site
				var north, south, east, west;
	
				// get the latlonboxes each radar site
				for (var i = 0; i < numRadarSites; i++) 
				{
					radarLink = stateKMLDoc.getElementsByTagName('href')[i].textContent;
					north = stateKMLDoc.getElementsByTagName('north')[i].textContent;
					south = stateKMLDoc.getElementsByTagName('south')[i].textContent;
					east = stateKMLDoc.getElementsByTagName('east')[i].textContent;
					west = stateKMLDoc.getElementsByTagName('west')[i].textContent;
					imageBounds = [[south,west], [north,east]];

					radarLayer = L.imageOverlay(radarLink,imageBounds);

					// and add the radar image to the map
					map.addLayer(radarLayer);
				}
			}

			function stateKMLError()
			{
				console.log("error");
			}


		}	

}

function say()
{
	if (window.speechSynthesis !== undefined)
		{
			var instruction = arguments[0];
			var pitch = 1.7;
			var rate = 1.5;
			var volume = 1.0;

			var speechObject = new SpeechSynthesisUtterance(instruction);
			speechObject.volume = volume;
			speechObject.rate = rate;
			speechObject.pitch = pitch;
			window.speechSynthesis.speak(speechObject);

	}
}

function initialize(){

var lat;
var lon;

if (navigator.geolocation) {
	navigator.geolocation.watchPosition(function(position) {	
		if (mapFirstDraw)
		{
			// initialize and draw the map the first time
			lat = position.coords.latitude;
			lon = position.coords.longitude;
			map = L.mapbox.map('map', 'airmanopus.hm9c0o4f', {
				center: [lat, lon],
				zoom: 11,
				inertia: true,
				watch: true,
				enableHighAccuracy: false,
				maximumAge: 25000,
				trackResize: true,
				attributionControl : true,
				setView : true,
			});
			L.marker([lat, lon]).addTo(map);
			mapFirstDraw = false;
		} 
		
		// update map view to new location
		lat = position.coords.latitude.toPrecision(6);
		lon = position.coords.longitude.toPrecision(6);

		console.log("location updated to " + lat + "," + lon);
		// pan the map to current coordinates 
		map.setView([lat, lon]);
		
		// get weather
		getWeather(lat, lon);
		
	}); 
     } 
}

// handle errors here if we cannot get device location
function success(position) 
{
	console.log("Geolocation! YAY!"); // geolocation works
}

function error(msg) 
{
	document.getElementById("weather").innnerHTML = "Unable to determine your location, error " + msg.code;
	document.getElementById("weather").innerHTML += "You may need to enable geolocation on your device.";
}

if (navigator.geolocation) 
{
	navigator.geolocation.getCurrentPosition(success, error);
} else {
	error('Please enable location services.');
}
