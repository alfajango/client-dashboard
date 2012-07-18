desc('Load app db and models');
task('app', [], function(params) {
  var express = require('express')
      app = express();
  require('./config')(app, {skipSession: true});
  require('./app/models');
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
