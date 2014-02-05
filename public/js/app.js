window.App = Ember.Application.create();
Ember.$.ajaxSetup({
  headers: {
    token: localStorage.token
  }
});
App.ApplicationRoute = Ember.Route.extend({
  model: function () {
    return Ember.$.getJSON('/status');
  },
  setupController: function (controller, model) {
    controller.set('model', model);
    var client = new Faye.Client('http://localhost:3000/faye'),
        sensorCont = this.controllerFor('sensors');
    controller.set('faye', client);
    client.subscribe('/data', function (message) {
      sensorCont.setProperties({
        a: message.a,
        l: message.l
      });
    });
    client.subscribe('/status', function (message) {
      if (message.hasOwnProperty('running')) {
        controller.set('running', message.running);
      }
      if (message.hasOwnProperty('relay')) {
        controller.set('relay', message.relay);
      }
      if (message.hasOwnProperty('canceller')) {
        controller.set('canceller', message.canceller);
      }
    });
  }
});
App.ApplicationController = Ember.ObjectController.extend({
  faye: null,
  buttonDisabled: false,
  runningAlerted: function () {
    var running = this.get('running');
    var message = (running ? 'Experiment running' : 'No experiment running');
    toastr.info(message, 'Status');
  }.observes('running'),
  isButtonDisabled: function () {
    var running = this.get('running'),
        owner = this.get('owner');

    this.set('buttonDisabled', running && !owner);
  }.observes('running', 'owner')
});

// Define Routes.
App.Router.map(function () {
  this.resource('experiment');
  this.resource('sensors');
  this.resource('archive');
  this.resource('account');
  this.route('signout');
});

// No index page - redirect to experiment page.
App.IndexRoute = Ember.Route.extend({
  beforeModel: function() {
    this.transitionTo('sensors');
  }
});

App.ExperimentRoute = Ember.Route.extend({
  beforeModel: function () {
    var self = this;
    return Ember.$.getJSON('/experiments/current').then(function (response) {
      self.set('id', response.id);
    });
  },
  model: function () {
    if (!this.get('id')) {
      return this.store.createRecord('experiment');
    } else {
      return this.store.find('experiment', this.get('id'));
    }
  }
});

App.SensorsRoute = Ember.Route.extend();

App.ArchiveRoute = Ember.Route.extend();

App.AccountRoute = Ember.Route.extend({
  model: function () {
    var cache = this.get('cache');
    if (cache) {
      return cache;
    }
    return Ember.$.getJSON('/users/current');
  },
  setupController: function (controller, model) {
    controller.set('model', model);
    controller.set('cache', model);
  }
});

App.SignoutRoute = Ember.Route.extend();

Ember.TextField.reopen({
  attributeBindings: ['required', 'autofocus']
});

App.toastrFailCallback = function (jqXHR) {
  if (jqXHR.responseJSON) {
    toastr.error(jqXHR.responseJSON.error, 'Error');
  } else {
    toastr.error('The server exploded', 'Error');
  }
};