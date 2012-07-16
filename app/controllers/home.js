var Client = mongoose.model('Client');

module.exports = function(app) {
  var ensureClient = function(req, res, next) {
    var clientQuery;
    if (req.user.admin) {
      clientQuery = Client.findById(req.query.client_id);
    } else {
      clientQuery = Client.findById(req.user.client);
    }
    clientQuery.exec(function(err, client) {
      if (err) {
        console.log(err);
      } else {
        if (client.projects.length) {
          if (client.projects.length === 1) {
            req.project = client.projects[0];
          } else {
            req.flash('info', "Choose a project");
            res.redirect('/choose');
          }
        } else {
          req.flash('warn', "No projects found for you");
          res.redirect('/login');
        }
      }
      next();
    });
  };

  /*
   * GET home page.
   */

  app.get('/', auth.ensureAuthenticated, ensureClient, function(req, res){
    res.render('home/index', {
      title: req.project.name + ' Dashboard',
      message: req.flash(),
      admin: req.user.admin
    });
  });

  app.get('/choose', auth.ensureAuthenticated, function(req, res) {
  });

};
