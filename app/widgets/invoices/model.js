var ioutils = require('../ioutils');

exports.fetch = function(service, callback) {
  var widget = this;
  var fetchAPI = ioutils.createFetchAPI('https', options(service));
  var io = ioutils.updates(service.id, callback);

  if (service.identifier === '') {
    io.updateError('Missing service identifier clientId')
  } else {
    var projectData = {};
    utils.when(
      function(done) {
        io.updateStatus('Looking up project');
        var path = '/projects/' + service.identifier;
        fetchAPI('project', path, projectData, done);
      }
    ).then(function() {
      if (projectData.error) {
        io.updateError('projectId was not found')
      } else {
        var data = {};
        utils.when(
          function(done) {
            io.updateStatus('Loading invoices');
            var path = '/invoices.json?client_type=Company&client_id=' + projectData.data.client_id;
            fetchAPI('invoices', path, data, done);
          }
        ).then(function() {
          if (data.error) {
            io.updateError(data.error);
          } else {
            io.updateData(widget.translate(data.data));
          }
        });
      }
    })
  }
};

// Translate fetched response to db store format
exports.translate = function(data) {
  data = data.map(function(invoice) {
    return {
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

  return {
    type: 'invoice',
    data
  };

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
