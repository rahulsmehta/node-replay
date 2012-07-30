var server = require('./lib/node-mitm-proxy/proxy.js'),
		url = require('url'),
		crypt = require('./lib/md5.js'),
		fs = require('fs'),
		http = require('http');

var scriptArgs = process.argv.slice(2),
		flag = scriptArgs[0];

var isCap;
if(flag){
	if(flag.charAt(0) === '-'){
		cmd = flag.substring(1);
		if(cmd === 'c'){
			console.log("Running in capture mode...");
			isCap = true;
		}
		else if(cmd === 'r'){
			console.log("Running in replay mode...");
			isCap = false;
		}
	}
}
if(typeof isCap === "undefined")isCap = true;

var proxy_config = {
	'proxy-port':8080,
	'verbose':false
	};

var JPATH = "logs/";

var capture = function(proxy){
	
	var hash = [],
			cookies,
			_url;

	proxy.on('request',function(req){
		_url = req.url;	
	});

	proxy.on('request_data',function(data){
		var _data = data.toString('utf8',0,data.length);
		hash.push(_data);
	});

	proxy.on('response',function(response){
		if(response.headers['set-cookie']){
			cookies = response.headers['set-cookie'];
		}
		var _data = response.socket._httpMessage;
		hash.push(_data.method);
		hash.push(_data.path);
	});

	proxy.on('response_data', function(data) {
		var _data = data.toString('utf8',0,data.length);
		var fn = crypt.hex_md5(hash[0]+hash[1]+hash[2]); // add command line flag for file format
		var fd = fs.openSync(JPATH+fn, 'w+');
		console.log(_url+' -> '+fn);
		fs.writeSync(fd,_data);
	});
	
};

var replay = function(proxy){
	var rewritten;
	this.url_rewrite = function(req_url){
		req_url.hostname = "localhost:8888";
		rewritten = true;
		return req_url;	
	}

	proxy.on('request',function(req,req_url){
		if(rewritten){
			console.log("Request redirected to "+url.format(req_url));
		}
	});

};

new server(proxy_config,(isCap)?capture:replay);

//Start the replay server if script loaded with flag -r
if(!isCap){
	var replayServer = http.createServer(function(req,res){
		console.log(req);
		console.log(req.url);
		res.write('{"foo":"bar"}');
		res.end();
	});
	replayServer.listen(8888);
	var adr = replayServer.address();
	console.log("Replay server started at port "+adr.port);
}
