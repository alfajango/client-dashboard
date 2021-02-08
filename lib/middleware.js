exports.ensureSSL = function(req, res, next) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://' + req.headers["host"] + req.url);
  } else {
    next();
  }
};

exports.setLocals = function(req, res, next) {
  var clients = null;
  var getClients = function(done) {
    if (req.user && req.user.admin) {
      var archived = req.query.archived == 'true' ? true : {"$ne": true};
      mongoose.model('Client').find({archived: archived})
        .sort({'name': 1})
        .exec( function(err, collection) {
          clients = collection;
          done()
        });
    } else {
      done();
    }
  };

  getClients(function() {
    res.locals({
      currentUser: req.user || {},
      analytics_account: config.analytics_account,
      clients: clients,
      archived: req.query.archived == 'true'
    });
    next();
  });
};
