module.exports = function(app) {
  app.get('/admin', function(req, res) {
    res.render('admin_index', {title: 'Admin'});
  });

  app.get('/admin/create_user', function(req, res) {
    res.render('admin_create_user', {title: 'Admin'});
  });

  app.post('/admin/create_user', function(req, res) {
    res.redirect('/admin/create_user');
  });

  app.get('/admin/create_client', function(req, res) {
    res.render('admin_create_client', {title: 'Admin'});
  });

  app.post('/admin/create_client', function(req, res) {
    res.redirect('/admin');
  });
};
