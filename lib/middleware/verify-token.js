var jwt = require('jsonwebtoken'),
    fs = require('fs'),
    cert = fs.readFileSync(__dirname + '/../../security/token.pub');

module.exports = function () {
  return function (req, res, next) {
    var token = req.headers.token;
    if (!token) return res.json(401, { error: 'Unauthorized' });
    jwt.verify(token, cert, function (err, decoded) {
      if (err) {
        return res.json(401, { error: 'Unauthorized' });
      }
      req.uid = decoded.uid;
      next();
    });
  }
}