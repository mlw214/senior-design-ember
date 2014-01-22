var bcrypt = require('bcrypt'),
    crypto = require('crypto'),
    sha256 = crypto.createHash('sha256'),
    shasum = crypto.createHash('sha256'),
    pw1 = 'abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    pw2 = 'abcdefghijklmnopqrstuvwxyz1234567890ABCDEFGHIJKLMNOPQRSTUVWXY';


sha256.update(pw1);
var first = sha256.digest('hex');
bcrypt.genSalt(12, function (err, salt) {
  if (err) return console.log(err);
  bcrypt.hash(first, salt, function (err, hash) {
    if (err) console.log(err);
    shasum.update(pw2);
    var second = shasum.digest('hex');
    bcrypt.compare(second, hash, function (err, res) {
      if (err) console.log(err);
      console.log(res);
    });
  });
});