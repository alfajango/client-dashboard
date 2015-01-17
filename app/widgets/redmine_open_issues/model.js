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

exports.fetch = function(service, callback) {
  var redmine = this,
      jsonData = {},
      out = {id: service.id, name: service.name};

  utils.when(
    function(done) {
      var path = '/projects/' + service.identifier + '/issues.json?status_id=open&limit=100';
      redmine.fetchAPI('issues', path, service, jsonData, done);
    },
    function(done) {
      var path = '/projects/' + service.identifier + '/versions.json';
      redmine.fetchAPI('versions', path, service, jsonData, done);
    }
  ).then(function() {
    out.results = redmine.translate(jsonData, service);
    out.error = jsonData.error;
    callback(out)
  });
};

// Fetch issues from service endpoint
exports.fetchAPI = function(name, path, service, jsonData, done) {
  var redmine = this;

  var options = {
    host: service.url,
    port: 80,
    path: path,
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
        jsonData[name] = resData[name];
        } catch (err) {
          console.log("Got a parsing error: " + err.message);
          jsonData.error = err.message;
        }
        console.log('DONE: ' + name);
        done();
      });
    } else {
      console.log('Status code: ' + res.statusCode);
      jsonData.error = res.statusCode;
      done();
    }
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    jsonData.error = e.message;
    done();
  });
};

// Translate fetched response to db store format
exports.translate = function(data, service) {
  if (data.total_amount > data.limit) { console.log('WARNING: Total issues is greater than returned.'); }
  var results = {
        versions: []
      },
      issues;

  if (data.versions) {
    results.versions = data.versions.map(function(s) {
      return {
        id: s.id,
        name: s.name,
        status: s.status,
        due_date: s.due_date
      }
    }).sort(function(a, b) {
      var aDueDate = a.due_date || "0",
          bDueDate = b.due_date || "0";
      return (aDueDate < bDueDate ? -1 : (aDueDate > bDueDate ? 1 : 0));
    });
  }
  results.versions.push( {id: undefined, name: "Backlog", status: "open", due_date: null} );

  issues = data.issues.map(function(x) {
    // Redmine description uses > for blockquote instead of standard textile bq. formatting.
    var description;
    if (x.description && x.description !== "") {
      description = textile(
        x.description
        .replace(/{{video\(https?:\/\/(www\.)?youtu(be\.com|\.be)\/(watch\?.*v=)?([-\d\w]+)[^}]*}}/, '<iframe width="420" height="315" src="//www.youtube-nocookie.com/embed/$4?rel=0" frameborder="0" allowfullscreen></iframe>')
        .replace(/!(\/[^\s]+)!/gm, "!http://" + service.url + "$1!")
        .replace(/((^>.*$(\r\n)?)+)/gm, "<blockquote>$1</blockquote>")
        .replace(/^(<blockquote>)?> +$/gm, "$1&nbsp;")
        .replace(/^(<blockquote>)?>/gm, "$1")
      );
    } else {
      description = "<p><em>No description</em></p>";
    }
    var version = x.fixed_version && x.fixed_version.id;
    return { id: x.id, subject: x.subject, status: x.status.name, progress: x.done_ratio, updated: new Date(x.updated_on), priority: priorityOrder[x.priority.name], description: description, version_id: version };
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
  results.versions.forEach(function(version) {
    version.issues = issues.filter(function(issue) {
      return issue.version_id == version.id;
    });
  });
  return results;
};

// Write fetched results to db
exports.write = function() {
};
