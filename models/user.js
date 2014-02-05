var mongoose = require('mongoose'),
    bcrypt = require('bcrypt'),
    Experiment = require('./experiment'),
    fs = require('fs'),
    path = require('path'),
    root = require('../lib/global-settings').experimentFilePath,
    crypto = require('crypto'),
    password = require('../lib/password');

var userSchema = new mongoose.Schema({
  username: { type: String, index: true },
  password: String,
  email: { type: String, default: null },
  cellphone: { type: Number, default: null },
  carrier: { type: String, default: null }
}),
  authenticate = function (pass, user, fn) {
    password.compare(pass, user.password, function (err, res) {
      if (err) return fn(err);
      if (res) return fn(null, user);
      fn();
    });
  };

userSchema.statics.authenticateByUsername = function (name, pass, fn) {
  this.findOne({ username: name }, function (err, doc) {
    if (err) return fn(err);
    if (!doc) return fn();
    authenticate(pass, doc, fn);
  });
};

userSchema.statics.authenticateById = function (id, pass, fn) {
  this.findById(id, function (err, doc) {
    if (err) return fn(err);
    if (!doc) return fn();
    authenticate(pass, doc, fn);
  });
};

userSchema.statics.newInstance = function (name, pass, fn) {
  var model = this;
  this.findOne({ username: name }, function (err, doc) {
    if (err) return fn(err);
    if (doc) return fn();
    var user = new model({ username: name });
    password.encrypt(pass, function (err, hash) {
      if (err) return fn(err);
      user.password = hash;
      fs.mkdir(root + '/' + user.username, 0755, function (err) {
        if (err) return fn(err);
        fn(null, user);
      });
    });
  });
};

module.exports = mongoose.model('User', userSchema);