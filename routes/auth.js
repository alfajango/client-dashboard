module.exports = function(app) {
  app.get('/login', function(req, res) {
    res.render('auth_login', {
      title: 'Login page',
      message: req.flash()
    });
  });

  // POST /login
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  //
  //   curl -v -d "email=bob@example.com&password=secret" http://127.0.0.1:3000/login
  //
  app.post(
    '/login',
    passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
    function(req, res) {
      res.redirect('/');
    }
  );

  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });
};
