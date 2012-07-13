
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Alfa Jango Client Dashboard' });
};
