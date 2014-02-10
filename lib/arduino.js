var EventEmitter = require('events').EventEmitter,
    spawn = require('child_process').spawn,
    fs = require('fs'),
    emailLib = require('./email'),
    arduino = new EventEmitter(),
    smsGateways = {};

smsGateways['Sprint'] = '@messaging.sprintpcs.com';
smsGateways['T-Mobile'] = '@tmomail.net';
smsGateways['Verizon'] = '@vtext.com';
smsGateways['AT&T'] = '@txt.att.net';

function signalForData() {
  arduino.process.stdin.write('d\n');
}

arduino.initialize = function (bayeux) {
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
      if (self.experiment) {
        self.checkBounds(sensorReadings);
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

arduino.setExperiment = function (experiment, contactInfo) {
  var self = this;
  this.stream = fs.createWriteStream(experiment.path, { mode: 0655 });
  this.stream.on('open', function (fd) {
    self.experiment = experiment;
    self.contactInfo = contactInfo;
    self.setTo();
    self.alertedGas = false;
    self.alertedLiquid = false;
    if (self.experiment.rate != self.rate) {
      clearInterval(self.interval);
      self.rate = self.experiment.rate;
      self.interval = setInterval(signalForData, self.rate*1000);
    }
    self.client.publish('/status', { running: true });
  });
  return this;
};

arduino.updateExperiment = function (experiment) {
  if (!experiment) return this;
  this.experiment = experiment;
  if (this.experiment.rate != this.rate) {
    clearInterval(this.interval);
    this.rate = this.experiment.rate;
    this.interval = setInterval(signalForData, this.rate*1000);
  }
  return this;
}

arduino.clearExperiment = function () {
  this.stream.end();
  this.experiment = null;
  this.rate = 1;
  clearInterval(this.interval);
  this.interval = setInterval(signalForData, this.rate*1000);
  this.client.publish('/status', { running: false });
  return this;
};

arduino.setTo = function () {
  this.to = '';
  if (this.experiment.contact === 'none') return this;
  if (this.experiment.contact === 'email' ||
      this.experiment.contact === 'both') {
    for (var user in this.contactInfo) {
      this.to += this.contactInfo[user].email + ', ';
    }
  }
  if (this.experiment.contact === 'text' ||
      this.experiment.contact === 'both') {
    for (var user in this.contactInfo) {
      this.to += this.contactInfo[user].cellphone +
                smsGateways[this.contactInfo[user].carrier] + ', ';
    }
  }
  this.to = this.to.substring(0, this.to.length - 2);
  emailLib.setRecipients(this.to);
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

arduino.checkBounds = function (readings) {
  var gas = this.experiment.gas,
      liquid = this.experiment.liquid,
      contact = this.experiment.contact,
      self = this;

  if (gas.bound) {
    if (readings['a'] < gas.lower || readings['a'] > gas.upper) {
      this.client.publish('/alert', {
        gas: 'Gas bound exceeded',
        reading: readings['a']
      });
      if (contact !== 'none' && !this.alertedGas) {
        this.alertedGas = true;
        emailLib.send(function (err, response) {
          if (err) {
            self.alertedGas = false;
            return console.log(err);
          }
          console.log(response);
        }, 'Gas bound exceeded with a value of ' + readings['a']);
      }
    }
  }
  if (liquid.bound) {
    if (readings['l'] < liquid.lower || readings['l'] > liquid.upper) {
      this.client.publish('/alert', {
        liquid: 'Liquid bound exceeded',
        reading: readings['l']
      });
      if (contact !== 'none' && !this.alertedLiquid) {
        this.alertedLiquid = true;
        emailLib.send(function (err, response) {
          if (err) {
            self.alertedLiquid = false;
            return console.log(err);
          }
          console.log(response);
        }, 'Liquid bound exceeded with a value of ' + readings['l']);
      }
    }
  }
};

module.exports = arduino;