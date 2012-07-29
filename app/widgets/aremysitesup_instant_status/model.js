var http = require('http');
var FeedParser = require('feedparser'),
    parser = new FeedParser();

// Fetch issues from service endpoint
exports.fetch = function(service, callback) {
  var aremysitesup = this,
      out = {id: service.id, name: service.name};

  var options = {
    host: service.url || 'aremysitesup.com',
    port: 80,
    path: '/feednow/' + service.token,
    headers: {
      'Accept': 'application/atom+xml'
    }
  };

  var req = http.get(options, function(res) {
    if (res.statusCode == 200) {
      var data = "";
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function(){
        try {
          parser.parseString(data, function(err, meta, parsedData) {
            var siteData = parsedData.filter(function(obj) {
              return obj.title == service.identifier;
            })[0];
            out.results = aremysitesup.translate(siteData, service);
            callback(out);
          });
        } catch (err) {
          console.log("Got a parsing error: " + err.message);
          out.error = err.message;
          callback(out);
        }
      });
    }
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    out.error = e.message;
    callback(out);
  });
};

// Translate fetched response to db store format
exports.translate = function(data) {
  return {
    link: data.link,
    status: data.summary
  };
};

// Write fetched results to db
exports.write = function() {
};
