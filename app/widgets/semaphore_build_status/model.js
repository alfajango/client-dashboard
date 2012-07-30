var https = require('https');

// Fetch issues from service endpoint
exports.fetch = function(service, callback) {
  var semaphore = this,
      out = {id: service.id, name: service.name};

  var options = {
    host: service.url || 'semaphoreapp.com',
    port: 443,
    path: '/api/v1/projects/' + service.identifier + '/master/status?auth_token=' + service.token,
    headers: {
      'Accept': 'application/json'
    }
  };

  var req = https.get(options, function(res) {
    if (res.statusCode == 200) {
      var data = "";
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function(){
        try {
        var resData = JSON.parse(data);
        out.results = semaphore.translate(resData);
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
  return {
    branch_name: data.branch_name,
    project_name: data.project_name,
    status: data.result
  };
};

// Write fetched results to db
exports.write = function() {
};
