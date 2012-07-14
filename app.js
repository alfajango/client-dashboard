
/**
 * Module dependencies.
 */

var express = require('express'),
  http = require('http'),
  fs = require('fs'),
  flash = require('connect-flash');

auth = require('./authentication');

// Load configurations
var config_file = require('yaml-config')
exports = module.exports = config = config_file.readConfig('./config.yaml')

var app = express();

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser()); 
  app.use(express.session({ secret: 'my app secret' }));
  app.use(express.static(__dirname + '/public'));
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(flash());
  app.use(app.router);
});

// Load environment-specific config
app.configure('development', function(){
  app.use(express.errorHandler());
});

// Connect to db and load models
require('./db-connect');

// Load models
require('./schemas.js');

var models_path = './models',
    models_files = fs.readdirSync(models_path);

models_files.forEach(function(file) {
  require(models_path + '/' + file);
});

// Load routes
var routes_path = './routes',
    routes_files = fs.readdirSync(routes_path);

routes_files.forEach(function(file) {
  require(routes_path + '/' + file)(app);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
