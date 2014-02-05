var jwt = require('jsonwebtoken'),
    fs = require('fs'),
    cert = fs.readFileSync(__dirname + '/../security/token.pem');

module.exports = function (message) {
  var token = jwt.sign(message, cert, { algorithm: 'RS256' });
  return token;
}