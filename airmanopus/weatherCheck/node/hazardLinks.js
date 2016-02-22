var request = require('../../node_modules/request');
var htmlparser = require('../../node_modules/htmlparser');

// test
var lat = 43.0798;
var lon = -89.3875;



var weatherPageUrl = 'http://forecast.weather.gov/MapClick.php?lat=' + lat + '&lon=' + lon;
	console.log(weatherPageUrl);
	request(weatherPageUrl, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var rawHtml = body; 
			var handler = new htmlparser.DefaultHandler(function (error, dom) {
				if (error)
				{
					console.log("trying to parse the page", error);
				} 
			});
			var parser = new htmlparser.Parser(handler);
			parser.parseComplete(rawHtml);
			console.log(handler.dom);


		} else {
			console.log("trying to get the page", error);	
		}
	});
