var User = require('../models/user'),
    createToken = require('../lib/create-token');

exports.create = function (req, res) {
  var data = req.body;
  User.authenticateByUsername(data.username, data.password, 
                              function (err, user) {
    if (err) return next(err);
    if (user) {
      req.session.uid = user.id;
      req.session.username = user.username;
      res.json({ token: createToken({ uid: req.session.uid }) });
    } else {
      res.json(401, { error: 'Invalid username or password' });
    }
  });
}

exports.delete = function (req, res, next) {
  req.session.destroy(function (err) {
    if (err) return next(err);
    res.send();
  });
};