var User = require('../models/user'),
    createToken = require('../lib/create-token');

exports.create = function (req, res, next) {
  var data = req.body;
  User.authenticateByUsername(data.username, data.password, 
                              function (err, user) {
    if (err) return next(err);
    if (user) {
      req.session.regenerate(function (err) {
        req.session.uid = user.id;
        req.session.username = user.username;
        req.session.contactInfo = {
          email: user.email,
          cellphone: user.cellphone,
          carrier: user.carrier
        };
        res.json({ token: createToken({ uid: req.session.uid }) });
      });
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