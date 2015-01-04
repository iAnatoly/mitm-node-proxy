var 	
	httpPort=80, 
	securePort=443;

var 
	http = require('http'),
	https = require('https'),
	httpProxy = require('http-proxy'),
	dns = require('dns'),
	fs = require('fs');

// avoid HSTS to allow SSL MITM
// alas, this does not work with facebook.com, since it is 'pre-loaded'.
// don't you hate this crap?
var proxy = httpProxy.createProxyServer({});
proxy.on('proxyReq', function(proxyReq, req, res, options) {
	res.removeHeader('Strict-Transport-Security');
	res.removeHeader('Non-Authoritative-Reason');
	//console.log(res.headers);
});

// handle proxy request, since node-http-proxy creators want us to hanle errors directly
// see https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy/index.js @114
proxy.on('error', function(error) {
	console.log('error: '+error);
});

var httpHelper = new function () {
	this.redirect = function(response) {
		response.statusCode = 302;
		response.setHeader("Location", "http://news.ycombinator.com");
		response.end();
	};
	this.error = function(response, code, errorMessage) {
		response.statusCode = code;
		response.write(errorMessage);
		response.end();
	};
	this.message = function(response, message) {
		response.writeHead(200, { 'Content-Type': 'text/html' });
		response.write(message);
		response.end();
	};
			
}

var policyEngine = new function () {
	this.acl = {
		'reddit.com' : {
			whitelist: [ '^\/message\/', '^\/r\/microsoft', '^\/r\/apple', '^\/r\/bayarea', '^\/r\/programming', '^\/r\/finance', '^\/r\/science', '^\/r\/investing', '^\/api\/', '^/$' ]
		},
		'facebook.com' : { whitelist: [ '.' ] },
		'vk.com' : {},
	};

	this.isAllowed = function (request) {
		for (site in this.acl) {
			var siteRx = new RegExp(site,'ig');
			if (request.headers.host.match(siteRx)){
				console.log('site match: '+request.headers.host+' = '+siteRx);
				for (wurl in this.acl[site].whitelist){
					var wurlRx = new RegExp(this.acl[site].whitelist[wurl],'ig');
					if (request.url.match(wurlRx)) return true;
				}
				return false;
			}
		}
		return true;
	};

	this.redirectIfAllowed = function(request,response) {
		if (!this.isAllowed(request)) httpHelper.message(response,"Nope. Go to <a href='http://news.ycombinator.com/'>HN</a> instead");
	}; 
}

var HostParser = function (hostHeader,isSecure){
	var hostAndPort=hostHeader.split(':');
	this.host = hostAndPort[0];
	if (hostAndPort.length>1)
		this.port = hostAndPort[1];
	if (isSecure)
		this.schema = 'https';
	else
		this.schema = 'http';
}

// I use hosts file to redirect traffic to MITM proxy, so I have to use dns.resolve*	
// In order to get the real DNS address of the server
HostParser.prototype.resolveAndProxy = function(request,response) {
	var target = this.schema + '://';
	var port = this.port;

	dns.resolve4(this.host, function (err, addresses) {
		if (err) throw err;
		
		target += addresses[0]; // TODO: port
		if (port) target+=":"+port;

		console.log('proxying request to: '+target);

		proxy.web(
			request, 
			response, 
			{ 
				target: target,
				secure: false
			}
		);
	});
};

var conditionalRedirect = function(req, res, isSecure) {
	policyEngine.redirectIfAllowed(req,res);
 	
	if (!res.finished) {
		var parser = new HostParser(req.headers.host,isSecure);
		try {
			parser.resolveAndProxy(req,res);
		} catch (err){
			httpHelper.error(res,500,err.message);
		}
	}
 
};


var options = {
	key: fs.readFileSync('ssl/server.key'),
	cert: fs.readFileSync('ssl/server.pem')
};

http.createServer(function(req,res){
	conditionalRedirect(req,res,false);
}).listen(httpPort);

https.createServer(options,function(req,res){
	conditionalRedirect(req,res,true);
}).listen(securePort); 

console.log('listening');

