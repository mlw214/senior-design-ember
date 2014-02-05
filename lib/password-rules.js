var minLen = require('./global-settings').minLen,
    validator = require('validator');

module.exports = function (password, confirm) {
  if (!validator.isLength(password, minLen)) {
    return {
      errorCode: 400,
      message: 'Password must be at least ' + minLen + ' characters long'
    };
  }
  if (password !== confirm) {
    return {
      errorCode: 400,
      message: 'Passwords must match'
    };
  }
};