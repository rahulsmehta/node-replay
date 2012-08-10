var server = require('./lib/proxy.js'),
    url = require('url'),
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

var proxy_config = {
    'proxy-port': 8080,
    'verbose': false
},
excludes = ["/GOST/"];



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
    }
}


var cacheDir = "data/";

var capture = function (proxy) {
    var _url;
    var hashData, hashMethod, hashPath, _status;
    var resData, resHead;

    proxy.on('request', function (req) {
        _url = req.url;
        hashPath = _url;
        hashMethod = req.method;
    });

    proxy.on('request_data', function (data) {
        hashData = data.toString('utf8', 0, data.length);
    });

    proxy.on('response', function (response) {
        var _data = response.socket._httpMessage;
        _status = response.statusCode;
        resHead = response.headers;
    });

    proxy.on('response_data', function (data) {
        resData = data.toString('utf8', 0, data.length);
    });

    proxy.on('response_end', function () {
        //move the file-writing logic into here
        if (!utils.hasExclude(_url)) {
            var fn = utils.hash(hashData, hashMethod, hashPath),
                fd = fs.openSync(cacheDir + fn, 'w+');

            try {
                resData = JSON.parse(resData);
            } catch (err) {
                resData = {};
            }

            console.log(_url + ' -> ' + fn);
            var fileStore = {
								'url':hashPath,
								'method':hashMethod,
								'body':hashData,
                'code': _status,
                'headers': resHead,
                'data': resData
            },
            toWrite = JSON.stringify(fileStore);
            fs.writeSync(fd, toWrite);
        } else {
            console.log("Excluding " + _url);
        }
    });

};

var replay = function (proxy) {
    this.url_rewrite = function (req_url) {
        var path = url.format(req_url.path);
        if (!utils.hasExclude(path)) {
            req_url.hostname = 'localhost';
            req_url.port = 8888;
        } else {
            console.log("Excluding " + path);
        }
    };

}

new server(proxy_config, isCap ? capture : replay);

if (!isCap) {
    var _key = fs.readFileSync("lib/certs/agent2-key.pem", 'utf8'),
        _cert = fs.readFileSync("lib/certs/agent2-cert.pem", 'utf8'),
        replay_cred = {
            key: _key,
            cert: _cert
        };

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
