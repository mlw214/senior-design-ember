
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
    user = require('./routes/user'),
    experiment = require('./routes/experiment'),
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

// User
app.post('/user', user.create);
app.get('/user/:id', user.read);
app.put('/user/:id', user.update);
app.delete('/user/:id', user.delete);

// Experiment
app.post('/experiment', experiment.create);
app.get('/experiment', experiment.readAll);
app.get('/experiment/:id', experiment.read);
app.get('/experiment/:id/download', experiment.download);
app.put('/experiment/:id', experiment.update);
app.delete('/experiment/:id', experiment.delete);

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
