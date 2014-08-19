var https = require('https');

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
      var path = '/projects.json';
      cashboard.fetchAPI('projects', path, service, jsonData, done);
    },
    function(done) {
      var path = '/invoices.json?has_been_paid=false';
      cashboard.fetchAPI('unpaidInvoices', path, service, jsonData, done);
    },
    function(done) {
      var path = '/client_contacts.json';
      cashboard.fetchAPI('clientContacts', path, service, jsonData, done);
    },
    function(done) {
      var path = '/client_companies.json';
      cashboard.fetchAPI('clientCompanies', path, service, jsonData, done);
    }
  ).then(function() {
    out.results = cashboard.translate(jsonData);
    out.error = jsonData.error;
    console.log("RETURNING RESPONSE");
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
  var cashboard = this,
      uninvoicedProjects = data.projects.filter(function(p) {
        return (p.uninvoiced_item_cost > 0 || p.uninvoiced_expense_cost > 0);
      });

  if (data.unpaidInvoices) {
    data.unpaidInvoices.forEach(function(invoice) {
      invoice.client_name = cashboard.getClientName(invoice.client_type, invoice.client_id, data);
    });
  }

  return {
    uninvoicedProjects: uninvoicedProjects,
    unpaidInvoices: data.unpaidInvoices
  }
};

exports.getClientName = function(client_type, client_id, data) {
  var name,
      contactType = client_type === "Person" ? "clientContacts" : "clientCompanies",
      client = data[contactType].filter(function(c) {
        return c.id == client_id;
      })[0];

  if (client) {
    if (client_type === "Person" && client) {
      name = client.first_name + " " + client.last_name;
    } else if (client) {
      name = client.name;
    }
  }

  return name
};

// Write fetched results to db
exports.write = function() {
};
