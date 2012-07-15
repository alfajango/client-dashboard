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
      res.render('admin/index', {
        title: 'Admin',
        message: req.flash(),
        users: users,
        clients: clients
      });
    });
  });

  app.param('id', function(req, res, next, id){
    var model;
    if ( req.url.indexOf("admin/users") != -1 ) {
      model = User;
    } else if (req.url.indexOf("admin/clients") != -1 ) {
      model = Client;
    } else if (req.url.indexOf("admin/projects") != -1 ) {
      model = Project;
    } else {
      next()
    }

    model
      .findById(id)
      .exec( function(err,foundModel) {
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
      res.render('admin/user_new', {
        title: 'Admin',
        message: req.flash(),
        clients: clients,
        user: null
      });
    });
  });

  app.post('/admin/users', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    new User(req.body.user).save( function(err, user) {
      if (err) {
        res.render('admin/user_new', {
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
      res.render('admin/user_new', {
        title: 'Edit User',
        message: req.flash(),
        clients: clients,
        user: req.resource
      });
    });
  });

  app.put('/admin/users/:id', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    User.findById(req.resource.id, function(err, user) {
      for (attr in req.body.user) {
        user[attr] = req.body.user[attr];
      }
      user.save( function(err) {
        if (err) {
          Client.find({}, function(err, clients) {
            res.render('admin/user_new', {
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
  });


  //Admin clients
  //----------------------------

  app.get('/admin/clients/new', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    res.render('admin/client_new', {
      title: 'Admin',
      message: req.flash(),
      theClient: null
    });
  });

  app.post('/admin/clients', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    new Client(req.body.client).save( function(err, client) {
      if (err) {
        res.render('admin/client_new', {
          title: 'Admin',
          message: { error: 'Client could not be saved: ' + err },
          theClient: req.resource
        });
      } else {
        req.flash('info', "Success!");
        res.redirect('/admin');
      }
    });
  });

  app.get('/admin/clients/:id/edit', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    res.render('admin/client_new', {
      title: 'Edit Client',
      message: req.flash(),
      theClient: req.resource
    });
  });

  app.put('/admin/clients/:id', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    Client.update({_id: req.resource.id}, req.body.client, function(err, numAffected) {
      if (err) {
        res.render('admin/client_new', {
          title: 'Edit Client',
          message: "Couldn't save client: " + err,
          theClient: req.resource
        });
      } else {
        req.flash('info', "Success!");
        res.redirect('/admin');
      }
    });
  });
};
