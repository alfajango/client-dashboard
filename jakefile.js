desc('Load app db and models');
task('app', [], function(params) {
  var fs = require('fs');
  var config_file = require('yaml-config')
  exports = module.exports = config = config_file.readConfig('./config.yaml')
  exports = module.exports = passport = require('passport');
  exports = module.exports = passwordHash = require('password-hash');
  require('./db-connect');
  require('./schemas.js');

  var models_path = './models',
  models_files = fs.readdirSync(models_path);

  models_files.forEach(function(file) {
    require(models_path + '/' + file);
  });
});

namespace('seed', function() {
  desc('Seed MongoDB with test user');
  task('users', ['app'], function (params) {
    User.find({email: "test@example.com"}).remove(function() {
      var u = new User();
      u.email = "test@example.com";
      u.password = "password";
      u.admin = true;
      return u.save(function(err) {
        if (err) {
          console.log("Oops, couldn't create test user! - " + err);
        } else {
          console.log("Test user created! login with test@example.com/password");
        }
        mongoose.connection.close()
        complete();
      });
    });
  }, {async: true});
});
