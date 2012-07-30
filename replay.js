var server = require('./lib/node-mitm-proxy/proxy.js'),
		url = require('url'),
		fs = require('fs'),
		https = require('https'),
		crypto = require('crypto');

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
		var md5 = crypto.createHash('md5');
		md5.update((hash[0]+hash[1]+hash[2]),'utf8'); // add command line flag for file format

		var fn = md5.digest('hex'),
				_data = data.toString('utf8',0,data.length),
				fd = fs.openSync(JPATH+fn, 'w+');

		console.log(_url+' -> '+fn);
		fs.writeSync(fd,_data);
	});
	
};

var replay = function(proxy){
	var rewritten;
	this.url_rewrite = function(req_url){
		req_url.hostname = "localhost:8888";
		changed = true;
		return req_url;	
	}

	proxy.on('request',function(req,req_url){
		if(changed){
			console.log("Request redirected to "+url.format(req_url));
		}
	});

};

new server(proxy_config,(isCap)?capture:replay);

//Start the replay server if script loaded with flag -r
if(!isCap){

	var _priv = fs.readFileSync('lib/node-mitm-proxy/certs/agent2-key.pem').toString(),
			_cert = fs.readFileSync('lib/node-mitm-proxy/certs/agent2-cert.pem').toString(),
			cred = {key:_priv,cert:_cert};

	var replayServer = https.createServer(cred,function(req,res){
		console.log(req.url);
		res.write('{"foo":"bar"}\n');
		res.end();
	});

	replayServer.listen(8888);
	var adr = replayServer.address();
	console.log("Replay server started at port "+adr.port);
}


/*
if(!isCap){
	var replay = httpProxy.createServer(function(req,res,proxy){
		console.log(req);
		res.write('{"foo":"bar"}');
		res.end();
	}).listen(8888);
}*/