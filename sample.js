var http = require('http');
var options = {
  host: 'www.google.com',
	  port: 80,
		  path: '/upload',
			  method: 'POST'
				};

				var req = http.request(options, function(res) {
						console.log(res);
											});

											req.on('error', function(e) {
											  console.log('problem with request: ' + e.message);
												});

												// write data to request body
												req.write('data\n');
												req.write('data\n');
												req.end();
