var User = require('../models/user'),
    createToken = require('../lib/create-token'),
    fs = require('fs'),
    path = require('path'),
    validator = require('validator'),
    checkPassword = require('../lib/password-rules'),
    password = require('../lib/password'),
    handler = require('../lib/hardware-interface');
    root = require('../lib/global-settings').experimentFilePath,
    deviceId = require('../lib/global-settings').deviceId;

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
  var data = req.body,
      errors = [], pwErrors;
  // Data verification.
  if (!data) {
    return res.json(400, { error: 'Bad request' });
  }
  if (!validator.isAlphanumeric(data.username)) {
    errors.push({
      error: 'Username must contain only alphanumeric characters',
      field: 'username'
    });
  }
  pwErrors = checkPassword(data.password, data.confirm);
  if (pwErrors.length) {
    errors = errors.concat(pwErrors);
  }
  if (data.deviceId !== deviceId) {
    errors.push({
      error: 'Invalid Device ID',
      field: 'deviceId'
    });
  }
  if (errors.length) return res.json(400, { formErrors: errors });
  User.newInstance(data.username, data.password, function (err, user) {
    if (err) return next(err);
    if (user) {
      user.save(function (err, prod, num) {
        if (err) return next(err);
        res.send();
      });
    } else {
      errors.push({
        error: 'Username already taken',
        field: 'username'
      });
      res.json(400, { formErrors: errors });
    }
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
      data = (req.body ? req.body.user : null),
      errors = [], backup;

  if (!data) {
    return res.json(400, { error: 'Bad request' });
  }

  if (data.changing === 'contact') {
    // Updating contact info.
    User.findById(id, function (err, user) {
      if (err) return next(err);
      if (user) {
        delete data.changing;
        if (data.email) data.email.trim();
        if (data.cellphone) data.cellphone.trim();
        // An empty string is allowed (used to clear record);
        if (!validator.isEmail(data.email) && data.email !== '') {
          errors.push({ error: 'Invalid email', field: 'email' });
        }
        backup = data.cellphone
        data.cellphone = validator.toTelephone(data.cellphone);
        // An empty string is allowed (used to clear record);
        if (!data.cellphone && data.cellphone !== '') {
          errors.push({
            error: 'Invalid cellphone number',
            field: 'cellphone'
          });
        }

        if (backup && data.carrier === 'Choose one') {
          errors.push({
            error: 'No cellphone carrier chosen',
            field: 'carrier'
          });
        }

        if (errors.length) return res.json(400, { formErrors: errors });

        for (var key in data) {
          user[key] = data[key];
        }
        user.save(function (err, prod, num) {
          var exp;
          if (err) return next(err);
          req.session.contactInfo = {
            email: prod.email,
            cellphone: prod.cellphone,
            carrier: prod.carrier
          };
          exp = handler.getExperiment();
          if (exp && exp.owner === req.session.username) {
            handler.setContactInfo(req.session.contactInfo);
          }
          res.json(createUserJSON(prod));
        });
      } else res.json(500, { error: 'The server exploded' });
    });
  } else if (data.changing === 'password') {
    // Updating password.
    var errors = checkPassword(data.newPassword, data.confirmPassword);
    if (errors.length) {
      return res.json(400, { formErrors: errors });
    }
    User.authenticateById(id, data.oldPassword, function (err, user) {
      if (err) return next(err);
      if (user) {
        password.compare(data.newPassword, user.password, function (err, same) {
          if (err) return next(err);
          if (same) {
            errors.push({
              error: 'New password is the same as the old one',
              field: 'password'
            });
            return res.json(400, { formErrors: errors });
          }
          password.encrypt(data.newPassword, function (err, hash) {
            if (err) return next(err);
            user.password = hash;
            user.save(function (err) {
              if (err) return next(err);
              res.send();
            });
          });
        });
      } else {
        errors.push({ error: 'Invalid password', field: 'oldPassword' });
        res.json(401, { formErrors: errors });
      }
    });
  } else res.json(400, { error: 'Bad request' });
};

exports.delete = function (req, res, next) {
  var id = req.session.uid,
      data = (req.body ? req.body.user : null);

  if (!data) {
    return res.json(400, { error: 'Bad request' });
  }
  User.authenticateById(id, data, function (err, user) {
    if (err) return next(err);
    if (user) {
      // Cleanup handled by mongoose 'pre' method.
      user.remove(function (err, user) {
        if (err) return next(err);
        req.session.regenerate(function (err) {
          if (err) return next(err);
          req.session.deleted = true;
          res.send();
        });
      });

    } else {
      res.json(401, { error: 'Invalid password', field: 'password' });
    }
  });
};