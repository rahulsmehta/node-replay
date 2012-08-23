var fs = require('fs'),
		http = require('http'),
		exec = require('child_process').exec,
		server;

var spinUp = function(){
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
			if(_data) response.write(_data);
			else response.write('{}');
			response.end();
		});
	};

	server = http.createServer(handler);

	server.listen(8080);
}

var tearDown = function(){
	server.close();
};

beforeEach(function(){
	spinUp();
});

afterEach(function(){
	tearDown();	
});

describe("Capture test",function(){

	it("Makes a regular request",function(){
		var _data;
		
		var reqData = {
			username:"test1",
			password:"test1"
			},
			execStr = "curl -d '"+JSON.stringify(reqData)+"' localhost:8080";
			

		curl = exec(execStr,function(err,stdout,stderr){
			_data = JSON.parse(stdout);
			curl.kill();
		});

		waitsFor(function(){
			return _data;
		});

		runs(function(){
			expect(_data.username).toBeDefined("Username was unefined. Return data: "+JSON.stringify(_data));
		});
	});



});



