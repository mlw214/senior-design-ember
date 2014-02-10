var User = require('../models/user'),
    createToken = require('../lib/create-token'),
    fs = require('fs'),
    path = require('path'),
    validator = require('validator'),
    checkPassword = require('../lib/password-rules'),
    password = require('../lib/password'),
    root = require('../lib/global-settings').experimentFilePath;

function createUserJSON(user) {
  return {
    username: user.username,
    email: user.email,
    cellphone: user.cellphone,
    carrier: user.carrier
  };
}

exports.create = function (req, res, next) {
  var data = req.body;
  // Data verification.
  if (!validator.isAlphanumeric(data.username)) {
    res.json(400, {
      error: 'Username must contain only alphanumeric characters'
    });
  }
  var error = checkPassword(data.password, data.confirm);
  if (error) {
    res.json(error.errorCode, { error: error.message });
  }
  User.newInstance(data.username, data.password, function (err, user) {
    if (err) return next(err);
    if (user) {
      user.save(function (err, prod, num) {
        if (err) return next(err);
        res.send(200, 'Registration successful');
      });
    } else res.json(400, { error: 'Username already taken' });
  });
};

exports.read = function (req, res, next) {
  var id = req.session.uid
  User.findById(id, function (err, user) {
    if (err) return next(err);
    if (user) res.json(200, createUserJSON(user));
    else res.json(404, { error: 'User not found' });
  });
};

exports.update = function (req, res, next) {
  var id = req.session.uid,
      data = req.body.user;

  if (data.changing === 'contact') {
    // Updating contact info.
    User.findById(id, function (err, user) {
      if (err) return next(err);
      if (user) {
        // 
        delete data.changing;
        for (var key in data) {
          user[key] = data[key];
        }
        user.save(function (err, prod, num) {
          if (err) return next(err);
          req.session.contactInfo = {
            email: prod.email,
            cellphone: prod.cellphone,
            carrier: prod.carrier
          };
          res.json(200, createUserJSON(prod));
        });
      } else res.json(500, { error: 'The server exploded' });
    });
  } else if (data.changing === 'password') {
    // Updating password.
    var error = checkPassword(data.newPassword, data.confirmPassword);
    if (error) {
      return res.json(error.errorCode, { error: error.message });
    }
    User.authenticateById(id, data.oldPassword, function (err, user) {
      if (err) return next(err);
      if (user) {
        password.encrypt(data.newPassword, function (err, hash) {
          if (err) return next(err);
          user.password = hash;
          user.save(function (err) {
            if (err) return next(err);
            res.send(200);
          });
        });
      } else res.json(401, { error: 'Invalid password' });
    });
  } else res.json(400, { error: 'Bad Request' });
};

exports.delete = function (req, res, next) {
  var id = req.session.uid;
  // Check password.
  // Remove from database, delete session info, look into alert using on auth page on success.
};