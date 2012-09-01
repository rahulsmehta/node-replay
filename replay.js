var url = require('url'),
    fs = require('fs'),
    https = require('https'),
    crypto = require('crypto');

var scriptArgs = process.argv.slice(2),
    flag = scriptArgs[0];

var isCap;
if (flag) {
    if (flag.charAt(0) === '-') {
        cmd = flag.substring(1);
        if (cmd === 'c') isCap = true;
        else if (cmd === 'r') isCap = false;
    }
}
if (typeof isCap === "undefined") isCap = true;

console.log(isCap ? "Running in capture mode..." : "Running in replay mode...");

var excludes = ["/GOST/"];

var utils = {
    'contains': function (orig, substr) {
        return orig.indexOf(substr) !== -1;
    },
    'hasExclude': function (urlStr) {
        var i;
        for (i = 0; i < excludes.length; ++i) {
            if (this.contains(urlStr, excludes[i])) {
                return true;
            }
        }
        return false;
    },
    'hash': function (data, method, path) {
        var md5 = crypto.createHash('md5');
        md5.update((data + method + path), 'utf8'); // add command line flag for file format
        return md5.digest('hex');
    },
		'getCredentials': function(keyPath,certPath){
			_key = fs.readFileSync(keyPath||"lib/certs/agent2-key.pem");
			_cert = fs.readFileSync(certPath||"lib/certs/agent2-cert.pem");
			var result = {
				'key':_key,
				'cert':_cert
			};
			return result;
		}
}

var cacheDir = "data/";


var proxy = https.createServer(utils.getCredentials(),function(req,res){
	//First get all the information out of the request	
	
	console.log(req);
	
});

proxy.listen(8888);

if (!isCap) {
		replay_cred = utils.getCredentials();

    replayServer = https.createServer(replay_cred, function (req, res) {
        var _data;

        function respond(data, method, req_url) {
            var fn = utils.hash(data, method, req_url);
            console.log(req_url + " -> " + fn);
            var fileData,
            err = false;
            try {
                fileData = JSON.parse(fs.readFileSync(cacheDir + fn, 'utf8'));
            } catch (errorThrown) {
                err = true;
            }
            if (err) {
                res.write('{}');
                res.end();
            } else {
                res.writeHead(fileData.code, fileData.headers);
                _resData = JSON.stringify(fileData.data);
                res.write(_resData);
                res.end();
            }
        };

        req.on('data', function (data) {
            _data = data.toString('utf8', 0, data.length);;
        });

        req.on('end', function () {
            respond(_data, req.method, req.url);
        });
    });

    replayServer.listen(8888);
    console.log("Replay server started at port " + replayServer.address().port);
}
