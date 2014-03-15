var minLen = require('./global-settings').minLen,
    validator = require('validator');

module.exports = function (password, confirm) {
  var errors = [];
  if (!validator.isLength(password, minLen)) {
    errors.push({
      error: 'Password must be at least ' + minLen + ' characters long',
      field: 'password'
    });
  }
  if (password !== confirm) {
    errors.push({
      error: 'Passwords do not match',
      field: 'confirm'
    });
  }
  return errors;
};