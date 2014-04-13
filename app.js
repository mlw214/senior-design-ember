/*
 * Miller Wilt
 * 2013-04-12
 * app.js
 */
// Main entry point for the Node.js application.
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
    connectRedis = require('connect-redis'),
// Routing modules.
    routes = require('./routes'),
    sessions = require('./routes/sessions'),
    status = require('./routes/status'),
    users = require('./routes/users'),
    authRoute = require('./routes/auth'),
    experiments = require('./routes/experiments'),
    handlerRoute = require('./routes/hardware-interface'),
// Middleware modules.
    verifyToken = require('./lib/middleware/verify-token'),
    auth = require('./lib/middleware/authorization'),
    errorHandler = require('./lib/middleware/error-handling'),
// Other modules.
    User = require('./models/user'),
    handler = require('./lib/hardware-interface'),
    secrets = require('./security/secret');

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
    }),
    RedisStore = connectRedis(express),
    store = new RedisStore({
      host: 'localhost',
      port: 6379,
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
app.use(express.cookieParser());
app.use(express.session({
  store: store,
  secret: secrets.storeSecret
}));
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// Development only.
/*if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}*/

// Start Routing

// Webpages.
app.get('/', auth.hasSession(), routes.index);
app.get('/auth', authRoute.page);

// Sessions.
app.post('/sessions', sessions.create);
app.delete('/sessions',
            verifyToken(),
            auth.compareSessionAndToken(),
            sessions.delete);

// Hardware interfacing.
app.get('/status',
        verifyToken(),
        auth.compareSessionAndToken(),
        status.get);
app.get('/reset-alerts',
        verifyToken(),
        auth.compareSessionAndToken(),
        handlerRoute.resetAlerts);
app.put('/relay',
        verifyToken(),
        auth.compareSessionAndToken(),
        handlerRoute.relay);
app.put('/canceller',
        verifyToken(),
        auth.compareSessionAndToken(),
        handlerRoute.canceller);

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
        auth.hasSession(),
        experiments.download);
app.put('/experiments/:id',
        verifyToken(),
        auth.compareSessionAndToken(),
        experiments.update);
app.delete('/experiments/:id',
            verifyToken(),
            auth.compareSessionAndToken(),
            experiments.delete);

// For testing.
//app.get('/test', function (req, res) { res.render('test'); });

// My error handling
app.use(errorHandler);

// Handle 404s
app.use(function (req, res, next) {
  res.send(404, 'Page not found');
});

bayeux.attach(server);
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

handler.initialize(bayeux, store);
handler.start();
