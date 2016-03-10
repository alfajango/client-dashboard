var translateInvoices = require('../invoices/model').translate;
var translatePayments = require('../payments/model').translate;
var ioutils = require ('../ioutils');

exports.fetch = function(service, callback, settings) {
  var fetchAPI = ioutils.createFetchAPI('https', options(service));
  var io = ioutils.updates(service.id, callback);

  if (settings.clientId) {
    getInvoicesPayments(settings.clientId);
  } else {
    getClients();
  }

  function getInvoicesPayments(clientId) {
    var data = {};
    utils.when(
      function(done) {
        var path = '/invoices.json?client_type=Company&client_id=' + clientId;
        fetchAPI('invoices', path, data, done);
      }
    ).then(function() {
      if (data.error) {
        io.updateError(data.error);
      } else {
        io.updateData(translateInvoices(data.data));
      }
    });
    utils.when(
      function(done) {
        var path = '/payments.json?client_type=Company&client_id=' + clientId;
        fetchAPI('payments', path, data, done);
      }
    ).then(function() {
      if (data.error) {
        io.updateError(data.error);
      } else {
        io.updateData(translatePayments(data.data));
      }
    });
  }

  function getClients() {
    var clientData = {};
    utils.when(
      function(done) {
        io.updateStatus('Looking up client list');
        var path = '/client_companies';
        fetchAPI('client list', path, clientData, done);
      }
    ).then(function() {
      if (clientData.error) {
        io.updateError('Client list could not be retrieved, callback')
      } else {
        io.updateData(translate(clientData.data));
      }
    })
  }
};

// Translate fetched response to db store format
function translate(data) {
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
}

function options(service) {
  var auth = 'Basic ' + new Buffer(service.user + ':' + service.token).toString('base64');
  return {
    host: service.url || 'api.cashboardapp.com',
    port: 443,
    headers: {
      'Accept': 'application/json',
      'Authorization': auth
    }
  };
}
