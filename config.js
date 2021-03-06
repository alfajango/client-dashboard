var exports = module.exports = express = require('express'),
    MongoStore = require('connect-mongodb-session')(express);
    flash = require('connect-flash'),
    middleware = require(__dirname + '/lib/middleware');

exports = module.exports = passport = require('passport');
exports = module.exports = passwordHash = require('password-hash');

module.exports = function(app, options) {
  if (!options) { options = {}; }

  // Load configurations
  var config_file = require('yaml-config');
  exports = module.exports = config = config_file.readConfig('./config.yaml')

  // Load environment-specific config
  app.configure('development', function(){
    app.use(express.errorHandler());
  });

  app.configure('production', function(){
    // TODO: Figure out a way to load config.yaml through EJS,
    // so this can be added there for production environment,
    // instead of just overriding it like this.
    config.db.uri = process.env.MONGODB_URI;
    config.app_secret = process.env.APP_SECRET;
    config.analytics_account = process.env.ANALYTICS_ACCOUNT
  });

  // Connect to db and load models
  require(__dirname + '/lib/db-connect');

  app.configure(function(){
    app.set('port', process.env.PORT || 3000);
    app.set('views', __dirname + '/app/views');
    app.set('view engine', 'jade');
    app.set('view options', { layout: __dirname + '/app/views/layouts/application' });
    if (config.useSSL) {
      app.use(middleware.ensureSSL);
    }
    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser());
    // Needed because otherwise, connect-mongodb won't
    // close the mongodb connection when jake script is done.
    if (process.env.MONGODB_URI !== 'undefined') {
      var mongodbUri = process.env.MONGODB_URI;
    } else {
      var mongodbUri = config.db.uri;
    }
    if (!options.skipSession) {
      app.use(express.session({
        key: 'express.sid',
        secret: config.app_secret,
        saveUninitialized: false,
        resave: true,
        maxAge: new Date(Date.now() + 3600000),
        store: new MongoStore({
          uri: mongodbUri,
          collection: 'new_sessions'
        })
      }));
    }
    app.use(express.static(__dirname + '/public'));
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(middleware.setLocals);
    app.use(flash());
    app.use(app.router);
  });
};
