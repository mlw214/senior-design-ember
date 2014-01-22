var mongoose = require('mongoose'),
    bcrypt = require('bcrypt'),
    Experiment = require('./experiment'),
    fs = require('fs'),
    path = require('path'),
    root = path.resolve(__dirname + '/../experiment-files/'),
    crypto = require('crypto');

var userSchema = new mongoose.Schema({
  username: { type: String, index: true },
  password: String,
  contact: {
    email: { type: String, default: null },
    cellphone: { type: Number, default: null },
    carrier: { type: String, default: null }
  },
  experiments: [Experiment]
});

userSchema.statics.authenticate = function (name, pass, fn) {
  this.findOne({ username: name }, function (err, doc) {
    if (err) return fn(err);
    if (!doc) return fn();
    var user = doc,
        shasum = crypto.createHash('sha256'),
        firstHash;
    shasum.update(pass);
    firstHash = shasum.digest('hex');
    bcrypt.compare(firstHash, user.password, function (err, res) {
      if (err) return fn(err);
      if (res) return fn(null, user);
      fn();
    });
  });
};

userSchema.statics.newInstance = function (name, pass, fn) {
  var model = this;
  this.findOne({ username: name }, function (err, doc) {
    if (err) return fn(err);
    if (doc) return fn();
    var user = new model({ username: name });
    bcrypt.genSalt(12, function (err, salt) {
      if (err) return fn(err);
      // Bypasses length limitation of bcrypt.
      var shasum = crypto.createHash('sha256'),
          firstHash;
      shasum.update(pass);
      firstHash = shasum.digest('hex');
      bcrypt.hash(firstHash, salt, function (err, secondHash) {
        if (err) return fn(err);
        user.password = secondHash;
        fs.mkdir(root + '/' + user.username, 0755, function (err) {
          if (err) return fn(err);
          fn(null, user);
        });
      });
    });
  });
};

module.exports = mongoose.model('User', userSchema);