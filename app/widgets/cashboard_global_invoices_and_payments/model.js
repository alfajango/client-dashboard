var https = require('https');
var translateInvoices = require('../invoices/model').translate;
var translatePayments = require('../payments/model').translate;

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

exports.fetch = function(service, callback, settings) {
  var widget = this,
    response = {
      serviceId: service.id
    },
    clientData = {};

  if (settings.clientId) {
    getInvoicesPayments(settings.clientId);
  } else {
    getClients();
  }

  function updateData(data) {
    callback(Object.assign({}, response, {
      data: data
    }))
  }

  function updateError(msg) {
    callback(Object.assign({}, response, {
      error: msg
    }));
  }

  function updateStatus(msg) {
    callback(Object.assign({}, response, {
      status: msg
    }));
  }

  function getInvoicesPayments(clientId) {
    var data = {};
    utils.when(
      function(done) {
        var path = '/invoices.json?client_type=Company&client_id=' + clientId;
        widget.fetchAPI('invoices', service, path, data, done);
      }
    ).then(function() {
      if (data.error) {
        updateError(data.error);
      } else {
        updateData(translateInvoices(data.data));
      }
    });
    utils.when(
      function(done) {
        var path = '/payments.json?client_type=Company&client_id=' + clientId;
        widget.fetchAPI('payments', service, path, data, done);
      }
    ).then(function() {
      if (data.error) {
        updateError(data.error);
      } else {
        updateData(translatePayments(data.data));
      }
    });
  }

  function getClients() {
    var clientData = {};
    utils.when(
      function(done) {
        updateStatus('Looking up client list');
        var path = '/client_companies';
        widget.fetchAPI('client list', service, path, clientData, done);
      }
    ).then(function() {
      if (clientData.error) {
        updateError('Client list could not be retrieved')
      } else {
        updateData(widget.translate(clientData.data));
      }
    })
  }
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
          jsonData.data = JSON.parse(data);
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
  data = data.map(function(client) {
    return {
      id: JSON.stringify(client.id),
      attributes: {
        name: client.name
      }
    }
  });
  return {
    type: 'client',
    data
  }
};

// Write fetched results to db
exports.write = function() {
};
