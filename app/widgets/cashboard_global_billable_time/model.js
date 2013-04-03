var https = require('https');
var querystring = require('querystring');

exports.options = function(service, path) {
  var auth = 'Basic ' + new Buffer(service.user + ':' + service.token).toString('base64');
  return {
    host: service.url || 'api.cashboardapp.com',
    port: 443,
    path: path,
    headers: {
      'Accept': 'application/json',
      'Authorization': auth
    }
  };
};

// Fetch issues from service endpoint
exports.fetch = function(service, callback) {
  var cashboard = this,
      out = {id: service.id, name: service.name},
      jsonData = {};

  utils.when(
    function(done) {
      var path = '/time_entries.json?billable=true&start_date=2013-03-24&end_date=2013-03-30';
      cashboard.fetchAPI('timeEntries', path, service, jsonData, done);
    },
    function(done) {
      var path = '/line_items.json';
      cashboard.fetchAPI('lineItems', path, service, jsonData, done);
    },
    function(done) {
      var path = '/projects.json';
      cashboard.fetchAPI('projects', path, service, jsonData, done);
    },
    function(done) {
      var path = '/employees.json';
      cashboard.fetchAPI('employees', path, service, jsonData, done);
    },
    function(done) {
      var path = '/project_assignments.json';
      cashboard.fetchAPI('projectAssignments', path, service, jsonData, done);
    }
  ).then(function() {
    out.results = cashboard.translate(jsonData);
    out.error = jsonData.error;
    callback(out);
  });

};

exports.fetchAPI = function(name, path, service, jsonData, done) {
  var options = this.options(service, path);
  console.log('GETTING: ' + name);

  var req = https.get(options, function(res) {
    if (res.statusCode == 200) {
      var data = "";
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function(){
        try {
          var resData = JSON.parse(data);
          jsonData[name] = resData;
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
exports.translate = function(data) {
  if (data.timeEntries) {
    data.timeEntries.forEach(function(entry) {
      var lineItem = data.lineItems.filter(function(li) {
        return li.links.self.indexOf(entry.line_item_id) > 0;
      })[0];

      var project = data.projects.filter(function(p) {
        return p.links.self.indexOf(lineItem.project_id) > 0;
      })[0];
      entry.project_name = project.name;

      var person = data.employees.filter(function(e) {
        return e.links.self.indexOf(entry.person_id) > 0;
      })[0];
      entry.person_name = [person.first_name, person.last_name].join(' ');

      var projectAssignment = data.projectAssignments.filter(function(pa) {
        return pa.person_id === entry.person_id && pa.project_id === lineItem.project_id;
      })[0];

      if (project.billing_code === 0) {
        entry.billable_rate = 0;
      } else if (project.billing_code === 1) {
        entry.billable_rate = lineItem.price_per;
      } else if (project.billing_code === 2) {
        entry.billable_rate = projectAssignment ? projectAssignment.bill_rate : 0;
      }
    });
    return data.timeEntries;
  }
};

// Write fetched results to db
exports.write = function() {
};