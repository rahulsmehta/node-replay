node-replay
===========

## An HTTP replay proxy implemented in node.js

Node-replay enables a program to capture all outgoing and incoming HTTP traffic. This is especially useful for inspecting traffic as well as mocking API calls for unit-testing purposes. In fact, this is was initially developed to mock API calls by storing requests and their respective responses. node-replay extensively uses Horaci Cuevas' excellent man-in-the-middle proxy ([node-mitm-proxy](https://github.com/horaci/node-mitm-proxy)), which is also implemented in node.js. 

### Usage

In order to start using this utility, run the command `node replay.js [-c|-r]`, where the flag `-c` starts node-replay in capture mode and `-r` starts it in replay mode. If a flag is not specified, it defaults to capture mode. Support for node-replay as a CommonJS module is in the works.

### Functionality

When node-replay is started in capture mode, it will log all outgoing requests. To exclude a URL/group of URLs from being captured (for example, only API responses need to be stored and html files, etc. are unnecessary), enter either a complete URL or a piece of a URL into the `excludes` array within `replay.js`. Support for an external file in which to specify exclusions, as well as support for an inclusions file are coming soon.
When started in replay mode, the proxy will "replay" all outgoing requests that were stored. The requests as well as the response data are stored in hashed files in the `data/` directory. The response code, all headers, and the response data are stored in these files. If for some reason node-replay cannot load a file to replay, an empty object will be returned as the response.

### Startup Scripts

There are three startup scripts in the `scripts/` directory that will help automate certain tasks. Running `cleanup.sh` will remove the `logs/` and `data/` directories. Similarly, running `startCapture.sh` will remove the same directories, and start the proxy in capture mode. Running `startReplay.sh` will start the proxy in replay mode.

### Logging

Node-replay logs all requests in the `data/` directory, and also logs all of the command line output in the `logs/` directory. If the proxy is started from either `startCapture.sh` or `startReplay.sh`, the command line output from the proxy will also be logged to `capture.log` and `replay.log` respectively. 

### Integration with headless testing utilities

Integration with headless browser utilities such as PhantomJS is very simple with node-replay. Simply set the command line argument `--proxy=localhost:8080` at execution to proxy all PhantomJS traffic through node-replay. Alternately, this can be set in the config.json file as `'proxy':"localhost:8080"`.
