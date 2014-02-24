var handler = require('../lib/hardware-interface');

exports.relay = function (req, res) {
  var experiment = handler.getExperiment(),
      relay = (req.body ? req.body.relay : null);
  if (experiment) {
    if (experiment.owner !== req.session.username) {
      return res.json(401, { error: 'Unauthorized' });
    } 
  }
  if (relay !== null) {
    handler.toggleRelay(relay);
  } else return res.json(400, { error: 'Bad request' });
  handler.once('relay', function (state) {
    res.json({ relay: state })
  });
};

exports.canceller = function (req, res) {
  var experiment = handler.getExperiment(),
      canceller = (req.body ? req.body.canceller : null);
  if (experiment) {
    if (experiment.owner !== req.session.username) {
      res.json(401, { error: 'Unauthorized' });
    } 
  }
  if (relay !== null) {
    handler.toggleCanceller(canceller);
  } else return res.json(400, { error: 'Bad request' });
  handler.once('canceller', function (state) {
    res.json({ relay: state })
  });
};