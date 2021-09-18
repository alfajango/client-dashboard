var http = require('http'),
    https = require('https'),
    markdown = require('markdown-it')({
      'linkify': true
    }),
    querystring = require('querystring'),
    fs = require('fs'),
    { createAppAuth } = require('@octokit/auth-app');

var statusOrder = {
  'open': 0,
  'closed': 1
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
      token,
      jsonData = {},
      out = {id: service.id, name: service.name};

  authApp(service, function(err, token) {
    if (token) {
      utils.when(
        function(done) {
          var path = '/repos/' + service.identifier + '/issues';
          redmine.fetchAPI('issues', path, token, service, jsonData, done);
        },
        function(done) {
          var path = '/repos/' + service.identifier + '/milestones';
          redmine.fetchAPI('versions', path, token, service, jsonData, done);
        }
      ).then(function() {
        out.results = redmine.translate(jsonData, service);
        out.error = jsonData.error;
        callback(out)
      });
    } else {
      out.error = err.message
      callback(out)
    }
  });
};

function authApp(service, callback) {
  const privatePem = service.token;
  const config = JSON.parse(service.config);

  const auth = createAppAuth({
    appId: service.user,
    privateKey: privatePem
  });

  // Retrieve JSON Web Token (JWT) to authenticate as app
  auth({ type: "installation", installationId: config.installationId }).then(function(authResp) {
    callback(null, authResp.token);
  }).catch(function(err) {
    console.error("GITHUB AUTH ERROR", err);
    callback(err, null);
  });
}

// Fetch issues from service endpoint
exports.fetchAPI = function(name, path, token, service, jsonData, done) {
  var redmine = this;
  var config = JSON.parse(service.config);

  var options = {
    host: 'api.github.com',
    port: config.port || 80,
    headers: {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': 'token ' + token,
      'User-Agent': 'NodeJS'
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
            jsonData[name] = jsonData[name].concat(resData);
          } else {
            jsonData[name] = resData;
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
      res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
      });
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
        id: s.number,
        name: s.title,
        status: s.state,
        created_on: s.created_at,
        due_date: s.due_on
        //ir_start_date: s.ir_start_date,
        //ir_end_date: s.ir_end_date
      };

      if (version.created_on !== undefined && version.due_date !== undefined) {
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
      if (x.body && x.body !== "") {
        try {
          description = markdown.render(
            x.body
          )
            .replace(/\[ \]/gm, '<input type="checkbox" onclick="return false;" />')
            .replace(/\[x\]/gm, '<input type="checkbox" onclick="return false;" checked="checked" />');
        } catch (err) {
          console.log("ERROR PARSING DESCRIPTION FOR ISSUE", x.id, err);
          description = x.body;
        }
      } else {
        description = "<p><em>No description</em></p>";
      }
      //var version = x.fixed_version && x.fixed_version.id;
      //var parent = x.parent && x.parent.id;
      let version = x.milestone && x.milestone.number;
      let label = x.labels.map(function(l) {
        return l.name;
      }).join(', ');
      return {
        id: x.number,
        subject: x.title,
        status: x.state,
        //parentId: parent,
        progress: x.state === "closed" ? 100 : 0,
        updated: new Date(x.updated_at),
        priority: priorityOrder[x.state],
        priorityName: label,
        description: description,
        version_id: version
      };
    })
      .sort(function(a, b) {
        var firstOrder = b.priority - a.priority,
            secondOrder = statusOrder[b.status] - statusOrder[a.status],
            thirdOrder = b.progress - a.progress;

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
