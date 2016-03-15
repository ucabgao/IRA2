var url = require("url");
var S = require("string");
var https = require("https");
var fs = require("fs");
var XMLHttpRequest = require("../../node_modules/xhr2");
var _ = require("../../node_modules/underscore");
var xml2js = require('../../node_modules/xml2js');
var request = require('../../node_modules/request');
var dotenv = require("../../node_modules/dotenv");
dotenv._getKeysAndValuesFromEnvFilePath("../../node_modules/weathercheck.env");
dotenv._setEnvs();
dotenv.load();

var APIKEY = process.env.APIKEY;
var HOSTNAME = process.env.HOSTNAME;
var PORT = 8080;
var KEY_LOCATION = process.env.KEY_LOCATION;
var CERT_LOCATION = process.env.CERT_LOCATION;
var options = {
	key: fs.readFileSync(KEY_LOCATION),
	cert: fs.readFileSync(CERT_LOCATION)
};
var MAPBOX = process.env.MAPBOX;

var usStates = [
	'Alabama' ,
	'Alaska' ,
	'Arizona' ,
	'Arkansas' ,
	'California' ,
	'Colorado' ,
	'Connecticut' ,
	'Delaware' ,
	'District of Columbia',
	'Florida' ,
	'Georgia' ,
	'Hawaii' ,
	'Idaho' ,
	'Illinois' ,
	'Indiana' ,
	'Iowa' ,
	'Kansas' ,
	'Kentucky' ,
	'Louisiana' ,
	'Maine' ,
	'Maryland' ,
	'Massachusetts' ,
	'Michigan' ,
	'Minnesota' ,
	'Mississippi' ,
	'Missouri' ,
	'Montana' ,
	'Nebraska' ,
	'Nevada' ,
	'New Hampshire' ,
	'New Jersey' ,
	'New Mexico' ,
	'New York' ,
	'North Carolina',
	'North Dakota' ,
	'Ohio' ,
	'Oklahoma' ,
	'Oregon' ,
	'Pennsylvania' ,
	'Rhode Island' ,
	'South Carolina',
	'South Dakota' ,
	'Tennessee' ,
	'Texas' ,
	'Utah' ,
	'Vermont' ,
	'Virginia' ,
	'Washington' ,
	'West Virginia' ,
	'Wisconsin' ,
	'Wyoming'
	];
var statesToAbbreviations = {
	'Alabama' : 'AL',
	'Alaska' : 'AK',
	'Arizona' : 'AZ',
	'Arkansas'	: 'AR',
	'California' : 'CA',
	'Colorado' : 'CO',
	'Connecticut' : 'CT',
	'Delaware' : 'DE',
	'District of Columbia' : 'DC',
	'Florida' : 'FL',
	'Georgia' : 'GA',
	'Hawaii' : 'HI',
	'Idaho' : 'ID',
	'Illinois' : 'IL',
	'Indiana' : 'IN',
	'Iowa'	: 'IA',
	'Kansas' : 'KS',
	'Kentucky' : 'KY',
	'Louisiana' : 'LA',
	'Maine' : 'ME',
	'Maryland' : 'MD',
	'Massachusetts' : 'MA',
	'Michigan' : 'MI',
	'Minnesota' : 'MN',
	'Mississippi' : 'MS',
	'Missouri' : 'MO',
	'Montana' : 'MT',
	'Nebraska' : 'NE',
	'Nevada' : 'NV',
	'New Hampshire' : 'NH',
	'New Jersey' : 'NJ',
	'New Mexico' : 'NM',
	'New York' : 'NY',
	'North Carolina': 'NC',
	'North Dakota' : 'NC',
	'Ohio' : 'OH',
	'Oklahoma' : 'OK',
	'Oregon' : 'OR',
	'Pennsylvania'	: 'PA',
	'Rhode Island' : 'RI',
	'South Carolina': 'SC',
	'South Dakota' : 'SD',
	'Tennessee' : 'TN',
	'Texas' : 'TX',
	'Utah' : 'UT',
	'Vermont' : 'VT',
	'Virginia' : 'VA',
	'Washington'	: 'WA',
	'West Virginia' : 'WV',
	'Wisconsin' : 'WI',
	'Wyoming' : 'WY'
};
var stateFullName = null;



var server = https.createServer(options,function(req, httpResponse)
{
	var urlParts = url.parse(req.url, true, true);
	var queryStr = urlParts.query;
	var lat = queryStr.lat;
	var lon = queryStr.lon;
	if (lat !== undefined && lon !== undefined)
	{
		// request geocode to figure out what state we are standing in
		var geocodeURL = 'https://api.tiles.mapbox.com/v4/geocode/mapbox.places/' + lon + ',' + lat + '.json?access_token=' + MAPBOX;
		//console.log(geocodeURL);
		var geocodeGet = new XMLHttpRequest();
		geocodeGet.addEventListener('load', geocodeComplete, false);
		geocodeGet.addEventListener('error', geocodeFailed, false);
		geocodeGet.open('GET',geocodeURL,true);
		geocodeGet.send();
		function geocodeComplete()
		{
			var geocodeJSON = JSON.parse(geocodeGet.responseText);
			//console.log("geocode status " + geocodeGet.statusText);
			//console.log("geocode response \n" + geocodeGet.responseText);
			// if we dont get a state name in the first five features returned just give up
			for (var i=0; i < 5; i++)
			{
				for (var j=0; j < 5; j++)
				{
					try
					{
						for (var x=0; x < 50; x++)
						{
							if (geocodeJSON.features[i].context[j].text == usStates[x])
							{
								stateFullName = geocodeJSON.features[i].context[j].text;
							}
							if (geocodeJSON.features[i].text == usStates[x])
							{
								stateFullName = geocodeJSON.features[i].text;
							}
						}
					}
					catch(err)
					{
						//console.log();
					}
				}
			}
			var stateAbbrev = statesToAbbreviations[stateFullName];
			
			// now that we know what state we are in request the weather alerts rss feed for that state
			if (stateAbbrev !== undefined)
			{
				var feedGet = new XMLHttpRequest();
				var url = "https://alerts.weather.gov/cap/" + stateAbbrev.toLowerCase() + ".php?x=0";
				feedGet.addEventListener('load', feedTransferComplete, false);
				feedGet.addEventListener('error', feedError, false);
				feedGet.open('GET',url,true);
				feedGet.send();
				
				function feedTransferComplete()
				{
					console.log(url);	
					var parserXml = new xml2js.Parser();
					var response = feedGet.responseText;
					var getStatus = feedGet.statusText;
					var wxProducts = [];
					// this is the rss feed 
					parserXml.parseString(response, function (err, result) {
						var feedResult = _.toArray(result);
						var productLinks = [];
						var numFeedItems = 25; // test	

						// get the links for all active alerts for this state
						// when we are done i is the number of alerts we found
						try {
							for (i=0; i < numFeedItems; i++)
							{	
								var feedLink = feedResult[0].entry[i].link;
								var linkStringArray = _.toArray(feedLink);
								productLinks[i] = linkStringArray[0].$.href;	
							}
						}
						/*jshint -W002 */
						catch(err)
						{
							//console.log(i + " items");
						}
						/*jshint +W002 */	
						// see https://alerts.weather.gov/cap/pdf/CAP%20v12%20guide%20web%2006052013.pdf
						var productTextArray = [];
						
							httpResponse.writeHead(200, {
								'Content-type': 'application/json',
								'Access-Control-Allow-Origin': '*',
								'Access-Control-Allow-Methods': 'GET',
								'Access-Control-Request-Method': '*',
								'Cache-control': 'no-cache',
								'Connection': 'keep-alive'
							});
							for (j=0; j < i; j++)
							{
								// get the entire alert
								request(productLinks[j], function(error, response, html) {
									parserXml.parseString(html, function (errProduct, response) {
										var productResponse = _.toArray(response);
										productTextArray[j] = {
											identifier 		: productResponse[0].identifier[0],
											sentTime		: productResponse[0].sent[0],
											productStatus	: productResponse[0].status[0],
											msgType			: productResponse[0].msgType[0],
											note			: productResponse[0].note[0],
											category		: productResponse[0].info[0].category[0],
											eventType		: productResponse[0].info[0].event[0],
											urgency			: productResponse[0].info[0].urgency[0],
											severity		: productResponse[0].info[0].certainty[0],
											effective		: productResponse[0].info[0].effective[0],
											expires			: productResponse[0].info[0].expires[0],
											senderName		: productResponse[0].info[0].senderName[0],
											headline		: productResponse[0].info[0].headline[0],
											description		: productResponse[0].info[0].description[0],
											instruction		: productResponse[0].info[0].instruction[0],
											areaDesc		: productResponse[0].info[0].area[0].areaDesc[0],
											areaPolygon		: productResponse[0].info[0].area[0].polygon[0]
										};
										httpResponse.write(JSON.stringify(productTextArray[j]) + " , "); // FIXME
									});
								});

							}
					}); // parseXML
				} // feedTransferComplete
			} 
		}
	}  
});

server.listen(PORT, HOSTNAME);
console.log("Server is listening on " + PORT);

function geocodeFailed()
{
console.log("geocode failed");
}

function feedError()
{
	console.log("feed error");
}
