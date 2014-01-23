var User = require('../models/user'),
    arduino = require('../lib/arduino'),
    path = require('path'),
    root = path.resolve(__dirname, '../experiment-files/') + '/',
    fs = require('fs');

exports.read = function (req, res, next) {
  var id = req.params.id,
      uid = req.session.uid;
  User.findById(uid, function (err, user) {
    if (err || !user) return next(err);
    var exp = user.experiments.id(id);
    if (exp) return res.send(200, exp);
    res.send(404, 'Experiment not found');
  });
};

exports.readAll = function (req, res) {
  var uid = req.session.uid;
  User.findById(uid, function (err, user) {
    if (err || !user) return next(err);
    res.send(200, user.experiments);
  });
};

exports.create = function (req, res) {
  var exp = req.body,
      uid = req.session.uid;
  User.findById(uid, function (err, user) {
    if (err) return next(err);
    if (!user) return res.send(500, 'Internal Server Error');
    exp.name = exp.name.trim();
    for (var i = 0; i < user.experiments.length; ++i) {
      if (user.experiments[i].name === exp.name) {
        res.send(400, 'Experiment name already taken');
        return;
      }
    }
    exp.path = root + user.username + '/' + exp.name;
    if (!arduino.locked) arduino.lock();
    else return res.send(400, 'Experiment already underway');
    user.experiments.push(exp);
    user.save(function (err, prod, num) {
      if (err) return next(err);
      var exp = prod.experiments[prod.experiments.length-1];
      arduino.setExperiment(exp, {
        _id: prod._id,
        username: prod.username,
        contacts: prod.contacts
      });
      res.send(200, exp);
    });
  });
};

exports.update = function (req, res) {
  var id = req.params.id,
      exp = req.body,
      uid = req.session.uid;

  // If experiment is running, make sure user is the same
  // as the one who started the experiment.
  if (arduino.locked) {
    if (uid.toString() !== arduino.user._id.toString()) {
      res.send(401, 'Update denied');
    }
  }
  // Experiment name not allowed to be updated.
  // _id isn't allowed to be updated (mongoose enforced), 
  // and __v probably shouldn't.
  delete exp._id;
  delete exp.__v;
  delete exp.name;
  User.findById(uid, function (err, user) {
    if (err || !user) return next(err);
    var doc = user.experiments.id(id);
    if (!doc) return res.send(404, 'Experiment not found');
    for (var key in exp) {
      doc[key] = exp[key];
    }
    user.save(function (err, prod, num) {
      if (err) return next(err);
      var exp = prod.experiments.id(id);
      if (exp.stop) {
        arduino.clearExperiment();
        arduino.unlock();
      } else arduino.updateExperiment(exp);
      res.send(200, prod.experiments.id(id));
    });
  });
};

exports.delete = function (req, res) {
  var id = req.params.id,
      uid = req.session.uid;
  User.findById(uid, function (err, user) {
    if (err || !user) return next(err);
    var doc = user.experiments.id(id);
    if (!doc) return res.send(404, 'Experiment not found');
    doc = doc.remove();
    fs.unlink(doc.path, function (err) {
      if (err) return next(err);
      user.save(function (err, prod, num) {
        if (err) return next(err);
        res.send(200, doc);
      });
    });
  });
};

exports.download = function (req, res) {
  var id = req.params.id,
      uid = req.session.uid;
  User.findById(uid, function (err, user) {
    if (err || !user) return next(err);
    var doc = user.experiments.id(id);
    if (!doc) return res.send(404, 'Experiment not found');
    res.download(doc.path);
  });
}