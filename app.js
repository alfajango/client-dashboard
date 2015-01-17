
/**
 * Module dependencies.
 */

var express = require('express'),
  http = require('http'),
  app = express(),
  cookie = require('cookie'),
  connect = require('connect');

require('./config')(app);

utils = require(__dirname + '/lib/utils');
_ = require('underscore');
auth = require(__dirname + '/lib/authentication');

//process.on('uncaughtException', function (err) {
  //console.error(err);
  //console.log("Node NOT Exiting...");
//});

var server = app.listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});

io = require('socket.io').listen(server);

io.set('authorization', function (handshakeData, accept) {
  if (handshakeData.headers.cookie) {
    handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
    handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['express.sid'], config.app_secret);

    if (handshakeData.cookie['express.sid'] == handshakeData.sessionID) {
      return accept('Cookie is invalid.', false);
    }
  } else {
    return accept('No cookie transmitted.', false);
  }
  accept(null, true);
});

// Needed for Heroku, which does not yet support websockets,
// must use long polling.
io.configure(function() {
  io.set("transports", ["xhr-polling"]);
  io.set("polling duration", 10);
  app.configure('production', function(){
    io.set('log level', 1); // reduce logging
  });
});

// Load models
var models = require(__dirname + '/app/models');
// Load controllers, passing `app` context
var controllers = require(__dirname + '/app/controllers')(app);
// Load widgets
var active_widgets = ['cashboard_global_billable_time', 'cashboard_global_receivable', 'cashboard_uninvoiced_amounts', 'errbit_unresolved_exceptions', 'redmine_open_issues', 'aremysitesup_instant_status', 'semaphore_build_status', 'redmine_documents'];
widgets = require(__dirname + '/app/widgets')(active_widgets);

app.get('/widgets/:widget', function(req, res) {
  var widget = req.params.widget;
  res.sendfile('./app/widgets/' + widget + '/' + widgets[widget].update);
});
