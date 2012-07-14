module.exports = function(app) {
  var User = mongoose.model('User');

  /*
   * GET home page.
   */

  app.get('/', function(req, res, mongoose){
    res.render('index', {
      title: 'Alfa Jango Client Dashboard',
      users: User.find({}),
      message: req.flash()
    });
  });

};
