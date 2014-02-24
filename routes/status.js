var handler = require('../lib/hardware-interface');

exports.get = function (req, res) {
  var experiment = handler.getExperiment(),
      relay = handler.getRelayStatus(),
      canceller = handler.getCancellerStatus();
  var status = { relay: relay, canceller: canceller };
  if (experiment) {
    status.running = true;
    if (experiment.owner === req.session.username) {
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