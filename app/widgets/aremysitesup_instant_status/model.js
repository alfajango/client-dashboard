var http = require('http');
var FeedParser = require('feedparser'),
    parser = new FeedParser();

// Fetch issues from service endpoint
exports.fetch = function(service, callback) {
  var aremysitesup = this;

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
        var out;
        try {
          parser.parseString(data, function(err, meta, parsedData) {
            var siteData = parsedData.filter(function(obj) {
              return obj.title == service.identifier;
            })[0];
            out = aremysitesup.translate(siteData);
            callback(out);
          });
        } catch (err) {
          console.log("Got a parsing error: " + err.message);
          out = {aremysitesup_instant_status: [], error: err.message};
          callback(out);
        }
      });
    }
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    callback({aremysitesup_instant_status: [], error: e.message});
  });
};

// Translate fetched response to db store format
exports.translate = function(data) {
  return {
    aremysitesup_instant_status: {
      status: data.summary
    }
  };
};

// Write fetched results to db
exports.write = function() {
};
