var http = require('http'),
		https = require('https');

var handler = function(request,response){
	var _method = request.method,
			_url = request.url;

	request.setEncoding('utf8');
	response.writeHead(200, {'Content-Type':'application/json'});

	var _data = null;
	request.on('data',function(data){
		_data = data;
	});

	request.on('end',function(){
		console.log(_url+"("+_method+")"+" -> "+_data);
		if(_data) response.write(_data);
		else response.write('{}');
		response.end();
	});
};



var server = http.createServer(handler);

server.listen(8080);
console.log("API server started at port 8080");
