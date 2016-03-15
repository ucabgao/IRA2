/**
 * @author steve noonan <airmanopus@gmail.com>
 * @description node.js module to determine a device's current US state, fetch current weather conditions
 * @description and fetch current national weather service weather alerts for the device's location
 * @param {number} latitude
 * @param {number} longitude
 * @returns {Object} json
 * @requires url
 * @requires string
 * @requires https
 * @requires fs
 * @requires request
 * @requires dotenv  
 * @requires raven @see https://app.getsentry.com/docs/platforms/node.js/
 */

var url = require("url");
var S = require("string");
var https = require("https");
var fs = require("fs");
var XMLHttpRequest = require("../../node_modules/xhr2");
var request = require('../../node_modules/request');
var parseString = require('../../node_modules/xml2js').parseString;
var _ = require('../../node_modules/underscore');
var raven = require('../../node_modules/raven');
var client = new raven.Client('https://25449728fcc84eb18b02b9567067a539:5c2e2f3bb20e405892017578ba99b770@app.getsentry.com/45867');
var dotenv = require("../../node_modules/dotenv");
dotenv._getKeysAndValuesFromEnvFilePath("../../node_modules/weathercheck.env");
dotenv._setEnvs();
dotenv.load();

var APIKEY = process.env.APIKEY;
var HOSTNAME = process.env.HOSTNAME;
var PORT = 8000;
var KEY_LOCATION = process.env.KEY_LOCATION;
var CERT_LOCATION = process.env.CERT_LOCATION; 
var options = {
	key: fs.readFileSync(KEY_LOCATION),
	cert: fs.readFileSync(CERT_LOCATION)
};

client.patchGlobal(); // raven

var usStates = [
                'Alabama'       ,
                'Alaska'        ,
                'Arizona'       ,
                'Arkansas'      ,
                'California'    ,
                'Colorado'      ,
                'Connecticut'   ,
                'Delaware'      ,
                'District of Columbia',
                'Florida'       ,
                'Georgia'       ,
                'Hawaii'        ,
                'Idaho'         ,
                'Illinois'      ,
                'Indiana'       ,
                'Iowa'          ,
                'Kansas'        ,
                'Kentucky'      ,
                'Louisiana'     ,
                'Maine'         ,
                'Maryland'      ,
                'Massachusetts' ,
                'Michigan'      ,
                'Minnesota'     ,
                'Mississippi'   ,
                'Missouri'      ,
                'Montana'       ,
                'Nebraska'      ,
                'Nevada'        ,
                'New Hampshire' ,
                'New Jersey'    ,
                'New Mexico'    ,
                'New York'      ,
                'North Carolina',
                'North Dakota'  ,
                'Ohio'          ,
                'Oklahoma'      ,
                'Oregon'        ,
                'Pennsylvania'  ,
                'Rhode Island'  ,
                'South Carolina',
                'South Dakota'  ,
                'Tennessee'     ,
                'Texas'         ,
                'Utah'          ,
                'Vermont'       ,
                'Virginia'      ,
                'Washington'    ,
                'West Virginia' ,
                'Wisconsin'     ,
                'Wyoming'       
        ];
var statesToAbbreviations = {
	'Alabama' 	: 'AL',
	'Alaska'  	: 'AK',
	'Arizona' 	: 'AZ',
	'Arkansas'	: 'AR',
	'California' 	: 'CA',
	'Colorado' 	: 'CO',
	'Connecticut' 	: 'CT',
	'Delaware' 	: 'DE',
	'District of Columbia' : 'DC',
	'Florida' 	: 'FL',
	'Georgia' 	: 'GA',
	'Hawaii' 	: 'HI',
	'Idaho' 	: 'ID',
	'Illinois' 	: 'IL',
	'Indiana' 	: 'IN',
	'Iowa'		: 'IA',
	'Kansas' 	: 'KS',
	'Kentucky' 	: 'KY',
	'Louisiana' 	: 'LA',
	'Maine' 	: 'ME',
	'Maryland' 	: 'MD',
	'Massachusetts' : 'MA',
	'Michigan' 	: 'MI',
	'Minnesota' 	: 'MN',
	'Mississippi' 	: 'MS',
	'Missouri' 	: 'MO',
	'Montana' 	: 'MT',
	'Nebraska' 	: 'NE',
	'Nevada' 	: 'NV',
	'New Hampshire' : 'NH',
	'New Jersey' 	: 'NJ',
	'New Mexico' 	: 'NM',
	'New York' 	: 'NY',
	'North Carolina': 'NC',
	'North Dakota' 	: 'NC',
	'Ohio' 		: 'OH',
	'Oklahoma' 	: 'OK',
	'Oregon' 	: 'OR',
	'Pennsylvania'	: 'PA',
	'Rhode Island' 	: 'RI',
	'South Carolina': 'SC',
	'South Dakota' 	: 'SD',
	'Tennessee' 	: 'TN',
	'Texas' 	: 'TX',
	'Utah' 		: 'UT',
	'Vermont' 	: 'VT',
	'Virginia' 	: 'VA',
	'Washington'	: 'WA',
	'West Virginia' : 'WV',
	'Wisconsin' 	: 'WI',
	'Wyoming' 	: 'WY'
	};



function ProductText(productResponse) {
	this.identifier		= productResponse[0].identifier[0];
	this.sentTime		= productResponse[0].sent[0];
	this.productStatus	= productResponse[0].status[0];
	this.msgType		= productResponse[0].msgType[0];
	this.note			= productResponse[0].note[0];
	this.category		= productResponse[0].info[0].category[0];
	this.eventType		= productResponse[0].info[0].event[0];
	this.urgency		= productResponse[0].info[0].urgency[0];
	this.severity		= productResponse[0].info[0].certainty[0];
	this.effective		= productResponse[0].info[0].effective[0];
	this.expires		= productResponse[0].info[0].expires[0];
	this.senderName		= productResponse[0].info[0].senderName[0];
	this.headline		= productResponse[0].info[0].headline[0];
	this.description	= productResponse[0].info[0].description[0];
	this.instruction	= productResponse[0].info[0].instruction[0];
	this.areaDesc		= productResponse[0].info[0].area[0].areaDesc[0];
	this.areaPolygon	= productResponse[0].info[0].area[0].polygon[0];
}

function ResponseObject(weather, state, county, alerts) {
	this.weather = weather;
	this.state	 = state;
	this.county  = county;
	this.alerts  = [];	

	// returns true if identifier is already in the list of alerts
	this.search = function (identifier) {
		for (var n=0; n < this.alerts.length; n++) {
			if (identifier === this.alerts[n].alert.identifier[0]) {
				return true;
			}
		}
	}
}

var serverResponse = new ResponseObject("","",[]);


/**
 * @description node.js https server
 * @param {string} ?lat=nn.nnnn&lon=-nnn.nnnn
 *
 */

var server = https.createServer(options,function(req, httpResponse) 
{
	var urlParts = url.parse(req.url, true, true);
	var queryStr = urlParts.query;
	var lat = queryStr.lat;
	var lon = queryStr.lon;
	console.log(lat,lon);

	process.on('uncaughtException', function (error) {
		console.log(error.stack);
	});

	httpResponse.writeHead(200, {
		'Content-type': 'application/json',
		'Access-Control-Allow-Origin': '*',
		'Access-Control-Allow-Methods': 'GET',
		'Access-Control-Request-Method': '*',
		'Cache-control': 'no-cache',
		'Connection': 'keep-alive'
	});

	var inchesPerMM = 0.0393701;
	if (lat !== undefined && lon !== undefined)
	{
		var countyGet = new XMLHttpRequest();
		var countyGetURL = 'http://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=' + lon + '&y=' + lat + '&benchmark=4&vintage=4&layers=county&format=json';
		console.log(countyGetURL);
		countyGet.addEventListener('load', countyGetComplete, false);
		countyGet.addEventListener('error', countyGetFailed, false);
		countyGet.open('GET',countyGetURL,true);
		countyGet.send();
	}
	
	/**   
	 * @function countyGetComplete
	 */
	function countyGetComplete()
	{
		var countyStatus = countyGet.statusText;
		var countyResponse = JSON.parse(countyGet.responseText);
		var countyName = countyResponse.result.geographies.Counties[0].NAME;
		var countyBasename = countyResponse.result.geographies.Counties[0].BASENAME;
		var countyCounty = countyResponse.result.geographies.Counties[0].COUNTY;
		var countyGeoID = countyResponse.result.geographies.Counties[0].GEOID;
		
		var county = {
			"name" : countyName,
			"basename" : countyBasename,
			"countyID" : countyCounty,
			"countyGeoID" : countyGeoID
		};

		serverResponse.county = county;

		var weatherGetURL = 'https://api2.worldweatheronline.com/free/v2/weather.ashx?q=' + lat + "," + lon + '&format=json&extra=localObsTime&isDayTime&num_of_days=1&date=today&includelocation=yes&show_comments=yes&key=' + APIKEY;
		console.log(weatherGetURL);
		var weatherGet = new XMLHttpRequest();
		weatherGet.addEventListener('load', wxTransferComplete, false);
		weatherGet.addEventListener('error', wxTransferError, false);
		weatherGet.open('GET',weatherGetURL,true);
		weatherGet.send();



		/**   
		 * @function wxTransferComplete
		 */
		function wxTransferComplete()
		{
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
			var obsTime = weatherResponse.data.current_condition[0].localObsDateTime;
			var weatherIcon = weatherResponse.data.weather[0].hourly[0].weatherIconUrl[0].value.replace("http", "https");
		

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
				"obsTime"		: obsTime,
				"icon"          : weatherIcon
			};

			if (serverResponse === null){
				serverResponse = new ResponseObject("","",[]);
				console.log(serverResponse);
			}
			serverResponse.weather = currentConditions;
			var stateAbbrev = statesToAbbreviations[currentConditions.state];
			serverResponse.state = stateAbbrev;
		
			var feedGet = new XMLHttpRequest();
			var url = "https://alerts.weather.gov/cap/" + stateAbbrev.toLowerCase() + ".php?x=0";
			console.log(url);
			feedGet.addEventListener('load', feedTransferComplete, false);
			feedGet.addEventListener('error', feedError, false);
			feedGet.open('GET',url,true);
			feedGet.send();
		
			function feedTransferComplete()
			{
				console.log("feedTransferComplete");
				var response = feedGet.responseText;
				var getStatus = feedGet.statusText;
				var wxProducts = [];
		

				// this is the rss feed 
				parseString(response, function (err, result)
				{
					var feedResult = _.toArray(result);
					var productLinks = [];
					var numFeedItems = 250; // max
					var productGet = [];


				
					// get the links for all active alerts for this state
					try {
						for (var i=0; i < numFeedItems; i++)
						{	
							var feedLink = feedResult[0].entry[i].link;
							var linkStringArray = _.toArray(feedLink);
							productLinks[i] = linkStringArray[0].$.href;	
						}
					}
					/*jshint -W002 */
					catch(err)
					{
						//console.log(i + " " + err);
						var numAlerts = i;	
						console.log("numAlerts= " + numAlerts);
					}
					/*jshint +W002 */

					var k = 0;
					var identifiers = [];
					Array.prototype.search = function (str) {
						var found = false;
						for (var n=0; n < this.length; n++) {
							if (this[n] === str) {
								found = true;
							}
						}
						console.log(found);
						return found;
					}
					


					for (var j=0; j < numAlerts; j++) {
						(function(j) {
							productGet[j] = new XMLHttpRequest();
							productGet[j].open('GET',productLinks[j],true);
							productGet[j].onreadystatechange = function (oEvent) {
								if (productGet[j].readyState === 4) {
									if (productGet[j].status === 200) {
										parseString(this.responseText, function (err, result){
											if (typeof result.alert !== 'undefined') {
												var alertCounties = result.alert.info[0].area[0].areaDesc[0];
												var polygon = result.alert.info[0].area[0].polygon[0];
												var matchedCountyName = alertCounties.search(countyBasename);
					
												// check result.alert.info[0].area[0].geocode[] to see if this alert 
												// is issued for the current state
												var geocodes = result.alert.info[0].area[0].geocode;
												var numGeocodes = geocodes.length;
												var geocodeStateMatch = false;
												if (numGeocodes !== 0) {
													for (var m=0; m < numGeocodes; m++) {
														var geocodeValue = result.alert.info[0].area[0].geocode[m].value[0];
														var geocodeValueState = geocodeValue.substring(0,2);
														if (geocodeValueState === stateAbbrev) {
															if (matchedCountyName != -1) {
															// if the county name matches the alert, send it
																serverResponse.alerts[k] = result;
																k++;
															} else if ((typeof polygon !== undefined) && (polygon !== '')) {
															// if the alert has a polygon, send it
																serverResponse.alerts[k] = result;
																k++;
															} 
														}
													}	
												}
											}
										});
									}	
								}
							};
							productGet[j].send();
						})(j);
					}
				}); // parseString 
			} // feedTransferComplete

			var ResponseObjectJSON = JSON.stringify(serverResponse);
			console.log(serverResponse);
			httpResponse.write(ResponseObjectJSON + '\n');
			httpResponse.end();	


		} // wxTransferComplete
	} // countyGetComplete

	function countyGetFailed()
	{
		console.log("countyGet failed");
	}	
	function wxTransferError()
	{
		console.log("wxTransferError occurred");
	}

	function feedError()
	{
		console.log("alerts feed error occurred");
	}
}); // server

server.listen(PORT, HOSTNAME);
console.log("Server is listening on " + HOSTNAME + ":" + PORT);


