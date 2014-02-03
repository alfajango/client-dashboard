var Client = mongoose.model('Client');

module.exports = function(app) {
  var ensureClient = function(req, res, next) {
    var clientQuery;
    if (req.user.admin && req.query.client_id) {
      clientQuery = Client.findById(req.query.client_id);
    } else if (req.user.admin) {
      req.flash('warn', "Choose a client");
      res.redirect('/admin');
    } else {
      clientQuery = Client.findById(req.user.client);
    }
    clientQuery.exec(function(err, client) {
      if (err) {
        console.log(err);
      } else {
        req.client = client;
        if (client.projects.length) {
          if (client.projects.length === 1) {
            req.project = client.projects[0];
          } else {
            var projectIds = client.projects.map( function(p) { return p.id; } );
            if (req.query.project_id && projectIds.indexOf(req.query.project_id) > -1) {
              req.project = _.find(client.projects, function(p) { return p.id == req.query.project_id });
            } else {
              req.flash('info', "Choose a project");
              res.redirect('/choose?client_id=' + client.id);
            }
          }
        } else {
          req.flash('warn', "No projects found for you");
          res.redirect('/login');
        }
      }
      next();
    });
  };

  var getProjects = function(req, res, next) {
    var clientQuery;
    if (req.user.admin && req.query.client_id) {
      clientQuery = Client.findById(req.query.client_id);
    } else if (req.user.admin) {
      req.flash('warn', "Choose a client");
      res.redirect('/admin');
    } else {
      clientQuery = Client.findById(req.user.client);
    }
    clientQuery.exec(function(err, client) {
      if (err) {
        console.log(err);
      } else {
        req.client = client;
        req.projects = req.client.projects;
      }
      next();
    });
  };

  /*
   * GET home page.
   */

  app.get('/', auth.ensureAuthenticated, ensureClient, function(req, res){
    res.render('home/index', {
      title: req.project.name + ' Status',
      message: req.flash(),
      theClient: req.client,
      project: req.project,
      serviceData: {}
    });
  });

  app.get('/choose', auth.ensureAuthenticated, getProjects, function(req, res) {
    res.render('home/choose', {
      title: req.client.name + ' Projects',
      message: req.flash(),
      theClient: req.client,
      projects: req.projects,
      serviceData: {}
    });
  });

  // TODO: Namespace the return object per user,
  // so we don't get crossed messages!
  io.sockets.on('connection', function(socket) {
    socket.on('service', function(data) {
      Client.findById(data.client, function(err, client) {
        if (client) {
          var project = client.projects.id(data.project),
              service = project.services.id(data.id);

          service.fetch( function(response) {
            socket.emit('serviceResponse', response);
          }, data.settings);
        }
      });
    });
  });

};
