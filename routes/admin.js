var Client = mongoose.model('Client');
var Project = mongoose.model('Project');

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

  app.param('id', function(req, res, next, id){
    var model;
    if ( req.url.indexOf("admin/user") != -1 ) {
      model = User;
    } else if (req.url.indexOf("admin/client") != -1 ) {
      model = Client;
    } else {
      model = Project;
    }

    model
      .findById(id)
      .run( function(err,foundModel) {
        if (err) { return next(err); }
        if (!foundModel) { return next(new Error('Failed to load resource: ' + id)); }
        req.resource = foundModel;
        next();
      });
  });

  // Admin users
  //----------------------------

  app.get('/admin/users/new', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    Client.find({}, function(err, clients) {
      res.render('admin_user_new', {
        title: 'Admin',
        message: req.flash(),
        clients: clients,
        user: null
      });
    });
  });

  app.post('/admin/user', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    new User(req.body.user).save( function(err, user) {
      if (err) {
        res.render('admin_user_new', {
          title: 'Admin',
          message: { error: 'User could not be saved: ' + err }
        });
      } else {
        req.flash('info', "Success!");
        res.redirect('/admin');
      }
    });
  });

  app.get('/admin/users/:id/edit', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    Client.find({}, function(err, clients) {
      res.render('admin_user_new', {
        title: 'Edit User',
        message: req.flash(),
        clients: clients,
        user: req.resource
      });
    });
  });

  app.put('/admin/user/:id', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    User.update({_id: req.resource.id}, req.body.user, function(err, numAffected) {
      if (err) {
        Client.find({}, function(err, clients) {
          res.render('admin_user_new', {
            title: 'Edit User',
            message: "Couldn't save user: " + err,
            clients: clients,
            user: req.resource
          });
        });
      } else {
        req.flash('info', "Success!");
        res.redirect('/admin');
      }
    });
  });


  //Admin clients
  //----------------------------

  app.get('/admin/clients/new', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    res.render('admin_client_new', {
      title: 'Admin',
      message: req.flash()
    });
  });

  app.post('/admin/client', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    new Client(req.body.client).save( function(err, client) {
      if (err) {
        res.render('admin_client_new', {
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
