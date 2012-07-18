var http = require('http');

// Fetch issues from service endpoint
exports.fetch = function(service, callback) {
  var redmine = this;

  var options = {
    host: service.url,
    port: 80,
    path: '/projects/' + service.identifier + '/issues.json',
    query: 'status_id=open&limit=100',
    headers: {
      'Accept': 'application/json',
      'X-Redmine-API-Key': service.token
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
            out = redmine.translate(resData);
        callback(out);
      });
    }
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    callback({redmine: []});
  });
};

// Translate fetched response to db store format
exports.translate = function(data) {
  var issues = data.issues.map(function(x) {
    return { id: x.id, subject: x.subject, status: x.status.name, progress: x.done_ratio };
  });
  return {redmine: issues};
};

// Write fetched results to db
exports.write = function() {
};
