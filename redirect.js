var http = require('http');

http.createServer(function(request, response) {
	response.statusCode = 302;
	response.setHeader("Location", "http://news.ycombinator.com");
	response.end();
}).listen(80);
