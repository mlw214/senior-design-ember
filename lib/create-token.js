var jwt = require('jsonwebtoken'),
    fs = require('fs'),
    cert = fs.readFileSync(__dirname + '/../security/token.pem');

module.exports = function (user) {
  var token = jwt.sign({ id: user._id }, cert, 
                        { expiresInMinutes: 120, algorithm: 'RS256' });
  return token;
}