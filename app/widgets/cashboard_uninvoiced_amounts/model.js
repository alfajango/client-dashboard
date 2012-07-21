var https = require('https');

// Fetch issues from service endpoint
exports.fetch = function(service, callback) {
  var cashboard = this;

  var auth = 'Basic ' + new Buffer(service.user + ':' + service.token).toString('base64');
  var options = {
    host: service.url || 'api.cashboardapp.com',
    port: 443,
    path: '/projects/' + service.identifier + '.json',
    headers: {
      'Accept': 'application/json',
      'Authorization': auth
    }
  };

  var req = https.get(options, function(res) {
    if (res.statusCode == 200) {
      var data = "";
      res.on('data', function(chunk) {
        data += chunk;
      });
      res.on('end', function(){
        try {
        var resData = JSON.parse(data),
            out = cashboard.translate(resData);
        } catch (err) {
          console.log("Got a parsing error: " + err.message);
          out = {cashboard_uninvoiced_amounts: [], error: err.message};
        }
        callback(out);
      });
    }
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    callback({cashboard_uninvoiced_amounts: [], error: e.message});
  });
};

// Translate fetched response to db store format
exports.translate = function(data) {
  return {
    cashboard_uninvoiced_amounts: {
      invoice: data.uninvoiced_item_cost,
      expenses: data.uninvoiced_expense_cost
    }
  };
};

// Write fetched results to db
exports.write = function() {
};
