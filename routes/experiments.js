var Experiment = require('../models/experiment'),
    arduino = require('../lib/arduino'),
    path = require('path'),
    root = path.resolve(__dirname, '../experiment-files/') + '/',
    fs = require('fs');

function produceJSON(exp) {
  var obj = exp.toJSON();
  delete obj._id;
  delete obj.__v;
  delete obj.path;
  obj.id = exp._id;
  return obj;
}

exports.read = function (req, res, next) {
  var id = req.params.id,
      username = req.session.username;

  Experiment.findById(id, function (err, exp) {
    if (err) return next(err);
    if (exp) {
      if (username !== exp.owner) {
        return res.json(401, { error: 'Unauthorized' });
      }
      res.json({ experiment: produceJSON(exp) });
    } else return res.json(404, { error: 'Experiment not found' });
  });
};

exports.readAll = function (req, res) {
  var username = req.session.username;
  // Need to figure out format for Ember DS.
};

exports.create = function (req, res) {
  var data = req.body.experiment,
      username = req.session.username;

  if (arduino.locked) {
    return res.json(400, { error: 'Experiment already underway' });
  }

  data.name = data.name.trim();
  
  Experiment.findOne({ name: data.name, owner: username}, function (err, doc) {
    if (err) return next(err);
    if (doc) return res.json(400, { error: 'Experiment name already taken' });
    data.owner = username;
    data.path = root + username + '/' + data.name;
    if (!arduino.locked) arduino.lock();
    else return res.json(400, { error: 'Experiment already underway' });
    var experiment = new Experiment(data);
    experiment.save(function (err, prod, num) {
      if (err) return next(err);
      arduino.setExperiment(prod);
      res.json({ experiment: produceJSON(prod) });
    });

  });
};

exports.update = function (req, res, next) {
  var id = req.params.id,
      exp = req.body.experiment,
      username = req.session.username;

  Experiment.findById(id, function (err, doc) {
    if (err) return next(err);
    if (!doc) return res.json(404, { error: 'Experiment not found' });
    if (doc.owner !== username) {
      return res.json(401, { error: 'Unauthorized' });
    }
    delete exp.id;
    delete exp.name;
    for (var key in exp) {
      doc[key] = exp[key];
    }
    doc.save(function (err, prod, num) {
      if (err) return next(err);
      if (prod.stop) {
        arduino.clearExperiment();
        arduino.unlock();
      } else arduino.updateExperiment(prod);
      res.json({ experiment: produceJSON(prod) });
    });
  });
};

exports.delete = function (req, res) {
  /*var id = req.params.id,
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
  });*/
};

exports.current = function (req, res, next) {
  if (arduino.experiment) {
    if (arduino.experiment.owner === req.session.username) {
      res.json({ id: arduino.experiment._id.toString() });
    } else res.json({ id: null });
  } else res.json({ id: null });
};

exports.download = function (req, res) {
  /*var id = req.params.id,
      uid = req.session.uid;
  User.findById(uid, function (err, user) {
    if (err || !user) return next(err);
    var doc = user.experiments.id(id);
    if (!doc) return res.send(404, 'Experiment not found');
    res.download(doc.path);
  });*/
}