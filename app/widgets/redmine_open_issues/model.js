var http = require('http'),
    textile = require('textile-js');

var statusOrder = {
  'Estimate Needed': 0,
  'Awaiting Approval': 1,
  'Queued': 2,
  'New': 3,
  'Blocked': 4,
  'In Progress': 5,
  'Feedback': 6,
  'Pull Request': 7,
  'Pushed to Staging': 8,
  'Pushed to Production': 9,
  'Done': 10,
  'Resolved': 11
};

var priorityOrder = {
  'Low': 0,
  'Normal': 1,
  'High': 2,
  'Urgent': 3,
  'Immediate': 4
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
    // Redmine description uses > for blockquote instead of standard textile bq. formatting.
    var description = textile(x.description.replace(/((^>.*$(\r\n)?)+)/gm, "<blockquote>$1</blockquote>").replace(/^(<blockquote>)?> +$/gm, "$1&nbsp;").replace(/^(<blockquote>)?>/gm, "$1"));
    if (description == "") {
      description = "<p><em>No description</em></p>";
    }
    return { id: x.id, subject: x.subject, status: x.status.name, progress: x.done_ratio, updated: new Date(x.updated_on), priority: priorityOrder[x.priority.name], description: description };
  })
    .sort(function(a, b) {
      var firstOrder = b.priority - a.priority,
          secondOrder = statusOrder[a.status] - statusOrder[b.status];
      if (firstOrder === 0) {
        if (secondOrder === 0) {
          return a.id - b.id;
        } else {
          return secondOrder;
        }
      } else {
        return firstOrder;
      }
    });
  return issues;
};

// Write fetched results to db
exports.write = function() {
};
