var http = require('http');

var replayServer = http.createServer(function(req,res){
	res.write('{"foo":"bar"}');
	res.end();
});
replayServer.listen(8888);
var adr = replayServer.address();
console.log("Replay server started at port "+adr.port);
