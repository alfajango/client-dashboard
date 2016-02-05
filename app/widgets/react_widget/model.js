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

exports.fetch = function(service, callback) {
  var widget = this,
      jsonData = {},
      response = {id: service.id, name: service.name};

  utils.when(
    function(done) {
      console.log('endpoint 1')
      var path = '/invoices.json?client_type=Company&client_id=92815';
      widget.fetchAPI('invoices', service, path, jsonData, done);
    }
  ).then(function() {
    response.results = widget.translate(jsonData, service);
    response.error = jsonData.error;
    callback(response)
  });
};

// Fetch issues from service endpoint
exports.fetchAPI = function(name, service, path, jsonData, done) {
  var options = this.options(service, path);
  console.log('GETTING: ' + name);

  var req = https.get(options, function(res) {
    if (res.statusCode == 200) {
      var data = "";
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function() {
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
exports.translate = function(data, service) {
  // date, invoice_no, amount, due, status
  var invoices = data.invoices.map(function(invoice) {
    return {
      type: 'invoice',
      id: JSON.stringify(invoice.id),
      attributes: {
        date: invoice.invoice_date,
        amount: invoice.total,
        due: invoice.due_date,
        status: status(invoice)
      }
    }
  });

  var response = {
    data: invoices
  };

  return response;

  function status(invoice) {
    if (invoice.has_been_paid) {
      return 'Paid'
    } else if (invoice.has_been_sent) {
      return 'Sent'
    } else {
      return 'New'
    }
  }
};

// Write fetched results to db
exports.write = function() {
};
