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
    clientData = {};

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
  return data.map(function(client) {
    return {
      type: 'client',
      id: JSON.stringify(client.id),
      attributes: {
        name: client.name
      }
    }
  });
};

// Write fetched results to db
exports.write = function() {
};
