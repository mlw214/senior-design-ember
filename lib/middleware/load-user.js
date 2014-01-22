var User = require('../../models/user');

module.exports = function () {
  return function (req, res, next) {
    var uid = req.session.uid;
    User.findById(uid, function (err, doc) {
      if (err) return next(err);
      res.locals.contact = doc.contact;
      next();
    });
  };
};