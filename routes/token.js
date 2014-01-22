var createToken = require('../lib/create-token'),
    User = require('../models/user');

exports.create = function (req, res, next) {
  var data = req.body;
  User.authenticate(data.username, data.password, function (err, user) {
    if (err) return next(err);
    if (user) {
      var token = createToken(user);
      res.json({ token: token });
    } else {
      res.json(401, { error: 'Invalid username or password' });
    }
  })
};