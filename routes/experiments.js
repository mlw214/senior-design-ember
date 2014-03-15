var Experiment = require('../models/experiment'),
    handler = require('../lib/hardware-interface'),
    path = require('path'),
    root = path.resolve(__dirname, '../experiment-files/') + '/',
    fs = require('fs'),
    uuid = require('node-uuid');

function checkBounds(data, errors) {
  var gasLower, gasUpper, liquidLower, liquidUpper;
  if (data.gas.bound) {
    gasLower = parseInt(data.gas.lower, 10);
    gasUpper = parseInt(data.gas.upper, 10);
    if (isNaN(gasLower)) {
      errors.push({
        error: 'Not a number',
        field: 'gasLower'
      });
    }
    if (isNaN(gasUpper)) {
      errors.push({
        error: 'Not a number',
        field: 'gasUpper'
      });
    }
    if (!isNaN(gasLower) && !isNaN(gasUpper)) {
      if (gasLower >= gasUpper) {
        errors.push({
          error: 'Upper bound must be greater than the lower',
          field: 'gasUpper'
        });
      }
    }
  }
  if (data.liquid.bound) {
    liquidLower = parseInt(data.liquid.lower, 10);
    liquidUpper = parseInt(data.liquid.upper, 10);
    if (isNaN(liquidLower)) {
      errors.push({
        error: 'Not a number',
        field: 'liquidLower'
      });
    }
    if (isNaN(liquidUpper)) {
      errors.push({
        error: 'Not a number',
        field: 'liquidUpper'
      });
    }
    if (!isNaN(liquidLower) && !isNaN(liquidUpper)) {
      if (liquidLower >= liquidUpper) {
        errors.push({
          error: 'Upper bound must be greater than the lower',
          field: 'liquidUpper'
        });
      }
    }
  }
  // Color checking
}

function hasProperContactInfo(data, contactInfo, errors) {
  if (data.contact === 'text') {
    if (!contactInfo.cellphone) {
      errors.push({
        error: 'You have not provided your cellphone number',
        field: 'contact'
      });
    }
  } else if (data.contact === 'email') {
    if (!contactInfo.email) {
      errors.push({
        error: 'You have not provided your email',
        field: 'contact'
      });
    }
  } else if (data.contact === 'both') {
    if (!contactInfo.email && !contactInfo.cellphone) {
      errors.push({
        error: 'You have not provided your cellphone number or email',
        field: 'contact'
      });
    }
  }
  return true;
}

function escapeFileName(name) {
  // First, replace whitespace with dashes.
  name = name.replace(/\W/g, '-');
  // Then, remove any invalid characters.
  name = name.replace(/[^a-zA-Z0-9\.\-_]/g, '');
  // Be careful of empty strings and single special character strings.
  if (name.length === 0 ||
      (name.length === 1 && name.search('\.|\-|_') === 0)) {
    return 'no-valid-name' + Math.ceil(Math.random() * 1000000) + '.txt';
  } else if (name.length > 251) {
    return 'why-is-the-name-so-long' + Math.ceil(Math.random() * 1000000) + '.txt';
  }
  // Remove ending period if present.
  if (name[name.length - 1] === '.') {
    return name.substring(0, name.length - 2) + '.txt';
  } else { return name + '.txt'; }
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
      callback, opts = { sortBy: { start: -1 } };
  if (!username) { return res.json(401, { error: 'Unauthorized' }); }
  if (!req.query.page || req.query.page <= 0) { req.query.page = 1; }
  callback = function (err, pageCount, docs) {
    if (err) { return next(err); }
    res.json({ experiment: docs, meta: { pages: pageCount } });
  };
  Experiment.paginate({ owner: username }, req.query.page, 25, callback, opts);
};

exports.create = function (req, res, next) {
  var data = (req.body ? req.body.experiment : null),
      username = req.session.username,
      contactInfo = req.session.contactInfo,
      errors = [];

  if (!data) {
    return res.json(400, { error: 'Bad request' });
  }
  if (handler.isLocked()) {
    return res.json(400, { error: 'Experiment already underway' });
  }

  delete data._id;
  if (!data.name) {
    errors.push({
      error: 'Missing experiment name',
      field: 'name'
    });
  }
  checkBounds(data, errors);
  hasProperContactInfo(data, req.session.contactInfo, errors);
  if (errors.length) { return res.json(400, { formErrors: errors }); }
  
  data.name = data.name.trim();
  
  Experiment.findOne({ name: data.name, owner: username}, function (err, doc) {
    if (err) { return next(err); }
    if (doc) {
      errors.push({
        error: 'Experiment name already taken',
        field: 'name'
      });
      return res.json(400, { formErrors: errors });
    }
    data.owner = username;
    data.path = root + username + '/' + uuid.v1() + '.txt';
    if (!handler.isLocked()) { handler.lock(); }
    else { return res.json(400, { error: 'Experiment already underway' }); }
    var experiment = new Experiment(data);
    experiment.save(function (err, prod, num) {
      if (err) { return next(err); }
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
      username = req.session.username,
      errors = [];

  if (!exp) {
    return res.json(400, { error: 'Bad request' });
  }
  checkBounds(exp, errors);
  hasProperContactInfo(exp, req.session.contactInfo, errors);
  if (errors.length) { return res.json(400, { formErrors: errors }); }

  Experiment.findById(id, function (err, doc) {
    if (err) { return next(err); }
    if (!doc) { return res.json(404, { error: 'Experiment not found' }); }
    if (doc.owner !== username) {
      return res.json(403, { error: 'Unauthorized' });
    }
    delete exp._id;
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
      if (err) { return next(err); }
      if (prod.stop) {
        handler.clearExperiment();
        handler.unlock();
      } else handler.updateExperiment(prod);
      res.json({ experiment: prod.toJSON() });
    });
  });
};

exports.delete = function (req, res, next) {
  var id = req.params.id,
      username = req.session.username;

  Experiment.findById(id, function (err, doc) {
    var running;
    if (err) { return next(err); }
    if (!doc) { return res.json(404, { error: 'Experiment not found' }); }
    if (doc.owner !== username) {
      return res.json(403, { error: 'Unauthorized' });
    }
    running = handler.getExperiment();
    if (running) {
      if (running._id === doc._id.toString()) {
        res.json(400, { error: 'Cannot delete running experiment' });
      }
    }
    doc.remove(function (err, doc) {
      if (err) { return next(err); }
      res.json({ experiment: doc.toJSON() });
    });
  });
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
  var id = req.params.id,
      username = req.session.username;

  Experiment.findById(id, function (err, doc) {
    if (err) { return next(err); }
    if (!doc) { return res.json(404, { error: 'Experiment not found' }); }
    if (doc.owner !== username) {
      return res.json(403, { error: 'Unauthorized' });
    }
    // Need to escape name.
    res.download(doc.path, escapeFileName(doc.name));
  });
};