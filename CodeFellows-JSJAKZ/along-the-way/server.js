var express = require('express');

var app = express();
app.set('port', process.env.PORT || 3000);

// serve static files in dist
app.use(express.static(__dirname + '/dist'));

// start server
app.listen(app.get('port'), function() {
  console.log('The server is running on ' + app.get('port'));
});

