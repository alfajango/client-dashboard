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

exports = module.exports = passport = require('passport');
exports = module.exports = passwordHash = require('password-hash');
exports = module.exports = cookieParser = require('cookie-parser');

module.exports = function(app, options) {
  if (!options) {
    options = {};
  }

  // Load configurations
  var config_file = require('yaml-config');
  exports = module.exports = config = config_file.readConfig('./config.yaml');
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
  require(__dirname + '/lib/db-connect');

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
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(middleware.setLocals);
  app.use(flash());
};

var webpack = require("webpack");

// returns a Compiler instance
var compiler = webpack({
  debug: true,
  noInfo: false,
  entry: './app/src/app',
  output: {
    path: 'public/javascripts',
    publicPath: '',
    filename: 'app.js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      //include: './app/containers',
      loaders: ['babel']
    }]
  }
});

//compiler.run(function(err, stats) {
//  // ...
//  console.log(err)
//  console.log(stats.compilation.errors[0])
//});

compiler.watch({ // watch options:
  aggregateTimeout: 300, // wait so long for more changes
  poll: true // use polling instead of native watchers
  // pass a number to set the polling interval
}, function(err, stats) {
  if (stats.compilation.errors.length > 0) {
    console.log(stats.compilation.errors)
  }
  console.log('recompiled')
});
