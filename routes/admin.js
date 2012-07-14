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
    Client.find({}, function(err, clients) {
      res.render('admin_create_user', {
        title: 'Admin',
        message: req.flash(),
        clients: clients
      });
    });
  });

  app.post('/admin/create_user', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    new User(req.body.user).save( function(err, user) {
      if (err) {
        res.render('admin_create_user', {
          title: 'Admin',
          message: { error: 'User could not be saved: ' + err }
        });
      } else {
        req.flash('info', "Success!");
        res.redirect('/admin');
      }
    });
  });

  app.get('/admin/create_client', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    res.render('admin_create_client', {
      title: 'Admin',
      message: req.flash()
    });
  });

  app.post('/admin/create_client', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    new Client(req.body.client).save( function(err, client) {
      if (err) {
        res.render('admin_create_client', {
          title: 'Admin',
          message: { error: 'Client could not be saved: ' + err }
        });
      } else {
        req.flash('info', "Success!");
        res.redirect('/admin');
      }
    });
  });
};
