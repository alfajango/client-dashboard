var http = require('http'),
    https = require('https'),
    textile = require('textile-js'),
    querystring = require('querystring');

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
  var config = JSON.parse(service.config);

  var options = {
    host: service.url,
    port: config.port || 80,
    headers: {
      'Accept': 'application/json',
      'X-Redmine-API-Key': service.token
    }
  };

  // Namespaced query parameters by endpoint, e.g.:
  // {"issues": {"fixed_version_id": 256}}
  var queryFilters = config.query;
  var queryFilterString = null;
  if (queryFilters && queryFilters[name]) {
    var queryFilterString = querystring.stringify(queryFilters[name]);
    if (! path.includes(queryFilterString)) {
      path = path + "&" + queryFilterString;
    }
    console.log("ADDED QUERY OPTIONS TO PATH", path);
  }
  options.path = path;

  var reqLib = options.port == 80 ? http : https;
  var req = reqLib.get(options, function(res) {
    if (res.statusCode == 200) {
      var data = "";
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function(){
        try {
          var resData = JSON.parse(data);
          var offset = resData.offset || 0;
          if (jsonData[name]) {
            jsonData[name] = jsonData[name].concat(resData[name]);
          } else {
            jsonData[name] = resData[name];
          }
          if (resData.limit && resData.total_count && resData.total_count > (offset + resData.limit)) {
            console.log("THERE'S MORE, REQUESTING NEXT PAGE", "OFFSET: " + offset);
            path = path.replace(/&offset=[\d]+/, '') + "&offset=" + ((resData.offset || 0) + resData.limit)
            return redmine.fetchAPI(name, path, service, jsonData, done);
          }
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
      issues = [];

  if (data.versions) {
    results.versions = data.versions.map(function(s) {
      let version = {
        id: s.id,
        name: s.name,
        status: s.status,
        created_on: s.created_on,
        due_date: s.due_date,
        ir_start_date: s.ir_start_date,
        ir_end_date: s.ir_end_date
      };

      if (s.created_on !== undefined && s.due_date !== undefined) {
        const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds

        const startDate = new Date(version.created_on);
        const endDate = new Date(version.due_date);
        const today = new Date();

        version.days = Math.round(Math.abs((endDate - startDate) / oneDay));
        version.days_progress = Math.round(Math.abs((today - startDate) / oneDay));
      }

      return version;
    }).sort(function(a, b) {
      var aDueDate = a.due_date || "0",
          bDueDate = b.due_date || "0";
      return (aDueDate < bDueDate ? -1 : (aDueDate > bDueDate ? 1 : 0));
    });
  }
  results.versions.push( {id: undefined, name: "Backlog", status: "open", due_date: null} );

  if (data.issues) {
    var ind = 0;
    issues = data.issues.map(function(x) {
      // Redmine description uses > for blockquote instead of standard textile bq. formatting.
      var description;
      if (x.description && x.description !== "") {
        try {
          description = textile(
            x.description
            .replace(/{{video\(https?:\/\/(www\.)?youtu(be\.com|\.be)\/(watch\?.*v=)?([-\d\w]+)[^}]*}}/, '<iframe width="420" height="315" src="//www.youtube-nocookie.com/embed/$4?rel=0" frameborder="0" allowfullscreen></iframe>')
            .replace(/!(\/[^\s]+)!/gm, "!http://" + service.url + "$1!")
            .replace(/((^>.*$(\r\n)?)+)/gm, "<blockquote>$1</blockquote>")
            .replace(/^(<blockquote>)?> +$/gm, "$1&nbsp;")
            .replace(/^(<blockquote>)?>/gm, "$1")
          );
        } catch (err) {
          console.log("ERROR PARSING DESCRIPTION FOR ISSUE", x.id);
          description = x.description;
        }
      } else {
        description = "<p><em>No description</em></p>";
      }
      var version = x.fixed_version && x.fixed_version.id;
      var parent = x.parent && x.parent.id;
      return {
        id: x.id,
        subject: x.subject,
        status: x.status.name,
        parentId: parent,
        progress: x.done_ratio,
        updated: new Date(x.updated_on),
        priority: priorityOrder[x.priority.name],
        priorityName: x.priority.name,
        description: description,
        version_id: version,
        ir_position: x.ir_position
      };
    })
      .sort(function(a, b) {
        var firstOrder = a.ir_position - b.ir_position,
            secondOrder = b.priority - a.priority,
            thirdOrder = statusOrder[a.status] - statusOrder[b.status];

        if (firstOrder !== 0) {
          return firstOrder;
        } else if (secondOrder !== 0) {
          return secondOrder;
        } else if (thirdOrder !== 0) {
          return thirdOrder;
        } else {
          return a.id - b.id;
        }
      });


    var topIssues = issues.filter(function(issue) {
      return !issue.parentId;
    });
    issues = assignDescendents(topIssues, issues);
  }

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

function assignDescendents(theseIssues, allIssues) {
  theseIssues.forEach(function(issue) {
    var index = allIssues.indexOf(issue);
    allIssues.splice(index, 1);

    issue.issues = allIssues.filter(function(otherIssue) {
      return otherIssue.parentId && otherIssue.parentId === issue.id;
    });

    assignDescendents(issue.issues, allIssues);
  });

  return theseIssues;
}
