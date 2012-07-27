var server = require('./lib/node-mitm-proxy/proxy.js'),
		url = require('url'),
		crypt = require('./lib/md5.js'),
		fs = require('fs');

var scriptArgs = process.argv.slice(2);
//console.log(scriptArgs);
var JPATH = "logs/"

var _confg = {
	'proxy-port':8080,
	'verbose':false
};

var record = function(proxy){
	
	var hash = [];

	proxy.on('request',function(url){
	});

	proxy.on('request_data',function(data){
		var _data = data.toString('utf8',0,data.length);
		hash.push(_data);
	});

	proxy.on('response',function(response){
		var _data = response.socket._httpMessage;
		hash.push(_data.method);
		hash.push(_data.path);
	});

	proxy.on('response_data', function(data) {
		var _data = data.toString('utf8',0,data.length);
		var fn = crypt.hex_md5(hash[0],hash[1],hash[2])+'.json';
		console.log("Writing to "+fn);
		var fd = fs.openSync(JPATH+fn, 'a+', 0666);
		fs.writeSync(fd,_data);
	});
};

var replay = function(proxy){};

var toRun = null; //eventually we'll put some logic here which decides which events the sever will use


new server(_confg,record);
