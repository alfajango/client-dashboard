module.exports = function(app) {

  // POST /login
  //   Use passport.authenticate() as route middleware to authenticate the
  //   request.  If authentication fails, the user will be redirected back to the
  //   login page.  Otherwise, the primary route function function will be called,
  //   which, in this example, will redirect the user to the home page.
  //
  //   curl -v -d "username=bob&password=secret" http://127.0.0.1:3000/login
  //
  app.post(
    '/login', 
    passport.authenticate('local', { failureRedirect: '/login', failureFlash: true }),
    function(req, res) {
      res.redirect('/');
    }
  );
};
