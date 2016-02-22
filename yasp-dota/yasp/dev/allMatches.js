var utility = require('../utility');
var generateJob = utility.generateJob;
var async = require('async');
var getData = utility.getData;
var queries = require('../queries');
var insertMatch = queries.insertMatch;
var db = require('../db');
var queue = require('../queue');
var redis = require('../redis');
var args = process.argv.slice(2);
var end_seq_num = args[0] || 0;
//match seq num 59622 has a 32-bit unsigned int max (4294967295) in one of the players' tower damage
//match seq num 239190 for hero_healing
//match seq num 542284 for hero_healing
//may need to cap values down to 2.1b if we encounter them
//postgres int type only supports up to 2.1b (signed int)
//bucket idspace into groups of 100000000
//save progress to redis key complete_history:n
var bucket_size = 100000000;
var i = 0;
async.whilst(function()
{
    return i < end_seq_num;
}, function(cb)
{
    var bucket = i;
    redis.get('complete_history:' + bucket, function(err, result)
    {
        if (err)
        {
            throw err;
        }
        result = result ? Number(result) : bucket;
        getPage(result, bucket);
        cb(err);
    });
    i += bucket_size;
}, function(err)
{
    console.log("launched all scanners with err: %s", err);
});

function getPage(match_seq_num, bucket)
{
    if (match_seq_num > bucket + bucket_size)
    {
        return;
    }
    var job = generateJob("api_sequence",
    {
        start_at_match_seq_num: match_seq_num
    });
    var url = job.url;
    getData(
    {
        url: url,
        delay: 100
    }, function(err, body)
    {
        if (err)
        {
            throw err;
        }
        if (body.result)
        {
            var matches = body.result.matches;
            async.each(matches, function(m, cb)
            {
                insertMatch(db, redis, queue, m,
                {
                    type: "api",
                    skipCacheUpdate: true,
                    skipAbilityUpgrades: true
                }, cb);
            }, function(err)
            {
                if (err)
                {
                    throw err;
                }
                var next_seq_num = matches[matches.length - 1].match_seq_num + 1;
                redis.set('complete_history:' + bucket, next_seq_num);
                return getPage(next_seq_num, bucket);
            });
        }
        else
        {
            throw body;
        }
    });
}