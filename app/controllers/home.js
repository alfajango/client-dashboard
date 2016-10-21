var Client = mongoose.model('Client'),
    Project = mongoose.model('Project'),
    User = mongoose.model('User'),
    MongoStore = require('connect-mongodb-session')(express);

module.exports = function(app) {
  var ensureClient = function(req, res, next) {
    var clientQuery;
    if (req.user.admin && req.query.client_id) {
      clientQuery = Client.findById(req.query.client_id);
    } else if (req.user.admin) {
      req.flash('warn', "Choose a client");
      return res.redirect('/admin');
    } else {
      clientQuery = Client.findById(req.user.client);
    }
    clientQuery.exec(function(err, client) {
      if (err) {
        console.log(err);
        next();
      } else {
        req.client = client;
        if (client.projects.length) {
          if (client.projects.length === 1) {
            req.project = client.projects[0];
            next();
          } else {
            var projectIds = client.projects.map( function(p) { return p.id; } );
            if (req.query.project_id && projectIds.indexOf(req.query.project_id) > -1) {
              req.project = _.find(client.projects, function(p) { return p.id == req.query.project_id });
              next();
            } else {
              var projectIds = client.projects.map(function(p) {
                return p.id;
              });
              if (req.query.project_id && projectIds.indexOf(req.query.project_id) > -1) {
                req.project = _.find(client.projects, function(p) {
                  return p.id == req.query.project_id
                });
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
      }
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

  app.get('/proxy/:widget', auth.ensureAuthenticated, getProjects, function(req, res) {
    var project = req.projects.id(req.query.project_id),
        service = project.services.id(req.query.service_id),
        proxyFunction = service.proxies()[req.query.proxy];

    proxyFunction(service, req, res);
  });

  // TODO: Namespace the return object per user,
  // so we don't get crossed messages!
  io.sockets.on('connection', function(socket) {
    // reference to my initialized sessionStore in app.js
    var sessionStore = new MongoStore({db:mongoose.connection.db});
    var sessionId    = socket.request.sessionID;

    sessionStore.get(sessionId, function(err, session) {
      if( ! err) {
        if(session.passport.user) {
          User.findById(session.passport.user, function(err, user) {
            if (! err) {
              socket.on('service', function(data) {
                var clientQuery;
                if (user.admin && data.client) {
                  clientQuery = Client.findById(data.client);
                } else if (user.admin) {
                  socket.emit('error', {type: 'warn', msg: "Choose a client", location: '/admin'});
                } else {
                  clientQuery = Client.findById(user.client);
                }
                clientQuery && clientQuery.exec(function(err, client) {
                  if (client) {
                    var project = client.projects.id(data.project),
                    service = project.services.id(data.id);
                    Object.assign( data.settings, { user: user.email } );
                    service.fetch( function(response) {
                      socket.emit('serviceResponse', response);
                    }, data.settings);
                  }
                });
              });
              console.log("Now listening for service events");
              socket.emit('listening', {});
            } else {
              console.log("Couldn't find user", err);
            }
          });
        } else {
          console.log(data);
          socket.emit('error', {type: 'warn', msg: "Please log back in", location: '/login'});
        }
      } else {
        console.log(err);
      }
    });
  });

};
