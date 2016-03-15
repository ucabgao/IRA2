var url = require('url');
var S = require('string');
var https = require('https');
var fs = require('fs');
var request = require('../../node_modules/request');
var cheerio = require('../../node_modules/cheerio');
var dotenv = require('../../node_modules/dotenv');
dotenv._getKeysAndValuesFromEnvFilePath('../../node_modules/weathercheck.env');
dotenv._setEnvs();
dotenv.load();

var HOSTNAME = process.env.HOSTNAME;
var KEY_LOCATION = process.env.KEY_LOCATION;
var CERT_LOCATION = process.env.CERT_LOCATION; 
var options = {
	key: fs.readFileSync(KEY_LOCATION),
	cert: fs.readFileSync(CERT_LOCATION)
};

var weatherHost = 'http://forecast.weather.gov/';

var server = https.createServer(options,function(req, httpResponse) 
{
	var urlParts = url.parse(req.url, true, true);
	var queryStr = urlParts.query;
	var inputLat = queryStr.lat;
	var inputLon = queryStr.lon;
	
	lat = inputLat;
	lon = inputLon;	
	var weatherUrl = 'http://forecast.weather.gov/MapClick.php?lat=' + lat + '&lon=' + lon;
	console.log(weatherUrl);	
	request(weatherUrl, function (error, response, body) 
	{
		if (!error && response.statusCode == 200) 
		{
			httpResponse.writeHead(200, {
				'Content-Type': 'text/plain',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Methods': 'GET',
				'Access-Control-Request-Method': '*',
				'Cache-control': 'no-cache',
				'Connection': 'keep-alive' 	
			});
			
			// if there are links to severe weather products, scrape them
			$ = cheerio.load(body);
			var tags = $('a');

			$(tags).each(function(i, tag)
			{	
				var linkTag = $(tag).attr('href');
				if (linkTag !== undefined)
				{
					console.log(linkTag);
					if (linkTag.search("showsigwx") != -1)
					{
						console.log("got a showsigwx");
						var showsigwxLink = weatherHost + linkTag;
						request(showsigwxLink, function (err, res, products) 
						{
  							if (!error && response.statusCode == 200) 
							{
    							$ = cheerio.load(products);
								var productText = $('content'); // was 'pre'
								$(productText).each(function(j,content)
								{	
									httpResponse.write('\n' + $(productText).text());
									console.log('\n' + $(productText).text());
									httpResponse.end();
								});
  							}
						});
					}
				}
			});
		} 
	});
});
server.listen(8002, HOSTNAME);

console.log("Server is listening on 8002");
