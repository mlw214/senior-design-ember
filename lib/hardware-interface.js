var EventEmitter = require('events').EventEmitter,
    User = require('../models/user'),
    spawn = require('child_process').spawn,
    fs = require('fs'),
    jwt = require('jsonwebtoken'),
    tinycolor = require('tinycolor2'),
    email = require('./email'),
    secret = require('../security/secret').fayeSecret,
    cert = fs.readFileSync(__dirname + '/../security/token.pub');
    handler = new EventEmitter(),
    handlerData = {},
    smsGateways = {};
// Make sure to propagate any changes here to account-controller.js
smsGateways['Sprint'] = '@messaging.sprintpcs.com';
smsGateways['T-Mobile'] = '@tmomail.net';
smsGateways['Verizon'] = '@vtext.com';
smsGateways['AT&T'] = '@txt.att.net';

// Helper functions that I don't want to be exposed.

// TODO: Max number of retries for email.
function checkSensorBounds (readings) {
  var props = handlerData.getProperties('experiment', 'client', 'gasAlerted',
                                        'liquidAlerted'),
      gas = props.experiment.gas,
      liquid = props.experiment.liquid,
      contact = props.experiment.contact,
      self = this, gasMessage, liquidMessage, gasReading, liquidReading,
      cancelled = false;
      

  if (gas.bound) {
    gasReading = readings['a'];
    if (gasReading < gas.lower || gasReading > gas.upper) {
      gasMessage = 'Gas bound of ' +
                    (gasReading < gas.lower ? gas.lower : gas.upper) +
                    ' exceeded with a value of ' + gasReading;

      props.client.publish('/alert', {
        gas: { reading: gasReading }
      });
      if (contact !== 'none' && !props.gasAlerted) {
        handlerData.set('gasAlerted', true);
        props.client.publish('/alert', { alerted: true });
        email.setSubject('Experiment Alert');
        email.send(function (err, response) {
          if (err) {
            return console.error(err);
          }
          console.log('email(s) away!')
        }, gasMessage);
      }
      if (gas.auto) { cancelled = true; }
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
        liquid: { reading: liquidReading }
      });
      if (contact !== 'none' && !props.liquidAlerted) {
        handlerData.set('liquidAlerted', true);
        props.client.publish('/alert', { alerted: true });
        email.setSubject('Experiment Alert');
        email.send(function (err, response) {
          if (err) {
            return console.error(err);
          }
          console.log('email(s) away!');
        }, liquidMessage);
      }
      if (liquid.auto) { cancelled = true; }
    }
  }
  if (cancelled) {
    this.toggleCanceller(true);
    setTimeout(function () {
      self.toggleCanceller(false);
    }, 10000);
  }
}

function setColorBounds(color) {
  var lower, upper, msg;
  lower = tinycolor(color.lower).toHsv();
  upper = tinycolor(color.upper).toHsv();
  lower['h'] /= 2;
  lower['s'] *= 255;
  lower['v'] *= 255;
  upper['h'] /= 2;
  upper['s'] *= 255;
  upper['v'] *= 255;
  msg = 'set ' + lower['h'] + ' ' + lower['s'] + ' ' + lower['v'] +
        ' ' + upper['h'] + ' ' + lower['s'] + ' ' + lower['v'] + '\n';
  handlerData.get('webcam').stdin.write(msg);
  handlerData.get('webcam').stdin.write('bound-type ' + color.boudType);
}

function clearColorBounds() {
  var webcam = handlerData.get('webcam');
  webcam.stdin.write('clear\n');
}

function writeToFile (readings) {
  var exp = handlerData.get('experiment'),
      output = null, stream;
  if (exp.gas.save && exp.liquid.save) {
    output = 'a:' + readings['a'] + ';l:' + readings['l'];
  } else {
    if (exp.gas.save) {
      output = 'a:' + readings['a'];
    } else if (exp.liquid.save) {
      output = 'l:' + readings['l'];
    }
  }
  if (output) {
    stream = handlerData.get('stream');
    stream.write(output + '\n');
  }
}

function signalForData () {
  handlerData.get('arduino').stdin.write('d\n');
}

function setToField (contactInfo) {
  var to = '', user,
      experiment = handlerData.get('experiment');

  if (experiment.contact === 'none') { return; }
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

// Closed by handler object (not exposed to other modules).
// Acting as a private variable.

handlerData.get = function (key) {
  if (!key) {
    throw 'Cannot call get with ' + key + ' as key';
  }
  return handlerData[key];
};

handlerData.set = function (key, value) {
  if (!key) {
    throw 'Cannot call set with ' + key + ' as key';
  }
  handlerData[key] = value;
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
    throw new Error('Cannot call setProperties with no arguments');
  }
  for (key in hash) {
    this.set(key, hash[key]);
  }
};

// handler object is exposed to other modules.
// Where everything happens.

handler.initialize = function (bayeux, sessionStore) {
  var client;
  if (!bayeux) {
    throw new Error('Cannot call initialize with ' + bayeux);
  }
  if (!sessionStore) {
    throw new Error('Cannot call initialize with ' + sessionStore);
  }
  // Make faye server push-only. Authentication subscription requests.
  bayeux.addExtension({
    incoming: function (message, callback) {
      var password;
      if (!message.channel.match(/^\/meta\//)) {
        password = message.ext && message.ext.password;
        if (password !== secret) {
          message.error = '403::Password required';
        }
        callback(message);
      } else if (message.channel === '/meta/subscribe') {
        if (!(message.ext && message.ext.token)) {
          message.error = '403::Authentication required';
          return callback(message);
        }
        jwt.verify(message.ext.token, cert, function (err, decoded) {
          if (err || !decoded.uid) {
            message.error = '403::Authentication required';
          }
          callback(message);
        });
      } else { callback(message); }
    },
    outgoing: function (message, callback) {
      if (message.ext) { delete message.ext.password; }
      callback(message);
    }
  });
  // Enable server to send messages.
  client = bayeux.getClient();
  client.addExtension({
    outgoing: function (message, callback) {
      message.ext = message.ext || {};
      message.ext.password = secret;
      callback(message);
    }
  });
  handlerData.setProperties({
    bayeux: bayeux,
    client: client,
    relay: false,
    canceller: false,
    rate: 1
  });
};

handler.start = function () {
  var self = this,
      arduinoProcess = spawn(__dirname + '/python/arduino.py'),
      webcamProcess = spawn(__dirname +'/python/wrapper.sh');

  handlerData.set('arduino', arduinoProcess);
  handlerData.set('webcam', webcamProcess);

  arduinoProcess.stdout.on('data', function (data) {
    var client = handlerData.get('client'),
        exp = handlerData.get('experiment');
    data = data.toString().trim();
    if (data.indexOf('relay') >= 0) {
      if (data === 'relayOn') {
        handlerData.set('relay', true);
      } else {
        handlerData.set('relay', false);
      }
      client.publish('/status', { relay: handlerData.get('relay') });
      self.emit('relay', handlerData.get('relay'));
    } else if (data.indexOf('solenoid') >= 0) {
      if (data === 'solenoidOn') {
        handlerData.set('canceller', true);
        if (exp) { self.cancelExperiment(); }
      } else {
        handlerData.set('canceller', false);
      }
      client.publish('/status', { canceller: handlerData.get('canceller') });
      self.emit('canceller', handlerData.get('canceller'));
    } else {
      var sensors = data.split(';'),
          sensorReadings = {}
      for (var i = 0; i < sensors.length; ++i) {
        var reading = sensors[i].split(':');
        sensorReadings[reading[0]] = reading[1];
      }
      if (exp) {
        checkSensorBounds.call(self, sensorReadings);
        writeToFile(sensorReadings);
      }
      if (exp && exp.private) {
        client.publish('/data-private', sensorReadings);
      } else {
        client.publish('/data', sensorReadings);
      }
      
    }
  });

  webcamProcess.stderr.on('data', function (data) {
    var props;
    data = data.toString().trim();
    if (data === 'Exceeded') {
      props = handlerData.getProperties('client', 'colorAlerted',
                                        'experiment');

      props.client.publish('/alert', { color: true });
      if (exp.contact !== 'none' && !props.colorAlerted) {
        handlerData.set('colorAlerted', true);
        props.client.publish('/alert', { alerted: true });
        msg = 'Color bound exceeded';
        email.setSubject('Experiment Alert');
        email.send(function (err, response) {
          if (err) {
            return console.error(err);
          }
          console.log('email(s) away!');
        });
      }
      if (props.experiment.color.auto) {
        self.toggleCanceller(true);
        setTimeout(function () {
          self.toggleCanceller(false);
        }, 10000);
      }
    } else {
      console.error(data);
    }
  });
  handlerData.set('interval',
                  setInterval(signalForData, handlerData.get('rate') * 1000));
};

handler.lock = function () {
  handlerData.set('locked', true);
};

handler.unlock = function () {
  if (!handlerData.get('experiment')) {
    handlerData.set('locked', false);
  }
};

handler.isLocked = function () {
  return handlerData.get('locked');
};

handler.setExperiment = function (experiment, contactInfo) {
  if (!experiment) {
    throw new Error('Cannot call setExperiment with ' + experiment);
  }
  var stream = fs.createWriteStream(experiment.path, { mode: 0655 }),
      data = {}, self = this;
  handlerData.set('stream', stream);
  stream.on('open', function (fd) {
    handlerData.set('experiment', experiment);
    self.setContactInfo(contactInfo);
    handlerData.set('experimentJSON', experiment.toJSON());
    handlerData.set('gasAlerted', false);
    handlerData.set('liquidAlerted', false);
    handlerData.set('colorAlerted', false);
    if (experiment.color.bound) {
      setColorBounds(experiment.color);
    }
    if (experiment.rate != handlerData.get('rate')) {
      resetInterval(experiment.rate);
    }
    data.running = true;
    data.private = experiment.private;
    handlerData.get('client').publish('/status', data);
  });
};

handler.setContactInfo = function (contactInfo) {
  if (!contactInfo) {
    throw new Error('Cannot call setContactInfo with ' + contactInfo);
  }
  handlerData.set('contactInfo', contactInfo);
  setToField(contactInfo);
};

handler.updateExperiment = function (experiment) {
  var old, client;
  if (!experiment) {
    throw new Error('Cannot call updateExperiment with ' + experiment);
  }
  old = handlerData.get('experiment');
  handlerData.set('experiment', experiment);
  if (handlerData.get('rate') !== experiment.rate) {
    resetInterval(experiment.rate);
  }
  if (old.contact !== experiment.contact) {
    setToField(handlerData.get('contactInfo'));
  }
  if (experiment.color.bound) {
    setColorBounds(experiment.color);
  } else if (old.color.bound && !experiment.color.bound) {
    clearColorBounds();
  }
  client = handlerData.get('client');
  client.publish('/status', { private: experiment.private });
};

handler.clearExperiment = function () {
  var data = {};
  handlerData.get('stream').end();
  handlerData.setProperties({
    experiment: null,
    experimentJSON: null,
    rate: 1,
    gasAlerted: false,
    liquidAlerted: false,
    colorAlerted: false
  });
  data.running = false;
  data.private = false;
  clearColorBounds();
  resetInterval(handlerData.get('rate'));
  handlerData.get('client').publish('/status', data);
  handlerData.get('client').publish('/alert', { alerted: false });
};

handler.cancelExperiment = function () {
  var exp = handlerData.get('experiment'),
      self = this;
  exp.stop = new Date();
  exp.cancelled = true;
  exp.save(function (err, prod, num) {
    if (err) {
      // Send error message
      return console.error(err);
    }
    self.clearExperiment();
    handlerData.get('client').publish('/alert', { cancelled: true });
    if (exp.contact !== 'none') {
      email.setSubject('Experiment Cancelled');
      email.send(function (error, response) {
        if (error) {
          // retry, and send error if fails X times.
          return console.error(error);
        }
        console.log('experiment cancelled email(s) away');
      }, 'Experiment cancelled at ' + prod.stop);
    }
    self.unlock();
  });
};

handler.getExperiment = function () {
  return handlerData.get('experimentJSON');
};

handler.toggleRelay = function (state) {
  if (handlerData.get('relay') !== state) {
    handlerData.get('arduino').stdin.write('r\n');
  }
};

handler.getRelayStatus = function () {
  return handlerData.get('relay');
};

handler.toggleCanceller = function (state) {
  if (handlerData.get('canceller') !== state) {
    handlerData.get('arduino').stdin.write('s\n');
  }
};

handler.getCancellerStatus = function () {
  return handlerData.get('canceller');
};

handler.alertsSent = function () {
  return handlerData.get('gasAlerted') && handlerData.get('liquidAlerted');
};

handler.resetAlerts = function () {
  handlerData.setProperties({
    gasAlerted: false,
    liquidAlerted: false
  });
};

module.exports = handler;