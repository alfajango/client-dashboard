// THIS WORKS, BUT DESIRED VALUE IS NOT YET AVAILABLE VIA API.
// SEE http://forum.getcashboard.com/forums/7/topics/2341
// CURRENTLY RETURNS ALL LINE ITEMS FOR PROJECT, WHICH ISN'T WHAT WE WANT.
var https = require('https');

// Fetch issues from service endpoint
exports.fetch = function(service, callback) {
  var auth = 'Basic ' + new Buffer(service.user + ':' + service.token).toString('base64');
  var options = {
    host: service.url || 'api.cashboardapp.com',
    port: 443,
    path: '/line_items.json?project_id=' + service.identifier,
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
        var resData = JSON.parse(data);
        callback({cashboard: resData});
      });
    }
  }).on('error', function(e) {
    console.log("Got error: " + e.message);
    callback({cashboard: null});
  });
};

// Translate fetched response to db store format
exports.translate = function() {
};

// Write fetched results to db
exports.write = function() {
};
