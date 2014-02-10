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
    var client = new Faye.Client('http://' + window.location.host + '/faye'),
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
    client.subscribe('/alert', function (message) {
      console.log(message);
    });
  }
});
App.ApplicationController = Ember.ObjectController.extend({
  routeChanged: function () {
    var path = this.get('currentPath');
    if (path && path.search(/archive/) >= 0) {
      this.set('atArchive', true);
    } else {
      this.set('atArchive', false);
    }
  }.observes('currentPath'),
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

App.ApplicationSerializer = DS.RESTSerializer.extend({
  primaryKey: '_id'
});

// Define Routes.
App.Router.map(function () {
  this.resource('experiment');
  this.resource('sensors');
  this.resource('archive', function () {
    this.resource('record', { path: ':id' });
  });
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

App.ArchiveIndexRoute = Ember.Route.extend({
  model: function (params) {
    return this.store.find('experiment', { page: params.page });
  },
  setupController: function (controller, model) {
    controller.set('model', model);
    var pages = this.store.metadataFor('experiment').pages;
    controller.set('pages', pages);
  },
  actions: {
    queryParamsDidChange: function () {
      this.refresh();
    }
  }
});

App.RecordRoute = Ember.Route.extend({
  model: function (params) {
    return this.store.find('experiment', params.id);
  },
  setupController: function (controller, model) {
    controller.set('model', model);
  }
});

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

App.SignoutRoute = Ember.Route.extend({
  beforeModel: function () {
    Ember.$.ajax({
      url: '/sessions',
      type: 'delete'
    }).done(function () {
      localStorage.token = null;
      window.location.href = 'http://' + window.location.host + '/auth';
    }).fail(App.toastrFailCallback);
  }
});

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

Ember.Handlebars.helper('format-date', function (date) {
  return moment(date).format('MMM Do YYYY, h:mm a')
});