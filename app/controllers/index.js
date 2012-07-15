module.exports = function(app) {
  var User = mongoose.model('User');

  /*
   * GET home page.
   */

  app.get('/', auth.ensureAuthenticated, function(req, res, mongoose){
    User.find({}, function(err, users) {
      res.render('home/index', {
        title: 'Alfa Jango Client Dashboard',
        users: users,
        message: req.flash(),
        admin: req.user.admin
      });
    });
  });

};
