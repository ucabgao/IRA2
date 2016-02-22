var args = process.argv.slice(2);
require('./runner/' + args[0])(function(err, res) {
    if (err){
        console.error(err);
    }
    process.exit(Number(err));
});