var redis = require('redis');
var config = require('./config');
console.log('connecting %s', config.REDIS_URL);
var client = redis.createClient(config.REDIS_URL, {
    detect_buffers: true
});
client.on('error', function(err) {
    console.error(err);
    process.exit(1);
});
module.exports = client;
