var mapFirstDraw = true;
var map;
function worldWeatherOnline()
{
	// get current weather conditions 
	var lat = arguments[0];
	var lon = arguments[1];
	var weatherGetURL = "https://dustyspringfield.airmanopus.net:8001?lat=" + lat + ","  + lon;
	var weatherGet = new XMLHttpRequest();
	weatherGet.addEventListener('load', weatherTransferComplete, false);
	weatherGet.open('GET',weatherGetURL,true);
	weatherGet.send();


	function weatherTransferComplete()
	{

		var weatherResponse = JSON.parse(weatherGet.responseText);
		var city = weatherResponse.city;
		var state = weatherResponse.state;
		var description = weatherResponse.description;
		var tempF = weatherResponse.tempF;
		var heatIndex = weatherResponse.heatIndex;
		var windDir = weatherResponse.windDir;
		var windSpeed = weatherResponse.windSpeed;
		var windChill = weatherResponse.windChill;
		var humidity = weatherResponse.humidity;
		var precip = weatherResponse.precip;
		var visibility = weatherResponse.visibility;
		var icon = weatherResponse.icon;

		document.getElementById("weather").innerHTML = city + ", " + state + "<br>";
		document.getElementById("weather").innerHTML += lat.toPrecision(8) + ", " + lon.toPrecision(8) + "<br>";
		document.getElementById("weather").innerHTML += description + " and " + tempF + "\xB0" + "F<br>";
		if (windChill !== null) 
		{
			if (tempF <= 40)
			{
				document.getElementById("weather").innnerHTML += "Wind Chill " + "\xB0" + "F<br>"; 
			}
		}	

		if (heatIndex !== null) 
		{
			if (tempF >= 70)
			{
				document.getElementById("weather").innnerHTML += "Heat Index " + "\xB0" + "F<br>"; 
			}
		}	
	}

}


function severeWeatherProducts()
{
	var lat = arguments[0];
	var lon = arguments[1];
	
	// get severe weather prodcuts from NWS
	var alertTextURL="https://dustyspringfield.airmanopus.net:8002?lat=" + lat + "&lon=" + lon;
	var alertText = new XMLHttpRequest();
	alertText.addEventListener('load', alertsTransferComplete, false);
	alertText.addEventListener('progress', alertsTransferProgress, false);
	alertText.addEventListener('error', alertsTransferFailed, false);
	alertText.open('GET',alertTextURL,true);
	alertText.send();
	
	function alertsTransferComplete()
	{
		console.log(alertText.statusText);
		console.log(alertText.responseText);
		var formatBullets = alertText.responseText.replace(/\*/g,"<br>*");		
		var formatProducts = formatBullets.replace("$$","$$<br><br>");
		document.getElementById("alerts").innerHTML = "<p>" + formatProducts + "</p>";
	}
	
	function alertsTransferProgress()
	{
		document.getElementById("alerts").innerHTML = "Checking for severe weather...";
	}

	function alertsTransferFailed()
	{
		document.getElementById("alerts").innerHTML = "";
	}

}


	

function displayRadarImages() 
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

	var geocodeURL="https://dustyspringfield.airmanopus.net:8003?lat=" + lat + "&lon=" + lon;
	var geocodeGet = new XMLHttpRequest();
	geocodeGet.addEventListener('load', geocodeGetComplete, false);
	geocodeGet.addEventListener('error', geocodeGetFailed, false);
	geocodeGet.open('GET',geocodeURL,true);
	geocodeGet.send();

	function geocodeGetComplete()
	{
		var state = JSON.parse(geocodeGet.responseText);
		var adjacentStates = [];		// states adj to where we are, we want radar for these too
		adjacentStates = usStates[state]; 
	
		// add the state we are in to the list of states we need to retreive radar pics from
		// the state we are in is adjacent to itself
		adjacentStates.push(state);

		// now we can make processed radar images from our server into map layers
		// once for each state and once for each radar site in a given state
		for (var s = 0; s < adjacentStates.length; s++)
		{
			singleStateRadar(adjacentStates[s]);
		}
		
		function singleStateRadar()
		{
			thisState = arguments[0];
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

	function geocodeGetFailed()
	{
		console.log("state name unavailable");
		return null;
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
		lat = position.coords.latitude;
		lon = position.coords.longitude;

		console.log("location updated to " + lat + "," + lon);
		// pan the map to current coordinates 
		map.setView([lat, lon]);
		
		// update weather conditions
		worldWeatherOnline(lat, lon);

		// update severe weather products
		severeWeatherProducts(lat, lon);

		// load the radar images
		displayRadarImages(lat, lon);

	
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
