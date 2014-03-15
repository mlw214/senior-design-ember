exports.hasSession = function () {
  return function (req, res, next) {
    if (req.session.uid) next();
    else res.redirect('/auth/#signin');
  }
};

exports.compareSessionAndToken = function () {
  return function (req, res, next) {
    if (!req.uid || !req.session.uid || 
        req.uid.toString() !== req.session.uid.toString()) {
      res.json(401, { error: 'Unauthorized' });
    } else next();
  }
};