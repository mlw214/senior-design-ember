module.exports = function () {
  return function (req, res, next) {
    if (req.id.toString() === req.params.id.toString()) {
      next();
    } else {
      console.log(req.id);
      console.log(req.params.id);
      res.json(401, { error: 'Unauthorized' });
    }
  }
};