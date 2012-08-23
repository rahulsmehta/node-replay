var fs = require('fs'),
		http = require('http'),
		exec = require('child_process').exec,
		server;

beforeEach(function(){
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

	server.listen(3000);
});

afterEach(function(){
	server.close();
});

describe("Capture test",function(){

	xit("Makes a regular request",function(){
		var _data = null;
		
		var reqData = {
			username:"test1",
			password:"test1"
			},
			execStr = "curl -d '"+JSON.stringify(reqData)+"' localhost:3000";
			
		var curl = exec(execStr,function(err,stdout,stderr){
			_data = JSON.parse(stdout);
			curl.kill();
		});

		waitsFor(function(){
			return _data != null;
		});

		runs(function(){
			expect(_data.username).toBeDefined("Username was unefined. Return data: "+JSON.stringify(_data));
		});
	});

	it("Captures a request - correct response",function(){
		var _data = null;

		var execProxy = "bash scripts/test.sh";
		var proxy = exec(execProxy,function(err,stdout,stderr){
			console.log(stdout);
			console.log(stderr);
			console.log(err);
		});

		var execCurl = "curl -x localhost:8080 -d '{foo:true}'localhost:3000";	
		var curl = exec(execCurl,function(err,stdout,stderr){
			_data = stdout;
			curl.kill();
		});

		waitsFor(function(){
			return _data != null;
		});

		runs(function(){
			expect(_data).toBeDefined();
		});


	});

});



