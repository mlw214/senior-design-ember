exports.interalError = function (err, req, res, next) {
  console.error(err);
  res.json(500, { error: 'Internal server error' });
};