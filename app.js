
/**
 * Module dependencies.
 */

var express = require('express'),
  http = require('http'),
  app = express();

require('./config')(app);

utils = require(__dirname + '/lib/utils');
_ = require('underscore');
auth = require(__dirname + '/lib/authentication');

process.on('uncaughtException', function (err) {
  console.error(err);
  console.log("Node NOT Exiting...");
});

var server = app.listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});

io = require('socket.io').listen(server);

// Needed for Heroku, which does not yet support websockets,
// must use long polling.
io.configure(function() {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
});

// Load models
var models = require(__dirname + '/app/models');
// Load controllers, passing `app` context
var controllers = require(__dirname + '/app/controllers')(app);
