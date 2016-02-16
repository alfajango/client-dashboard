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
    response = {
      serviceId: service.id
    },
    projectId = service.identifier;

  if (service.identifier === '') {
    callback({
      errors: ['Missing service identifier clientId']
    })
  } else {
    var projectData = {};
    utils.when(
      function(done) {
        var path = '/projects/'+service.identifier;
        widget.fetchAPI('project', service, path, projectData, done);
      }
    ).then(function() {
      if (projectData.error) {
        callback({
          errors: ['projectId was not found']
        })
      } else {
        var data = {};
        utils.when(
          function(done) {
            var path = '/payments.json?client_type=Company&client_id=' + projectData.data.client_id;
            widget.fetchAPI('payments', service, path, data, done);
          }
        ).then(function() {
          if (data.error) {
            response.errors = [data.error];
          } else {
            response.data = widget.translate(data.data);
          }
          callback(response);
        });
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
          jsonData['data'] = JSON.parse(data);
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
  return data.map(function(payment) {
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
};

// Write fetched results to db
exports.write = function() {
};
