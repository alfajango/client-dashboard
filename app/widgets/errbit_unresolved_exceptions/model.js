var http = require('http');

var envOrder = {
  'production': 0,
  'staging': 1
};

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
        try {
          var resData = JSON.parse(data),
              out = errbit.translate(resData);
        } catch (err) {
          console.log("Got a parsing error: " + err.message);
          out = {errbit_unresolved_exceptions: [], error: err.message};
        }
        callback(out);
      });
    }
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    callback({errbit_unresolved_exceptions: [], error: e.message});
  });
};

// Translate fetched response to db store format
exports.translate = function(data) {
  var entries = data.map(function(x) {
    return {
      messages: x.messages,
      error_class: x.error_class,
      url: x.url,
      last_occurrence: new Date(x.last_occurrence),
      env: x.env,
      count: x.count
    };
  })
    .sort(function(a, b) {
      var firstOrder = envOrder[a.env] - envOrder[b.env];
      if (firstOrder === 0) {
        return b.last_occurrence - a.last_occurrence;
      } else {
        return firstOrder;
      }
    });
  return {errbit_unresolved_exceptions: entries};
};

// Write fetched results to db
exports.write = function() {
};
