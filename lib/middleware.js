exports.ensureSSL = function(req, res, next) {
  if (req.headers['x-forwarded-proto'] !== 'https') {
    res.redirect('https://' + req.headers["host"] + req.url);
  } else {
    next();
  }
};

exports.setLocals = function(req, res, next) {
  res.locals({
    currentUser: req.user || {},
    analytics_account: config.analytics_account
  });
  next();
};
