var EventEmitter = require('events').EventEmitter,
    spawn = require('child_process').spawn,
    fs = require('fs'),
    arduino = new EventEmitter();

function signalForData() {
  arduino.process.stdin.write('d\n');
}

arduino.initialize = function (bayeux) {
  var self = this;
  this.bayeux = bayeux;
  this.client = this.bayeux.getClient();
  this.locked = false;
  this.relay = false,
  this.canceller = false,
  this.rate = 1;
  return this;
};

arduino.start = function () {
  var self = this;
  this.process = spawn(__dirname + '/python/arduino.py');
  this.process.stdout.on('data', function (data) {
    data = data.toString().trim();
    if (data.indexOf('relay') >= 0) {
      if (data === 'relayOn') {
        self.relay = true;
      } else {
        self.relay = false;
      }
      self.client.publish('/status', { relay: self.relay });
      self.emit('relay', self.relay);
    } else if (data.indexOf('solenoid') >= 0) {
      if (data === 'solenoidOn') {
        self.canceller = true;
      } else {
        self.canceller = false;
      }
      self.client.publish('/status', { canceller: self.canceller });
      self.emit('canceller', self.canceller);
    } else {
      var sensors = data.split(';'),
          sensorReadings = {}
      for (var i = 0; i < sensors.length; ++i) {
        var reading = sensors[i].split(':');
        sensorReadings[reading[0]] = reading[1];
      }
      return self.client.publish('/data', sensorReadings);
    }
  });
  this.interval = setInterval(signalForData, this.rate*1000);
  return this;

}

arduino.lock = function () {
  this.locked = true;
  return this;
};

arduino.unlock = function () {
  this.locked = false;
  return this;
};

arduino.setExperiment = function (experiment) {
  var self = this;
  this.stream = fs.createWriteStream(experiment.path, { mode: 0655 });
  this.stream.on('open', function (fd) {
    self.experiment = experiment;
    if (self.experiment.rate != self.rate) {
      clearInterval(self.interval);
      self.rate = self.experiment.rate;
      setInterval(signalForData, self.rate*1000);
    }
    self.client.publish('/status', { running: true });
  });
  return this;
};

arduino.updateExperiment = function (experiment) {
  this.experiment = experiment;
  if (this.experiment.rate != this.rate) {
    clearInterval(this.interval);
    this.rate = this.experiment.rate;
    setInterval(signalForData, this.rate*1000);
  }
  return this;
}

arduino.clearExperiment = function () {
  this.stream.end();
  this.experiment = null;
  this.rate = 1;
  clearInterval(this.interval);
  setInterval(signalForData, this.rate*1000);
  this.client.publish('/status', { running: false });
  return this;
};

arduino.toggleRelay = function (state) {
  if (this.relay !== state) {
    this.process.stdin.write('r\n');
  }
};

arduino.toggleCanceller = function (state) {
  if (this.canceller !== state) {
    this.process.stdin.write('s\n');
  }
};

module.exports = arduino;