var User = require('../models/user'),
    createToken = require('../lib/create-token'),
    bcrypt = require('bcrypt'),
    crypto = require('crypto'),
    fs = require('fs'),
    path = require('path'),
    validator = require('validator'),
    sha256 = crypto.createHash('sha256'),
    minLen = 8;

exports.create = function (req, res, next) {
  var data = req.body;
  // Data verification.
  if (!validator.isAlphanumeric(data.username)) {
    res.json(400, { error: 'Username must contain only alphanumeric characters' });
  }
  if (!validator.isLength(data.password, minLen)) {
    res.json(400, {
      error: 'Password must be at least ' + minLen + ' characters long'
    });
  }
  if (data.password !== data.confirm) res.json({ error: 'Passwords must match' });
  User.newInstance(data.username, data.password, function (err, user) {
    if (err) return next(err);
    if (user) {
      user.save(function (err, prod, num) {
        if (err) return next(err);
        var token = createToken(prod);
        res.json({ token: token });
      });
    } else res.json(400, { error: 'Username already taken' });
  });
};

exports.read = function (req, res, next) {
  var id = req.params.id;
  User.findById(id, function (err, user) {
    if (err) return next(err);
    if (user) {
      var data = {
        user: {
          id: user._id,
          username: user.username,
          contact: user.contact
        }
      };
      res.json(data);
    } else res.json(404, { error: 'User not found' });
  });
};

exports.update = function (req, res, next) {

};

exports.delete = function (req, res, next) {
  User.findByIdAndRemove(req.session.id, function (err, user) {
    
  });
};