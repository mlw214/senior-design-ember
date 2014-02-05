
/**
 * Module dependencies.
 */
// Base modules.
var express = require('express'),
    http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
    faye = require('faye'),
    fayeRedis = require('faye-redis'),
// Routing modules.
    routes = require('./routes'),
    sessions = require('./routes/sessions'),
    status = require('./routes/status'),
    users = require('./routes/users'),
    authRoute = require('./routes/auth'),
    experiments = require('./routes/experiments'),
    arduinoRoute = require('./routes/arduino'),
// Middleware modules.
    verifyToken = require('./lib/middleware/verify-token'),
    auth = require('./lib/middleware/authorization'),
// Other modules.
    User = require('./models/user'),
    arduino = require('./lib/arduino');

var app = express(),
    server = http.createServer(app),
    bayeux = new faye.NodeAdapter({
      mount: '/faye',
      timeout: 45,
      engine: {
        type: fayeRedis,
        host: 'localhost',
        port: 6379
      }
    });
mongoose.connect('mongodb://localhost/labv2');

// All environments.
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// Development only.
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', auth.protectIndex(), routes.index);
app.get('/auth', authRoute.page);

// Sessions.
app.post('/sessions', sessions.create);
app.delete('/sessions',
            verifyToken(),
            auth.compareSessionAndToken(),
            sessions.delete);

// Arduino.
app.get('/status',
        verifyToken(),
        auth.compareSessionAndToken(),
        status.get);

app.put('/relay',
        verifyToken(),
        auth.compareSessionAndToken(),
        arduinoRoute.relay);
app.put('/canceller',
        verifyToken(),
        auth.compareSessionAndToken(),
        arduinoRoute.canceller);

// Users.
app.post('/users', users.create);
app.get('/users/current',
        verifyToken(),
        auth.compareSessionAndToken(),
        users.read);
app.put('/users/current',
        verifyToken(),
        auth.compareSessionAndToken(),
        users.update);
app.delete('/users/current',
            verifyToken(),
            auth.compareSessionAndToken(),
            users.delete);

// Experiments.
app.post('/experiments',
          verifyToken(),
          auth.compareSessionAndToken(),
          experiments.create);
app.get('/experiments',
        verifyToken(),
        auth.compareSessionAndToken(),
        experiments.readAll);
app.get('/experiments/current',
        verifyToken(),
        auth.compareSessionAndToken(),
        experiments.current);
app.get('/experiments/:id',
        verifyToken(),
        auth.compareSessionAndToken(),
        experiments.read);
app.get('/experiments/:id/download',
        verifyToken(),
        auth.compareSessionAndToken(),
        experiments.download);
app.put('/experiments/:id',
        verifyToken(),
        auth.compareSessionAndToken(),
        experiments.update);
app.delete('/experiments/:id',
            verifyToken(),
            auth.compareSessionAndToken(),
            experiments.delete);

bayeux.attach(server);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

arduino.initialize(bayeux);
arduino.start();