exports = module.exports = passport = require('passport');
exports = module.exports = passwordHash = require('password-hash');
var LocalStrategy = require('passport-local').Strategy;

passport.use(new LocalStrategy(
  {usernameField: 'email'},
  function(email, password, done) {
    User.findOne({ email: email }, function(err, user) {
      var noMatchMsg = "Email/password not found";
      if (err) { return done(err, false, { message: err }); }
      if (!user) { return done(err, false, { message: noMatchMsg }); }
      if (!passwordHash.verify(password, user.hashedPassword)) { return done(err, false, { message: noMatchMsg }); }
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

// Simple route middleware to ensure user is authenticated.
//   Use this route middleware on any resource that needs to be protected.  If
//   the request is authenticated (typically via a persistent login session),
//   the request will proceed.  Otherwise, the user will be redirected to the
//   login page.
exports.ensureAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  req.session.origPath = req.url;
  req.flash('warn', "You must login first");
  res.redirect('/login')
}

exports.ensureAdmin = function(req, res, next) {
  if (req.user.admin) { return next(); }
  req.flash('warn', "Unauthorized");
  res.redirect('/')
}
