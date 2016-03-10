var https = require('https');
var http = require('http');

// Fetch issues from service endpoint
exports.createFetchAPI = function(proto, options) {
  if (proto === 'https') {
    return function(name, path, jsonData, done) {
      console.log('GETTING: ' + name);
      var req = https.get(Object.assign({}, options, {path}), successHandler(name, jsonData, done)).on('error', errorHandler(name, jsonData, done));
    };
  } else {
    return function(name, path, jsonData, done) {
      console.log('GETTING: ' + name);
      var req = http.get(Object.assign({}, options, {path}), successHandler(name, jsonData, done)).on('error', errorHandler(name, jsonData, done));
    };
  }

  function successHandler(name, jsonData, done) {
    return function(res) {
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
    }
  }

  function errorHandler(name, jsonData, done) {
    return function(e) {
      console.log('DONE: ' + name);
      console.log("Got error: " + e.message);
      jsonData.error = e.message;
      done();
    }
  }
};

/**
 * Creates update functions for sending messages to Socket.IO
 * @param {String} serviceId
 * @param {Function} callback
 * @returns {{updateData: {Function} updateData, updateError: {Function} updateError, updateStatus: {Function} updateStatus}}
 */
exports.updates = function(serviceId, callback) {
  return {
    updateData: function(data) {
      callback({serviceId, data})
    },
    updateError: function(msg) {
      callback({serviceId, error: msg})
    },
    updateStatus: function(msg) {
      callback({serviceId, status: msg})
    }
  };
};
