var http = require('http');
var FeedParser = require('feedparser'),
    parser = new FeedParser();

// Fetch issues from service endpoint
exports.fetch = function(service, callback) {
  var errbit = this;

  var options = {
    host: service.url,
    port: 80,
    path: '/apps/' + service.identifier + '.atom?api_key=' + service.token,
    headers: {
      'Accept': 'application/atom+xml'
    }
  };

  var req = http.get(options, function(res) {
    console.log('status: ' + res.statusCode);
    if (res.statusCode == 200) {
      var data = "";
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function(){
        parser.parseString(data, function(err, meta, exceptions) {
          var out = errbit.translate(exceptions);
          callback(out);
        });
      });
    }
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    callback({errbit: []});
  });
};

// Translate fetched response to db store format
exports.translate = function(data) {
  var entries = data.map(function(x) {
    return { id: x.id, updated: x.date, title: x.title, env: x.author };
  });
  return {errbit: entries};
};

// Write fetched results to db
exports.write = function() {
};
