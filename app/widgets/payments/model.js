var ioutils = require('../ioutils');

exports.fetch = function(service, callback) {
  var widget = this;
  var fetchAPI = ioutils.createFetchAPI('https', options(service));
  var io = ioutils.updates(service, callback);

  if (service.identifier === '') {
    io.updateError('Missing service identifier clientId')
  } else {
    var projectData = {};
    utils.when(
      function(done) {
        io.updateStatus('Looking up project');
        var path = '/projects/'+service.identifier;
        fetchAPI('project', path, projectData, done);
      }
    ).then(function() {
      if (projectData.error) {
        io.updateError('projectId was not found')
      } else {
        var data = {};
        utils.when(
          function(done) {
            io.updateStatus('Loading payments');
            var path = '/payments.json?client_type=Company&client_id=' + projectData.data.client_id;
            fetchAPI('payments', path, data, done);
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
  data = data.map(function(payment) {
    return {
      id: JSON.stringify(payment.id),
      attributes: {
        id: payment.assigned_id,
        date: payment.created_on,
        amount: Number(payment.amount),
        notes: payment.notes
      }
    }
  });
  return {
    type: 'payment',
    data
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
