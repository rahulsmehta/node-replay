var url = require('url'),
    fs = require('fs'),
		http = require('http'),
    https = require('https'),
    crypto = require('crypto');

//TODO
// * Add support for choosing between http and https proxying
// * Add support for the replay proxy (currently implementing only cap in this branch)


//http.createServer(function(req,res){
//	console.log(req.url);
//	console.log(req.headers);
//	var _url = url.parse(req.url);	
//	var proxy_options = {
//		'host':_url.hostname,
//		'port':(_url.port||80),
//		'path':(_url.path||"/"),
//		'method':req.method,
//		'headers':req.headers
//	};
	//console.log(JSON.stringify(proxy_options));

//	console.log(req);
//	console.log(proxy_options);

var proxy_options = {
	'host':'www.google.com',
	'port':80,
	'path':'',
	'method':'GET'
}
	var preq = http.request(proxy_options,function(_res){
		console.log(_res);		
		_res.setEncoding('utf8');
		_res.on('data',function(data){
			console.log(data);		
		});
	});
//}).listen(8888);
