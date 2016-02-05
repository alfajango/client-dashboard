var express = require('express'),
  MongoStore = require('connect-mongodb'),
  mongoose = require('mongoose'),
  flash = require('connect-flash'),
  errorhandler = require('errorhandler'),
  favicon = require('serve-favicon'),
  morgan = require('morgan'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  session = require('express-session'),
  middleware = require(__dirname + '/lib/middleware');

import passport from 'passport';
import passwordHash from 'password-hash';
import cookieParser from 'cookie-parser';
import yamlConfig from 'yaml-config';
import Schema from 'mongoose';
//import ObjectId from 'mongoose.Schema';
//exports = ObjectId = Schema.ObjectId;
//exports = module.exports = passport = require('passport');
//exports = module.exports = passwordHash = require('password-hash');
//exports = module.exports = cookieParser = require('cookie-parser');
//export var config = yamlConfig.readConfig('./config.yaml');

export default function(app, options) {
  if (!options) {
    options = {};
  }

  // Load configurations
  //var config_file = require('yaml-config');
  var config = yamlConfig.readConfig('./config.yaml');
  //exports = module.exports = config = config_file;
  var env = process.env.NODE_ENV || 'development';

  // Load environment-specific config
  if ('development' == env) {
    app.use(errorhandler());
  }

  if ('production' == env) {
    // TODO: Figure out a way to load config.yaml through EJS,
    // so this can be added there for production environment,
    // instead of just overriding it like this.
    config.db.uri = process.env.MONGOHQ_URL;
    config.app_secret = process.env.APP_SECRET;
    config.analytics_account = process.env.ANALYTICS_ACCOUNT
  }

  // Connect to db and load models
  //require(__dirname + '/lib/db-connect');

  //import * as mongoose from 'mongoose';
//exports = mongoose = require('mongoose');
  mongoose.connect(config.db.uri);
  //exports = Schema = mongoose.Schema;
  //exports = ObjectId = Schema.ObjectId;

  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/app/views');
  app.set('view engine', 'jade');
  app.set('view options', {layout: __dirname + '/app/views/layouts/application'});
  if (config.useSSL) {
    app.use(middleware.ensureSSL);
  }
  app.use(favicon(__dirname + '/public/favicon.ico'));
  //app.use(morgan('combined'));
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(bodyParser.json());
  app.use(methodOverride(function(req, res) {
    if (req.body && typeof req.body === 'object' && '_method' in req.body) {
      // look in urlencoded POST bodies and delete it
      var method = req.body._method
      delete req.body._method
      return method
    }
  }));
  //console.log(cookieParser);
  //cookieParser.default();
  app.use(cookieParser());
  // Needed because otherwise, connect-mongodb won't
  // close the mongodb connection when jake script is done.
  if (!options.skipSession) {
    app.use(session({
      key: 'express.sid',
      secret: config.app_secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: ('production' == env),
        maxAge: new Date(Date.now() + 3600000)
      },
      store: new MongoStore(
        {db: mongoose.connection.db},
        function(err) {
          if (err) {
            console.log(err);
          }
        }
      )
    }));
  }
  app.use(express.static(__dirname + '/public'));
  //console.log(passport)

  app.use(passport.initialize());
  app.use(passport.session());
  app.use(middleware.setLocals);
  app.use(flash());
};
