var Client = mongoose.model('Client');

module.exports = function(app) {
  app.get('/admin', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    var users, clients;
    utils.when(
      function(done) {
        User.find({}, function(err, collection) {
          users = collection;
          done();
        });
      },
      function(done) {
        Client.find({}, function(err, collection) {
          clients = collection;
          done();
        });
      }
    ).then(function() {
      res.render('admin_index', {
        title: 'Admin',
        message: req.flash(),
        users: users,
        clients: clients
      });
    });

  });

  app.get('/admin/create_user', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    res.render('admin_create_user', {
      title: 'Admin',
      message: req.flash()
    });
  });

  app.post('/admin/create_user', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    // Create User
    res.redirect('/admin/create_user');
  });

  app.get('/admin/create_client', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    res.render('admin_create_client', {
      title: 'Admin',
      message: req.flash()
    });
  });

  app.post('/admin/create_client', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    // Create Client
    res.redirect('/admin');
  });
};
