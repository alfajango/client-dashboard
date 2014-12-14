var http = require('http');

var envOrder = {
  'production': 0,
  'staging': 1
};

// Fetch issues from service endpoint
exports.fetch = function(service, callback) {
  var errbit = this,
      out = {id: service.id, name: service.name};

  var options = {
    host: service.url,
    port: 80,
    path: '/apps/' + service.identifier + '.json?api_key=' + service.token,
    headers: {
      'Accept': 'application/json'
    }
  };

  var req = http.get(options, function(res) {
    res.setEncoding('utf8');
    if (res.statusCode == 200) {
      var data = "";
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function(){
        try {
          var resData = JSON.parse(data);
          out.results = errbit.translate(resData);
        } catch (err) {
          console.log("Got a parsing error: " + err.message);
          out.error = err.message;
        }
        callback(out);
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
  var entries = data.map(function(x) {
    return {
      messages: x.messages,
      error_class: x.error_class,
      url: x.url,
      last_occurrence: new Date(x.last_occurrence),
      env: x.env,
      count: x.count,
      issue_link: x.issue_link
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
  return entries;
};

// Write fetched results to db
exports.write = function() {
};
