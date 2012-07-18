exports.setLocals = function(req, res, next) {
  res.locals({
    currentUser: req.user || {}
  });
  next();
};
