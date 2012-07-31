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
	},
	excludes = ["/GOST/"];



var utils = {
	'contains':function(orig,substr){
		return orig.indexOf(substr) !== -1;
	},
	'hasExclude':function(urlStr){
		var i;
		for(i = 0; i<excludes.length; ++i){
			if(this.contains(urlStr,excludes[i])){
				return true;
			}
		}
		return false;
	},
	'hash':function(data,method,path){
		var md5 = crypto.createHash('md5');
		md5.update((data+method+path),'utf8'); // add command line flag for file format
		return  md5.digest('hex');
	}
}





var cacheDir = "data/";

var capture = function(proxy){
	var cookies,
			_url;

	var hashData,hashMethod,hashPath;

	proxy.on('request',function(req){
		_url = req.url;	
	});

	proxy.on('request_data',function(data){
		hashData = data;
	});

	proxy.on('response',function(response){
		if(response.headers['set-cookie']){
			cookies = response.headers['set-cookie'];
		}
		var _data = response.socket._httpMessage;
		hashMethod = _data.method;
		hashPath = _data.path;
	});

	proxy.on('response_data', function(data) {
		if(!utils.hasExclude(_url)){
			var fn = utils.hash(hashData,hashMethod,hashPath),	
				_data = data.toString('utf8',0,data.length),
				fd = fs.openSync(cacheDir+fn, 'w+');

			console.log(_url+' -> '+fn);
			fs.writeSync(fd,_data);
		} else {
			console.log("Excluding "+_url);
		}	
	});
	
};

var replay = function(proxy){
	this.url_rewrite = function(req_url){
		var path = url.format(req_url.path);	
		if(!utils.hasExclude(path)){
			req_url.hostname = 'localhost';
			req_url.port = 8888;
		} else {
			console.log("Excluding "+path);
		}
	};

}

new server(proxy_config,isCap?capture:replay);

if(!isCap){
	var _key = fs.readFileSync("lib/node-mitm-proxy/certs/agent2-key.pem",'utf8'),
			_cert = fs.readFileSync("lib/node-mitm-proxy/certs/agent2-cert.pem",'utf8'),
			replay_cred = {
				key:_key,
				cert:_cert
			};

	replayServer = https.createServer(replay_cred,function(req,res){
		var _data;
		function respond(data,method,req_url){
			
			var fn = utils.hash(data,method,req_url);
			
			console.log(req_url+" -> "+fn);
			res.write('{}\n');
			res.end();
		};
		
		req.on('data',function(data){
			_data = data;
		});

		req.on('end',function(){
			respond(_data,req.method,req.url);
		});
/*
		req.setEncoding('utf8');
		console.log("Replaying "+req.url);
		res.write('{}\n');
		res.end();*/
	});

	replayServer.listen(8888);
	console.log("Replay server started at port "+replayServer.address().port);
}
