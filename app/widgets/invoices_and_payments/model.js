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
      response = {meta: {serviceId: service.id, serviceName: service.name}};

  utils.when(
    function(done) {
      var path = '/invoices.json?client_type=Company&client_id=92815';
      widget.fetchAPI('invoices', service, path, jsonData, done);
    },
    function(done) {
      var path = '/payments.json?client_type=Company&client_id=92815';
      widget.fetchAPI('payments', service, path, jsonData, done);
    }
  ).then(function() {
    if (jsonData.error) {
      response.errors = [jsonData.error];
    } else {
      response.data = widget.translate(jsonData, service);
    }
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
        id: invoice.assigned_id,
        date: invoice.invoice_date,
        amount: Number(invoice.total),
        due: invoice.due_date,
        status: status(invoice)
      }
    }
  });

  // date, amount, type, notes
  var payments = data.payments.map(function(payment) {
    return {
      type: 'payment',
      id: JSON.stringify(payment.id),
      attributes: {
        id: payment.assigned_id,
        date: payment.created_on,
        amount: Number(payment.amount),
        notes: payment.notes
      }
    }
  });

  return invoices.concat(payments);

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
