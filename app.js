
/**
 * Module dependencies.
 */

var express = require('express'),
  http = require('http'),
  app = express(),
  cookie = require('cookie'),
  connect = require('connect');

//require('./config')(app);

var utils = require(__dirname + '/lib/utils');
import _ from 'underscore';
import cookieParser from 'cookie-parser'
import config from './config'
import webpack from 'webpack'
config(app)
//config(app);
//_ = require('underscore');
//var auth = require(__dirname + '/lib/authentication');

//process.on('uncaughtException', function (err) {
  //console.error(err);
  //console.log("Node NOT Exiting...");
//});

var server = app.listen(app.get('port'), function() {
  console.log("Express server listening on port " + app.get('port'));
});

import io from 'socket.io';
export const socket = io({"transports": ["xhr-polling"], "polling duration": 10,'log level': 1 }).listen(server);

socket.set('authorization', function (handshakeData, accept) {
  if (handshakeData.headers.cookie) {
    handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);
    handshakeData.sessionID = cookieParser.signedCookie(handshakeData.cookie['express.sid'], config.app_secret);

    if (handshakeData.cookie['express.sid'] == handshakeData.sessionID) {
      return accept('Cookie is invalid.', false);
    }
  } else {
    return accept('No cookie transmitted.', false);
  }
  accept(null, true);
});



// Load models
var models = require(__dirname + '/app/models');
// Load controllers, passing `app` context
var controllers = require(__dirname + '/app/controllers')(app);
// Load widgets
var active_widgets = ['cashboard_global_billable_time', 'cashboard_global_receivable', 'cashboard_uninvoiced_amounts', 'errbit_unresolved_exceptions', 'redmine_open_issues', 'aremysitesup_instant_status', 'semaphore_build_status', 'redmine_documents', 'invoices_and_payments'];
var widgets = require(__dirname + '/app/widgets')(active_widgets);

app.get('/widgets/:widget', function(req, res) {
  var widget = req.params.widget;
  res.sendFile(__dirname + '/app/widgets/' + widget + '/' + widgets[widget].update);
});

// returns a Compiler instance
var compiler = webpack({
  debug: true,
  noInfo: false,
  entry: './app/containers/App',
  output: {
    path: 'public/javascripts',
    publicPath: '',
    filename: 'components.js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      //include: './app/containers',
      loaders: ['babel']
    }]
  }
});

compiler.run(function(err, stats) {
  // ...
  console.log(err)
  //console.log('error:', stats.compilation.errors[0])
});
// or
//compiler.watch({ // watch options:
//  aggregateTimeout: 300, // wait so long for more changes
//  poll: true // use polling instead of native watchers
//  // pass a number to set the polling interval
//}, function(err, stats) {
//  // ...
//});
