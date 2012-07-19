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
        try {
          var resData = JSON.parse(data),
              out = errbit.translate(resData);
        } catch (err) {
          console.log("Got a parsing error: " + err.message);
          out = {errbit: [], error: err.message};
        }
        callback(out);
      });
    }
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    callback({errbit: [], error: e.message});
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
  });
  return {errbit: entries};
};

// Write fetched results to db
exports.write = function() {
};
