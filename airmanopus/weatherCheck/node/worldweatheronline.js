var url = require("url");
var S = require("string");
var https = require("https");
var fs = require("fs");
var XMLHttpRequest = require("../../node_modules/xhr2");
var dotenv = require("../../node_modules/dotenv");
dotenv._getKeysAndValuesFromEnvFilePath("../../node_modules/weathercheck.env");
dotenv._setEnvs();
dotenv.load();

var APIKEY = process.env.APIKEY;
var HOSTNAME = process.env.HOSTNAME;
var KEY_LOCATION = process.env.KEY_LOCATION;
var CERT_LOCATION = process.env.CERT_LOCATION; 
var options = {
	key: fs.readFileSync(KEY_LOCATION),
	cert: fs.readFileSync(CERT_LOCATION)
};


var server = https.createServer(options,function(req, httpResponse) 
{
	var urlParts = url.parse(req.url, true, true);
	var queryStr = urlParts.query;
	var latLon = queryStr.lat;
	
	console.log(latLon);
	var inchesPerMM = 0.0393701;
	if (latLon !== undefined)
	{
		var weatherGetURL = 'https://api2.worldweatheronline.com/free/v2/weather.ashx?q=' + latLon + '&format=json&extra=localObsTime%2C%20isDayTime&num_of_days=1&date=today&includelocation=yes&show_comments=yes&key=' + APIKEY;
		var weatherGet = new XMLHttpRequest();
		weatherGet.addEventListener('load', wxTransferComplete, false);
		weatherGet.addEventListener('error', wxTransferError, false);
		weatherGet.open('GET',weatherGetURL,true);
		weatherGet.send();
	}


	function wxTransferComplete()
 	{
		console.log(weatherGet.statusText);
		console.log(weatherGetURL);
		var weatherResponse = JSON.parse(weatherGet.responseText);
		var weatherDesc = weatherResponse.data.weather[0].hourly[0].weatherDesc[0].value;
		var tempF = weatherResponse.data.weather[0].hourly[0].tempF;
		var visibility = weatherResponse.data.weather[0].hourly[0].visibility;
		var humidity = weatherResponse.data.weather[0].hourly[0].humidity;
		var precipMM = weatherResponse.data.weather[0].hourly[0].precipMM;
		var windSpeed = weatherResponse.data.weather[0].hourly[0].windspeedMiles;
		var windDir = weatherResponse.data.weather[0].hourly[0].winddir16Point;
		var city = weatherResponse.data.nearest_area[0].areaName[0].value;
		var state = weatherResponse.data.nearest_area[0].region[0].value;
		var windChill = weatherResponse.data.weather[0].hourly[0].WindChillF;
		var heatIndex = weatherResponse.data.weather[0].hourly[0].HeatIndexF;
		var weatherIcon = weatherResponse.data.weather[0].hourly[0].weatherIconUrl[0].value;
	
		var precipIn = null;
		if (precipMM >=0.1)
		{
			precipIn = (precipMM * inchesPerMM).toPrecision(1);
		}
 

		var currentConditions = {
			"description"   : weatherDesc,
			"tempF"         : tempF,
			"windChill"     : windChill,
			"heatIndex"     : heatIndex,
			"visibility"    : visibility,
			"humidity"      : humidity,
			"precip"        : precipIn,
			"windSpeed"     : windSpeed,
			"windDir"       : windDir,
			"city"          : city,
			"state"         : state,
			"icon"          : weatherIcon
		};

		console.log(currentConditions);

		httpResponse.writeHead(200, {
			'Content-Type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Request-Method': '*',
			'Cache-control': 'no-cache',
			'Connection': 'keep-alive'
		});
		httpResponse.write(JSON.stringify(currentConditions) + '\n');
		httpResponse.end();


        }

	function wxTransferError()
	{
		console.log("An error occurred");
	}

});

server.listen(8001, HOSTNAME);

console.log("Server is listening on 8001");

