var Client = mongoose.model('Client');
var Project = mongoose.model('Project');
var Service = mongoose.model('Service');

module.exports = function(app) {
  app.get('/admin', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    var users, clients;
    utils.when(
      function(done) {
        User.find({}, function(err, collection) {
          // Sort users by client
          users = _.reduce(collection, function(memo, user) {
            var client = user.client || 'not assigned';
            if (memo[client]) {
              memo[client].push(user);
            } else {
              memo[client] = [user];
            }
            return memo;
          }, {});
          done();
        });
      }
    ).then(function() {
      res.render('admin/index', {
        title: 'Admin',
        message: req.flash(),
        users: users
      });
    });
  });

  app.param('id', function(req, res, next, id){
    var model, isClient;
    if ( req.url.indexOf("admin/users") != -1 ) {
      model = User;
    } else if (req.url.indexOf("admin/clients") != -1 ) {
      // TODO: Is there some way to get "Client" from model instance?
      isClient = true;
      model = Client;
    } else {
      next()
    }

    model
      .findById(id, function(err,foundModel) {
        if (err) { return next(err); }
        if (!foundModel) { return next(new Error('Failed to load resource: ' + id)); }
        req.resource = foundModel;
        if (isClient && req.params.project_id) {
          req.project = foundModel.projects.id(req.params.project_id);
          if (req.params.service_id) {
            req.service = req.project.services.id(req.params.service_id);
          }
        }
        next();
      });
  });

  // Users
  //----------------------------

  app.get('/admin/users/new', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    Client.find().sort('name', 1).exec(function(err, clients) {
      res.render('admin/user_new', {
        title: 'New User',
        message: req.flash(),
        clients: clients,
        user: null
      });
    });
  });

  app.post('/admin/users', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    // TODO: Figure out how to do this with mongoose setters,
    // couldn't get it working.
    if (req.body.user.client == "") {
      req.body.user.client = null;
    }

    // Keep this referenced so, so we can have typed values on error render
    var user = new User(req.body.user);
    user.save( function(err, savedUser) {
      if (err) {
        Client.find({}, function(clientErr, clients) {
          res.render('admin/user_new', {
            title: 'New User',
            message: { error: 'User could not be saved: ' + err },
            clients: clients,
            user: user
          });
        });
      } else {
        req.flash('success', "Success!");
        res.redirect('/admin');
      }
    });
  });

  app.get('/admin/users/:id/edit', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    Client.find().sort('name', 1).exec(function(err, clients) {
      res.render('admin/user_new', {
        title: 'Edit User',
        message: req.flash(),
        clients: clients,
        user: req.resource
      });
    });
  });

  app.put('/admin/users/:id', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    if (req.body.user.client == "") {
      req.body.user.client = null;
    }
    User.findById(req.resource.id, function(err, user) {
      for (attr in req.body.user) {
        user[attr] = req.body.user[attr];
      }
      user.save( function(err) {
        if (err) {
          Client.find({}, function(clientErr, clients) {
            res.render('admin/user_new', {
              title: 'Edit User',
              message: { error: "User could not be saved: " + err },
              clients: clients,
              user: req.resource
            });
          });
        } else {
          req.flash('success', "Success!");
          res.redirect('/admin');
        }
      });
    });
  });


  // Clients
  //----------------------------

  app.get('/admin/clients/new', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    res.render('admin/client_new', {
      title: 'New Client',
      message: req.flash(),
      theClient: null
    });
  });

  app.post('/admin/clients', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    new Client(req.body.client).save( function(err, client) {
      if (err) {
        res.render('admin/client_new', {
          title: 'New Client',
          message: { error: 'Client could not be saved: ' + err },
          theClient: req.resource
        });
      } else {
        req.flash('success', "Success!");
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
          message: { error: "Couldn't save client: " + err },
          theClient: req.resource
        });
      } else {
        req.flash('success', "Success!");
        res.redirect('/admin');
      }
    });
  });

  // Projects
  //----------------------------

  app.get('/admin/clients/:id/projects/new', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    res.render('admin/project_new', {
      title: 'New Project',
      message: req.flash(),
      theClient: req.resource,
      project: null
    });
  });

  app.post('/admin/clients/:id/projects', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    var project = new Project(req.body.project);
    req.resource.projects.push(project);
    req.resource.save( function(err) {
      if (err) {
        res.render('admin/project_new', {
          title: 'New Project',
          message: { error: 'Project could not be saved: ' + err },
          theClient: req.resource,
          project: null
        });
      } else {
        req.flash('success', "Success!");
        res.redirect('/admin');
      }
    });
  });

  app.get('/admin/clients/:id/projects/:project_id/edit', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    res.render('admin/project_new', {
      title: 'Edit Project',
      message: req.flash(),
      theClient: req.resource,
      project: req.project
    });
  });

  app.post('/admin/clients/:id/projects/:project_id', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    for (attr in req.body.project) {
      req.project[attr] = req.body.project[attr];
    }
    req.resource.save(function(err) {
      if (err) {
        res.render('admin/project_new', {
          title: 'Edit Project',
          message: { error: "Project could not be saved: " + err },
          theClient: req.resource,
          project: req.project
        });
      } else {
        req.flash('success', "Success!");
        res.redirect('/admin');
      }
    });
  });

  // Services
  //----------------------------

  app.get('/admin/clients/:id/projects/:project_id/services/new', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    res.render('admin/service_new', {
      title: 'New Service',
      message: req.flash(),
      theClient: req.resource,
      project: req.project,
      service: null
    });
  });

  app.post('/admin/clients/:id/projects/:project_id/services', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    var service = new Service(req.body.service);
    req.project.services.push(service);
    req.resource.save( function(err) {
      if (err) {
        res.render('admin/service_new', {
          title: 'New Service',
          message: { error: 'Service could not be saved: ' + err },
          theClient: req.resource,
          project: req.project,
          service: null
        });
      } else {
        req.flash('success', "Success!");
        res.redirect('/admin');
      }
    });
  });

  app.get('/admin/clients/:id/projects/:project_id/services/:service_id/edit', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    res.render('admin/service_new', {
      title: 'Edit Service',
      message: req.flash(),
      theClient: req.resource,
      project: req.project,
      service: req.service
    });
  });

  app.post('/admin/clients/:id/projects/:project_id/services/:service_id', auth.ensureAuthenticated, auth.ensureAdmin, function(req, res) {
    for (attr in req.body.service) {
      req.service[attr] = req.body.service[attr];
    }
    req.resource.save(function(err) {
      if (err) {
        res.render('admin/service_new', {
          title: 'Edit Service',
          message: { error: "Service could not be saved: " + err },
          theClient: req.resource,
          project: req.project,
          service: req.service
        });
      } else {
        req.flash('success', "Success!");
        res.redirect('/admin');
      }
    });
  });
};
