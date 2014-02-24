var Experiment = require('../models/experiment'),
    handler = require('../lib/hardware-interface'),
    path = require('path'),
    root = path.resolve(__dirname, '../experiment-files/') + '/',
    fs = require('fs');

function checkBounds(data) {
  if (data.gas.bound) {
    if (data.gas.lower >= data.gas.upper) {
      return false;
    }
  }
  if (data.liquid.bound) {
    if (data.liquid.lower >= data.liquid.upper) {
      return false;
    }
  }
  return true;
}

exports.read = function (req, res, next) {
  var id = req.params.id,
      username = req.session.username;

  Experiment.findById(id, function (err, doc) {
    if (err) return next(err);
    if (doc) {
      if (username !== doc.owner) {
        return res.json(401, { error: 'Unauthorized' });
      }
      res.json({ experiment: doc.toJSON() });
    } else return res.json(404, { error: 'Experiment not found' });
  });
};

exports.readAll = function (req, res, next) {
  var username = req.session.username,
      callback;
  if (!username) return res.json(401, { error: 'Unauthorized' });
  if (req.query <= 0) req.query = 1;
  callback = function (err, pageCount, docs) {
    if (err) return next(err);
    res.json({ experiment: docs, meta: { pages: pageCount } });
  };
  Experiment.paginate({ owner: username }, req.query.page, 25, callback);
};

exports.create = function (req, res, next) {
  var data = (req.body ? req.body.experiment : null),
      username = req.session.username,
      contactInfo = req.session.contactInfo,
      boundsError;

  if (!data) {
    return res.json(400, { error: 'Bad request' });
  }
  if (handler.isLocked()) {
    return res.json(400, { error: 'Experiment already underway' });
  }

  delete data._id;
  if (!data.name) {
    return res.json(400, { error: 'Missing experiment name' });
  }
  if (!checkBounds(data)) {
    return res.json(400, {
      error: 'Upper bound must be greater than the lower'
    });
  }
  
  data.name = data.name.trim();
  
  Experiment.findOne({ name: data.name, owner: username}, function (err, doc) {
    if (err) return next(err);
    if (doc) return res.json(400, { error: 'Experiment name already taken' });
    data.owner = username;
    data.path = root + username + '/' + data.name;
    if (!handler.isLocked()) handler.lock();
    else return res.json(400, { error: 'Experiment already underway' });
    var experiment = new Experiment(data);
    experiment.save(function (err, prod, num) {
      if (err) return next(err);
      var contact = {};
      contact[username] = contactInfo;
      handler.setExperiment(prod, contact);
      res.json({ experiment: prod.toJSON() });
    });
  });
};

exports.update = function (req, res, next) {
  var id = req.params.id,
      exp = (req.body ? req.body.experiment : null),
      username = req.session.username;

  if (!exp) {
    return res.json(400, { error: 'Bad request' });
  }

  if (!checkBounds(exp)) {
    return res.json(400, {
      error: 'Upper bound must be greater than the lower'
    });
  }

  Experiment.findById(id, function (err, doc) {
    if (err) return next(err);
    if (!doc) return res.json(404, { error: 'Experiment not found' });
    if (doc.owner !== username) {
      return res.json(401, { error: 'Unauthorized' });
    }
    delete exp.id;
    delete exp.name;
    if (exp.stop) {
      // Don't allow any other changes to persist.
      doc.stop = exp.stop;
    } else {
      for (var key in exp) {
        doc[key] = exp[key];
      }
    }
    doc.save(function (err, prod, num) {
      if (err) return next(err);
      if (prod.stop) {
        handler.clearExperiment();
        handler.unlock();
      } else handler.updateExperiment(prod);
      res.json({ experiment: prod.toJSON() });
    });
  });
};

exports.delete = function (req, res, next) {
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
  var experiment = handler.getExperiment();
  if (experiment) {
    if (experiment.owner === req.session.username) {
      return res.json({ id: experiment._id });
    }
  }
  res.json({ id: null });
};

exports.download = function (req, res, next) {
  /*var id = req.params.id,
      uid = req.session.uid;
  User.findById(uid, function (err, user) {
    if (err || !user) return next(err);
    var doc = user.experiments.id(id);
    if (!doc) return res.send(404, 'Experiment not found');
    res.download(doc.path);
  });*/
}