var handler = require('../lib/hardware-interface');

exports.get = function (req, res) {
  var experiment = handler.getExperiment(),
      relay = handler.getRelayStatus(),
      canceller = handler.getCancellerStatus();
  var status = { relay: relay, canceller: canceller};
  status.alerted = handler.alertsSent();
  if (experiment) {
    status.running = true;
    status.private = experiment.private;
    if (experiment.owner === req.session.username) {
      status.owner = true;
    } else {
      status.owner = false;
    }
  } else {
    status.running = false;
    status.private = false;
    status.owner = false;
  }
  res.json(status);
};