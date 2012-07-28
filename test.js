var server = require('./lib/node-mitm-proxy/proxy.js'),
		url = require('url'),
		crypt = require('./lib/md5.js'),
		fs = require('fs');

var scriptArgs = process.argv.slice(2),
		flag = scriptArgs[0];


var proxy _config = {
	'proxy-port':8080,
	'verbose':false
},
	route_config = {
		"graph":"/service/graph",
		"transfer":"/service/transfer"		
	};

var capture = function(proxy){
	
	var hash = [],
			cookies,
			_url;

	proxy.on('request',function(req_url){
		_url = req_url.url;	
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
		
		var url_tk = _url.split('/'),
				graph_tk = route_config.graph.split('/'),
				trans_tk = route_config.transfer.split('/');
		if(url_tk[1] === (graph_tk[1]||trans_tk[1]) && url_tk[2] === (graph_tk[2]||trans_tk[2])){
			console.log(_url+' -> '+fn);
			fs.writeSync(fd,_data);
		}

	});
};

var replay = function(proxy){};

var toRun;

if(flag){
	if(flag.charAt(0) === '-'){
		cmd = flag.substring(1);
		if(cmd === 'c'){
			console.log("Running in capture mode...");
			toRun = capture;
		}
		else if(cmd === 'r'){
			console.log("Running in replay mode...");
			toRun = replay;
		}
	}
}
if(!toRun)toRun = capture;

new server(proxy_config,toRun);
