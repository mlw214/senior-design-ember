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

validator.toTelephone = function (number) {
  var input = this.toString(number), i, result = '',
      pattern = /\s|-|\(|\)/;
  for (i = 0; i < input.length; ++i) {
    // JS Engine is wacky xD.
    if (!isNaN(parseInt(input[i], 10))) {
      result += input[i];
    } else {
      if (input[i].search(pattern) === -1) {
        return null;
      }
    }
  }
  if (this.isNumeric(result) && result.length === 10) {
    return result;
  }
  return null;
}

exports.create = function (req, res, next) {
  var data = req.body;
  // Data verification.
  if (!data) {
    return res.json(400, { error: 'Bad request' });
  }
  if (!validator.isAlphanumeric(data.username)) {
    return res.json(400, {
      error: 'Username must contain only alphanumeric characters',
      field: 'username'
    });
  }
  var error = checkPassword(data.password, data.confirm);
  if (error) {
    return res.json(error.errorCode, {
      error: error.message,
      field: error.field
    });
  }
  User.newInstance(data.username, data.password, function (err, user) {
    if (err) return next(err);
    if (user) {
      user.save(function (err, prod, num) {
        if (err) return next(err);
        res.send(200);
      });
    } else res.json(400, {
      error: 'Username already taken',
      field: 'username'
    });
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
      data = (req.body ? req.body.user : null);

  if (!data) {
    return res.json(400, { error: 'Bad request'});
  }

  if (data.changing === 'contact') {
    // Updating contact info.
    User.findById(id, function (err, user) {
      if (err) return next(err);
      if (user) {
        delete data.changing;
        // An empty string is allowed (used to clear record);
        if (!validator.isEmail(data.email) && data.email !== '') {
          return res.json(400, { error: 'Invalid email', field: 'email' });
        }
        data.cellphone = validator.toTelephone(data.cellphone);
        // An empty string is allowed (used to clear record);
        if (!data.cellphone && data.cellphone !== '') {
          return res.json(400, {
            error: 'Invalid cellphone number',
            field: 'cellphone'
          });
        }

        if (data.cellphone && data.carrier === 'Choose one') {
          return res.json(400, {
            error: 'No cellphone carrier chosen',
            field: 'carrier'
          });
        }

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
      return res.json(error.errorCode, {
        error: error.message,
        field: error.field
      });
    }
    User.authenticateById(id, data.oldPassword, function (err, user) {
      if (err) return next(err);
      if (user) {
        password.compare(data.newPassword, user.password, function (err, same) {
          if (err) return next(err);
          if (same) {
            return res.json(400, {
              error: 'New password is the same as the old one',
              field: 'password'
            });
          }
          password.encrypt(data.newPassword, function (err, hash) {
            if (err) return next(err);
            user.password = hash;
            user.save(function (err) {
              if (err) return next(err);
              res.send(200);
            });
          });
        });
      } else res.json(401, {
        error: 'Invalid password',
        field: 'oldPassword'
      });
    });
  } else res.json(400, { error: 'Bad request' });
};

exports.delete = function (req, res, next) {
  var id = req.session.uid;
  // Check password.
  // Remove from database, delete session info, look into alert using on auth page on success.
};