exports = module.exports = passport = require('passport');
exports = module.exports = passwordHash = require('password-hash');

var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  {usernameField: 'email'},
  function(email, password, done) {
    var User = mongoose.model('User');
    User.findOne({ email: email }, function(err, user) {
      var noMatchMsg = "Email/password not found";
      if (err) { return done(err, false, { message: err }); }
      if (!user) { return done(err, false, { message: noMatchMsg }); }
      if (!user.verify(password, user.hashedPassword)) { return done(err, false, { message: noMatchMsg }); }
      return done(err, user);
    });
  }
));

// Passport session setup.
//   To support persistent login sessions, Passport needs to be able to
//   serialize users into and deserialize users out of the session.  Typically,
//   this will be as simple as storing the user ID when serializing, and finding
//   the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});
