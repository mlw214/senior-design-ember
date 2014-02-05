var arduino = require('../lib/arduino');

exports.relay = function (req, res) {
  if (arduino.experiment) {
    if (arduino.experiment.owner !== req.session.username) {
      res.json(401, { error: 'Unauthorized' });
    } 
  }
  arduino.toggleRelay(req.body.relay);
  arduino.once('relay', function (state) {
    res.json({ relay: state })
  });
};

exports.canceller = function (req, res) {
  if (arduino.experiment) {
    if (arduino.experiment.owner !== req.session.username) {
      res.json(401, { error: 'Unauthorized' });
    } 
  }
  arduino.toggleCanceller(req.body.canceller);
  arduino.once('canceller', function (state) {
    res.json({ relay: state })
  });
};