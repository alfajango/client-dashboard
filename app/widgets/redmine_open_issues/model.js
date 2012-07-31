var http = require('http');

var statusOrder = {
  'Estimate Needed': 0,
  'Awaiting Approval': 1,
  'Queued': 2,
  'New': 3,
  'In Progress': 4,
  'Blocked': 5,
  'Feedback': 6,
  'Pushed to Staging': 7,
  'Pushed to Production': 8,
  'Resolved': 9
};

// Fetch issues from service endpoint
exports.fetch = function(service, callback) {
  var redmine = this,
      out = {id: service.id, name: service.name};

  var options = {
    host: service.url,
    port: 80,
    path: '/projects/' + service.identifier + '/issues.json?status_id=open&limit=100', // query parameter doesn't work as advertised
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
        try {
        var resData = JSON.parse(data);
        out.results = redmine.translate(resData);
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
  if (data.total_amount > data.limit) { console.log('WARNING: Total issues is greater than returned.'); }

  var issues = data.issues.map(function(x) {
    return { id: x.id, subject: x.subject, status: x.status.name, progress: x.done_ratio, updated: new Date(x.updated_on) };
  })
    .sort(function(a, b) {
      var firstOrder = statusOrder[a.status] - statusOrder[b.status];
      if (firstOrder === 0) {
        return a.id - b.id;
      } else {
        return firstOrder;
      }
    });
  return issues;
};

// Write fetched results to db
exports.write = function() {
};
