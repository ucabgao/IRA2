var url = require('url');
var S = require('string');
var https = require('https');
var fs = require('fs');
var request = require('../../node_modules/request');
var XMLHttpRequest = require('../../node_modules/xhr2');
var _ = require('../../node_modules/underscore');
var dotenv = require('../../node_modules/dotenv');
dotenv._getKeysAndValuesFromEnvFilePath('../../node_modules/weathercheck.env');
dotenv._setEnvs();
dotenv.load();

var HOSTNAME = process.env.HOSTNAME;
var KEY_LOCATION = process.env.KEY_LOCATION;
var CERT_LOCATION = process.env.CERT_LOCATION; 
var MAPBOX = process.env.MAPBOX;

var options = {
	key: fs.readFileSync(KEY_LOCATION),
	cert: fs.readFileSync(CERT_LOCATION)
};

var port = 8003;
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
var stateFullName = null;
var server = https.createServer(options,function(req, httpResponse) 
{
	var urlParts = url.parse(req.url, true, true);
	var queryStr = urlParts.query;
	var lat = queryStr.lat;
	var lon = queryStr.lon;
	

	//var lat = 43.14;
	//var lon = -89.35;
	var geocodeURL = 'https://api.tiles.mapbox.com/v4/geocode/mapbox.places/' + lon + ',' + lat + '.json?access_token=' + MAPBOX;
	console.log(geocodeURL);
	var geocodeGet = new XMLHttpRequest();
	geocodeGet.addEventListener('load', geocodeComplete, false);
	geocodeGet.addEventListener('error', geocodeFailed, false);
	geocodeGet.open('GET',geocodeURL,true);
	geocodeGet.send();

	function geocodeComplete()
	{

		var geocodeJSON = JSON.parse(geocodeGet.responseText);
		console.log(geocodeGet.statusText);
		console.log(geocodeGet.responseText);
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
					console.log("null");
				}		 
			}
		}
		
		var stateAbbrev = statesToAbbreviations[stateFullName];
		//var returnedState = JSON.stringify({ "state" : stateAbbrev });
		var returnedState = JSON.stringify(stateAbbrev);
		console.log(returnedState);
		httpResponse.writeHead(200, {
			'Content-type': 'application/json',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Methods': 'GET',
			'Access-Control-Request-Method': '*',
			'Cache-control': 'no-cache',
			'Connection': 'keep-alive' 	
		});
		httpResponse.write(returnedState + '\n');
		httpResponse.end();
	
	}

	function geocodeFailed()
	{
		console.log("geocode failed");
	}



});
server.listen(port, HOSTNAME);

console.log("Server is listening on " + port);
