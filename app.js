
/**
 * Module dependencies.
 */
// Base modules.
var express = require('express'),
    http = require('http'),
    path = require('path'),
    mongoose = require('mongoose'),
// Routing modules.
    routes = require('./routes'),
    token = require('./routes/token'),
    users = require('./routes/users'),
    experiments = require('./routes/experiments'),
// Middleware modules.
    verifyToken = require('./lib/middleware/verify-token'),
    auth = require('./lib/middleware/authorization'),
// Other modules.
    User = require('./models/user');

var app = express();
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
app.use(verifyToken());
//app.use(express.cookieParser('your secret here'));
//app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// Development only.
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

// RESTful services.

// Token
app.post('/token', token.create);

// Users - uses id from token to determine user.
// Breaks conventions a bit with the GET request.
app.post('/users', users.create);
app.get('/users/:id', auth(), users.read);
app.put('/users/:id', auth(), users.update);
app.delete('/users/:id', auth(), users.delete);

// Experiments
app.post('/experiments', auth(),experiments.create);
app.get('/experiments', auth(), experiments.readAll);
app.get('/experiments/:id', auth(), experiments.read);
app.get('/experiments/:id/download', auth(), experiments.download);
app.put('/experiments/:id', auth(), experiments.update);
app.delete('/experiments/:id', auth(), experiments.delete);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
