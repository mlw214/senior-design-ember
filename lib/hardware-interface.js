var EventEmitter = require('events').EventEmitter,
    spawn = require('child_process').spawn,
    fs = require('fs'),
    email = require('./email'),
    handler = new EventEmitter(),
    handlerData = {},
    smsGateways = {};

smsGateways['Sprint'] = '@messaging.sprintpcs.com';
smsGateways['T-Mobile'] = '@tmomail.net';
smsGateways['Verizon'] = '@vtext.com';
smsGateways['AT&T'] = '@txt.att.net';

function checkSensorBounds (readings) {
  var props = handlerData.getProperties('experiment', 'client', 'gasAlerted',
                                        'liquidAlerted');
      gas = props.experiment.gas,
      liquid = props.experiment.liquid,
      contact = props.experiment.contact,
      self = this, gasMessage, liquidMessage, gasReading, liquidReading;
      

  if (gas.bound) {
    gasReading = readings['a'];
    if (gasReading < gas.lower || gasReading > gas.upper) {
      gasMessage = 'Gas bound of ' +
                    (gasReading < gas.lower ? gas.lower : gas.upper) +
                    ' exceeded with a value of ' + gasReading;

      props.client.publish('/alert', {
        gas: {
          reading: gasReading
        }
      });
      if (contact !== 'none' && !props.gasAlerted) {
        handlerData.set('gasAlerted', true);
        email.send(function (err, response) {
          if (err) {
            return console.log(err);
          }
          console.log('email(s) away!')
        }, gasMessage);
      } 
    }
  }
  if (liquid.bound) {
    liquidReading = readings['l'];
    if (liquidReading < liquid.lower || liquidReading > liquid.upper) {
      liquidMessage = 'Liquid bound of ' +
                        (liquidReading < liquid.lower ?
                          liquid.lower : liquid.upper) +
                        ' exceeded with a value of ' + liquidReading;

      props.client.publish('/alert', {
        liquid: {
          reading: liquidReading
        }
      });
      if (contact !== 'none' && !props.liquidAlerted) {
        handlerData.set('liquidAlerted', true);
        email.send(function (err, response) {
          if (err) {
            return console.log(err);
          }
          console.log('email(s) away!');
        }, liquidMessage);
      } 
    }
  }
}

function signalForData () {
  handlerData.get('arduino').stdin.write('d\n');
}

function setToField (contactInfo) {
  var to = '', user,
      experiment = handlerData.get('experiment');

  if (experiment.contact === 'none') return;
  if (experiment.contact === 'email' ||
      experiment.contact === 'both') {
    for (user in contactInfo) {
      to += contactInfo[user].email + ', ';
    }
  }
  if (experiment.contact === 'text' ||
      experiment.contact === 'both') {
    for (user in contactInfo) {
      to += contactInfo[user].cellphone +
                smsGateways[contactInfo[user].carrier] + ', ';
    }
  }
  to = to.substring(0, to.length - 2);
  email.setRecipients(to);
}

function resetInterval(rate) {
  clearInterval(handlerData.get('interval'));
  handlerData.set('rate', rate);
  handlerData.set('interval',
                  setInterval(signalForData, handlerData.get('rate') * 1000));
}

handlerData.get = function (key) {
  if (!key) {
    throw 'Cannot call get with ' + key + ' as key';
  }
  return arduinoData[key];
};

handlerData.set = function (key, value) {
  if (!key) {
    throw 'Cannot call set with ' + key + ' as key';
  }
  arduinoData[key] = value;
};

handlerData.getProperties = function (list) {
  var data = {}, keys, i;
  if (arguments.length === 0) {
    throw 'Cannot call getProperties with no arguments';
  }
  if (list instanceof Array) {
    keys = list;
  } else {
    keys = arguments;
  }

  for (i = 0; i < keys.length; ++i) {
    data[keys[i]] = this.get(keys[i]);
  }
  return data;
};

handlerData.setProperties = function (hash) {
  var key;
  if (!hash) {
    throw 'Cannot call setProperties with no arguments';
  }
  for (key in hash) {
    this.set(key, hash[key]);
  }
};

handler.initialize = function (bayeux) {
  if (!bayeux) {
    throw new Error('Cannot call initialize with ' + bayeux);
  }
  handlerData.setProperties({
    bayeux: bayeux,
    client: bayeux.getClient(),
    relay: false,
    canceller: false,
    rate: 1
  });
  return this;
};

handler.start = function () {
  var self = this,
      arduinoProcess = spawn(__dirname + '/python/arduino.py');
  handlerData.set('arduino', arduinoProcess);
  arduinoProcess.stdout.on('data', function (data) {
    var client = handlerData.get('client');
    data = data.toString().trim();
    if (data.indexOf('relay') >= 0) {
      if (data === 'relayOn') {
        handlerData.set('relay', true);
      } else {
        handlerData.set('relay', false);
      }
      client.publish('/status', { relay: self.get('relay') });
      self.emit('relay', self.get('relay'));
    } else if (data.indexOf('solenoid') >= 0) {
      if (data === 'solenoidOn') {
        handlerData.set('canceller', true);
      } else {
        handlerData.set('canceller', false);
      }
      client.publish('/status', { canceller: self.get('canceller') });
      self.emit('canceller', self.get('canceller'));
    } else {
      var sensors = data.split(';'),
          sensorReadings = {}
      for (var i = 0; i < sensors.length; ++i) {
        var reading = sensors[i].split(':');
        sensorReadings[reading[0]] = reading[1];
      }
      if (handlerData.get('experiment')) {
        checkSensorBounds(sensorReadings);
      }
      client.publish('/data', sensorReadings);
    }
  });
  handlerData.set('interval',
                  setInterval(signalForData, handlerData.get('rate') * 1000));
  return this;
};

handler.lock = function () {
  handlerData.set('locked', true);
  return this;
};

handler.unlock = function () {
  if (!handlerData.get('experiment')) {
    handlerData.set('locked', false);
  }
  return this;
};

handler.setExperiment = function (experiment) {
  if (!experiment) {
    throw new Error('Cannot call setExperiment with ' + experiment);
  }
  var stream = fs.createWriteStream(experiment.path, { mode: 0655 });
  handlerData.set('stream', stream);
  stream.on('open', function (fd) {
    handlerData.set('experiment', experiment);
    handlerData.set('gasAlerted', false);
    handlerData.set('liquidAlerted', false);
    if (experiment.rate != handlerData.get('rate')) {
      resetInterval(experiment.rate);
    }
    handlerData.get('client').publish('/status', { running: true });
  });
  return this;
};

handler.setContactInfo = function (contactInfo) {
  if (!contactInfo) {
    throw new Error('Cannot call setContactInfo with ' + contactInfo);
  }
  setToField(contactInfo);
};

handler.updateExperiment = function (experiment) {
  if (!experiment) {
    throw new Error('Cannot call updateExperiment with ' + experiment);
  }
  handlerData.set('experiment', experiment);
  if (handlerData.get('rate') !== experiment.rate) {
    resetInterval(experiment.rate);
  }
  return this;
};

handler.clearExperiment = function () {
  handlerData.get('stream').end();
  handlerData.setProperties({
    experiment: null,
    rate: 1
  });
  resetInterval(handlerData.get('rate'));
  handlerData.get('client').publish('/status', { running: false });
  return this;
};

handler.toggleRelay = function (state) {
  if (handlerData.get('relay') !== state) {
    handlerData.get('arduino').stdin.write('r\n');
  }
};

handler.toggleCanceller = function (state) {
  if (handlerData.get('canceller') !== state) {
    handlerData.get('arduino').stdin.write('s\n');
  }
};

module.exports = handler;