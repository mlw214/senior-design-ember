var arduino = require('../lib/arduino');

exports.get = function (req, res) {
  var status = { relay: arduino.relay, canceller: arduino.canceller };
  if (arduino.experiment) {
    status.running = true;
    if (arduino.experiment.owner === req.session.username) {
      status.owner = true;
    } else {
      status.owner = false;
    }
  } else {
    status.running = false;
    status.owner = false;
  }
  res.json(status);
};