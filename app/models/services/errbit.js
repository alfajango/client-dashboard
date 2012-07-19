var http = require('http');

// Fetch issues from service endpoint
exports.fetch = function(service, callback) {
  var errbit = this;

  var options = {
    host: service.url,
    port: 80,
    path: '/apps/' + service.identifier + '.json?api_key=' + service.token,
    headers: {
      'Accept': 'application/json'
    }
  };

  var req = http.get(options, function(res) {
    if (res.statusCode == 200) {
      var data = "";
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function(){
        var resData = JSON.parse(data),
            out = errbit.translate(resData);
        callback(out);
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
    return { title: x.title, last_occurrence: x.last_occurrence, env: x.env, count: x.count };
  });
  return {errbit: entries};
};

// Write fetched results to db
exports.write = function() {
};
