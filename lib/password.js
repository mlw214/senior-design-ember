var bcrypt = require('bcrypt'),
    crypto = require('crypto');


exports.encrypt = function (pass, fn) {
  bcrypt.genSalt(12, function (err, salt) {
    if (err) return fn(err);
    var shasum = crypto.createHash('sha256'),
        firstHash;
    shasum.update(pass);
    firstHash = shasum.digest('hex');
    bcrypt.hash(firstHash, salt, function (err, hash) {
      if (err) return fn(err);
      fn(null, hash);
    });
  });
};

exports.compare = function (pass, hash, fn) {
  var shasum = crypto.createHash('sha256'),
      firstHash;
  shasum.update(pass);
  firstHash = shasum.digest('hex');
  bcrypt.compare(firstHash, hash, function (err, res) {
    if (err) return fn(err);
    if (res) return fn(null, true);
    fn();
  });
};