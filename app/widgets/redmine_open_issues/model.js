var http = require('http'),
    https = require('https'),
    markdown = require('markdown-it')({
      'linkify': true,
      'breaks': true
    }),
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
  'Ready for Production': 9,
  'Pushed to Production': 10,
  'Done': 11,
  'Resolved': 12
};

var priorityOrder = {
  'Low': 0,
  'Normal': 1,
  'High': 2,
  'Urgent': 3,
  'Immediate': 4
};

exports.fetch = function(service, callback, settings) {
  var redmine = this,
      jsonData = {},
      out = {id: service.id, name: service.name};

  utils.when(
    function(done) {
      var path = '/projects/' + service.identifier + '/issues.json?status_id=open&limit=100';
      redmine.fetchAPI('issues', path, service, settings, jsonData, done);
    },
    function(done) {
      var path = '/projects/' + service.identifier + '/versions.json';
      redmine.fetchAPI('versions', path, service, settings, jsonData, done);
    }
  ).then(function() {
    out.results = redmine.translate(jsonData, service);
    out.error = jsonData.error;
    callback(out)
  });
};

// Fetch issues from service endpoint
exports.fetchAPI = function(name, path, service, settings, jsonData, done, skipDefaultOptions) {
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
  if (queryFilters && queryFilters[name] && !skipDefaultOptions) {
    var queryFilterString = querystring.stringify(queryFilters[name]);
    if (! path.includes(queryFilterString)) {
      path = path + "&" + queryFilterString;
    }
    console.log("ADDED QUERY OPTIONS TO PATH", path);
  }

  if (name === 'issues' && settings) {
    if (settings.target_version) {
      path = path.replace(/&?fixed_version_id=\d+/g, '')
      path = path + "&fixed_version_id=" + settings.target_version;
    }
    if (settings.include_closed) {
      path = path.replace(/&?status_id=[^&]+/g, '')
      path = path + "&status_id=*";
    }
    console.log("SETTING FILTERS FROM INPUT", path);
  }

  options.path = path;

  var reqLib = options.port == 80 ? http : https;
  console.log('requesting', options.path)
  var req = reqLib.get(options, function(res) {
    if (res.statusCode == 200) {
      var data = "";
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function(){
        try {
          var resData = JSON.parse(data);
          if (name === 'issues') {
            console.log('data', resData[name].length)
          }
          var offset = resData.offset || 0;
          if (jsonData[name]) {
            jsonData[name] = jsonData[name].concat(resData[name]);
          } else {
            jsonData[name] = resData[name];
          }
          if (resData.limit && resData.total_count && resData.total_count > (offset + resData.limit)) {
            console.log("THERE'S MORE, REQUESTING NEXT PAGE", "OFFSET: " + offset);
            path = path.replace(/&offset=[\d]+/, '') + "&offset=" + ((resData.offset || 0) + resData.limit)
            return redmine.fetchAPI(name, path, service, settings, jsonData, done, true);
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
  var config = JSON.parse(service.config);

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
      if (x.description && x.description !== "") {
        try {
          description = markdown.render(
            x.description
            .replace(/{{video\(https?:\/\/(www\.)?youtu(be\.com|\.be)\/(watch\?.*v=)?([-\d\w]+)[^}]*}}/, '<iframe width="420" height="315" src="//www.youtube-nocookie.com/embed/$4?rel=0" frameborder="0" allowfullscreen></iframe>')
            .replace(/!(\/[^\s]+)!/gm, "![$1](https://" + service.url + "$1)")
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

      record = {
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

      if (config.link_tickets) {
        record.link = '<a href="https://' + service.url + '/issues/' + x.id + '" target="_blank">#' + x.id + '</a>';
      }

      if (config.custom_link) {
        record.custom_link = '<a href="' + config.custom_link.url.replace('{issue_id}', x.id) + '" title="' + config.custom_link.title + '" target="_blank">' + config.custom_link.label + '</a>';
      }

      return record;
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


    var allIssueIds = issues.map(function(issue) { return issue.id });
    var topIssues = issues.filter(function(issue) {
      return !issue.parentId;
    });
    var missingParentIssues = issues.filter(function(issue) {
      return issue.parentId && allIssueIds.indexOf(issue.parentId) < 0;
    });

    var assignedIssues = assignDescendents(topIssues, issues);

    if (missingParentIssues.length) {
      var catchAllIssue = {
        _catchAll: true,
        id: '-',
        subject: "Unassigned",
        description: "<p><em>These issues are assigned to parents most likely in a different version than the selected filter</em></p>",
        version_id: missingParentIssues[0].version_id,
        status: '-',
        priorityName: '-',
        progress: parseInt(
          missingParentIssues
            .map(function(issue) { return issue.progress || 0 })
            .reduce(function(total, progress) { return total + progress }) /
            parseFloat(missingParentIssues.length)
        )
      };
      if (config.link_tickets) {
        catchAllIssue.link = '-';
      }
      catchAllIssue.issues = assignDescendents(missingParentIssues, issues);

      assignedIssues.push(catchAllIssue);
    }
  }

  results.versions.forEach(function(version) {
    version.issues = assignedIssues.filter(function(issue) {
      return issue.version_id == version.id;
    });
  });
  results.versions = results.versions.filter(function(version) {
    return version.status === "open";
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
