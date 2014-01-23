var jwt = require('jsonwebtoken'),
    fs = require('fs'),
    cert = fs.readFileSync(__dirname + '/../../security/token.pub');

module.exports = function () {
  return function (req, res, next) {
    var token = req.headers.token;
    if (!token) return next();
    jwt.verify(token, cert, function (err, decoded) {
      if (err) {
        console.log(err);
        return res.json(401, { error: 'Unauthorized' });
      }
      req.id = decoded.id;
      next();
    });
  }
}