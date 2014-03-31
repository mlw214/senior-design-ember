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
    var client = new Faye.Client('http://' + window.location.host + '/faye'),
        self = this,
        sensorsCont = this.controllerFor('sensors'),
        expCont = this.controllerFor('experiment'),
        alertSub, dataSub;
    controller.set('model', model);
    client.addExtension({
      outgoing: function (message, callback) {
        if (message.channel !== '/meta/subscribe') {
          return callback(message);
        }

        message.ext = message.ext || {};
        message.ext.token = localStorage.token;
        callback(message);
      }
    });
    controller.set('faye', client);
    client.subscribe('/status', function (message) {
      if (message.hasOwnProperty('running')) {
        controller.set('running', message.running);
      }
      if (message.hasOwnProperty('private')) {
        controller.set('private', message.private);
      }
      if (message.hasOwnProperty('relay')) {
        controller.set('relay', message.relay);
      }
      if (message.hasOwnProperty('canceller')) {
        controller.set('canceller', message.canceller);
      }
    });
    if (model.owner) {
      // Propagate changes here to experiment-controller.js.
      alertSub = client.subscribe('/alert', function (message) {
        App.alertSubHandler(message, controller, expCont, sensorsCont);
      });
      controller.set('alertSub', alertSub);
    }
    if (model.owner && model.private) {
      dataSub = client.subscribe('/data-private', function (message) {
        App.dataSubHandler(message, sensorsCont);
      });
      controller.set('dataSub', dataSub);
    } else {
      dataSub = client.subscribe('/data', function (message) {
        App.dataSubHandler(message, sensorsCont);
      });
      controller.set('dataSub', dataSub);
    }
  }
});

App.ApplicationController = Ember.ObjectController.extend({
  modelIdCount: -1,
  exceededCountGas: 0,
  exceededCountLiquid: 0,
  exceededCountColor: 0,
  incrementAndGetId: function () {
    var id = this.get('modelIdCount');
    this.set('modelIdCount', ++id);
    return id;
  },
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
  this.route('fourOhFour', { path: '*path' });
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
    var appCont = this.controllerFor('application'),
        placeholder, id;
    if (!this.get('id')) {
      placeholder = this.store.getById('experiment',
                                        appCont.get('modelIdCount'));

      if (placeholder) {
        return placeholder;
      } else {
        // Give it an ID so we can load it if the user nagivates away from
        // #experiment. Prevents empty records from being created everytime.
        id = appCont.incrementAndGetId();
        placeholder = this.store.createRecord('experiment', { id: id });

        return placeholder;
      }
    } else {
      return this.store.find('experiment', this.get('id'));
    }
  }
});

App.SensorsRoute = Ember.Route.extend();

App.ArchiveRoute = Ember.Route.extend();

App.ArchiveIndexRoute = Ember.Route.extend({

  model: function (params, transition) {
    var archiveCont = this.controllerFor('archiveIndex'),
        appCont = this.controllerFor('application'),
        page = archiveCont.get('page'),
        pages = archiveCont.get('pages'),
        id = appCont.get('modelIdCount');

    if (pages) {
      if (page !== 1 && page === pages) {
        exps = this.store.all('experiment');
        exps = exps.get('content');
        for (i = 0; i < exps.length; ++i) {
          if (exps[i].get('id') == id) { exps.splice(i, 1); }
        }
        if (((pages * 25) - exps.length) === 25) {
          archiveCont.set('page', --page);
        }
      }
    }

    return this.store.find('experiment', { page: page });
  },
  setupController: function (controller, model) {
    controller.set('model', model);
    var pages = this.store.metadataFor('experiment').pages;
    controller.set('pages', pages);
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

App.dataSubHandler = function (message, sensorsCont) {
  sensorsCont.setProperties({
    a: message.a,
    l: message.l
  });
};

App.alertSubHandler = function (message, appCont, expCont, sensorsCont) {
  var id, rec, gasSpan$, liquidSpan$, colorSpan$, gasCount, liquidCount,
      colorCount, html, dataSub, dataSubOld, client, self = this;
  if (message.hasOwnProperty('gas')) {
    gasSpan$ = $('#count-gas');
    gasCount = appCont.get('exceededCountGas') + 1;
    appCont.set('exceededCountGas', gasCount);
    if (gasSpan$.length) {
      html = gasCount + ' times since signin';
      gasSpan$.html(html);
    } else {
      html = '<span id="count-gas">' + gasCount;
      if (gasCount > 1) {
        html += ' times since signin</span>';
      } else {
        html += ' time since signin</span>';
      }
      toastr.warning(html, 'Gas Bound Exceeded',
                      { timeOut: 0, extendedTimeOut: 0 });
    }
  }
  if (message.hasOwnProperty('liquid')) {
    liquidSpan$ = $('#count-liquid');
    liquidCount = appCont.get('exceededCountLiquid') + 1;
    appCont.set('exceededCountLiquid', liquidCount);
    if (liquidSpan$.length) {
      html = liquidCount + ' times since signin'
      liquidSpan$.html(html);
    } else {
      html = '<span id="count-liquid">' + liquidCount;
      if (liquidCount > 1) {
        html += ' times since signin</span>';
      } else {
        html += ' time since signin</span>';
      }
      toastr.warning(html, 'Liquid Bound Exceeded',
                      { timeOut: 0, extendedTimeOut: 0 });
    }
  }
  if (message.hasOwnProperty('color')) {
    colorSpan$ = $('#count-color');
    colorCount = appCont.get('exceededCountColor') + 1;
    appCont.set('exceededCountColor', colorCount);
    if (colorSpan$.length) {
      html = colorCount + ' times since signin';
      colorSpan$.html(html);
    } else {
      html = '<spand id="count-color">' + colorCount;
      if (colorCount > 1) {
        html += ' times since signin</span>';
      } else {
        html += ' time since signin</span>';
      }
      toastr.warning(html, 'Color Bound Exceeded',
                      { timeOut: 0, extendedTimeOut: 0 });
    }
  }
  if (message.hasOwnProperty('alerted')) {
    appCont.set('alerted', message.alerted);
  }
  if (message.hasOwnProperty('cancelled')) {
    if (message.cancelled) {
      toastr.warning('Experiment cancelled', 'Alert');
      appCont.setProperties({
        owner: false,
        alerted: false,
        exceededCountGas: 0,
        exceededCountLiquid: 0,
        exceededCountColor: 0
      });
      appCont.get('alertSub').cancel();
      dataSubOld = appCont.get('dataSub');
      client = appCont.get('faye');
      dataSub = client.subscribe('/data', function (message) {
        App.dataSubHandler(message, sensorsCont);
      });
      dataSub.then(function () {
        dataSubOld.cancel();
        appCont.set('dataSub', dataSub);
      });
      appCont.set('alertSub', null);
      id = appCont.incrementAndGetId();
      rec = appCont.store.createRecord('experiment', { id: id });
      expCont.set('content', rec);
    }
  }
};

Ember.Handlebars.helper('format-date', function (date) {
  if (date) {
    return moment(date).format('MMM Do YYYY, h:mm a');
  } else return 'Ongoing';
});

Ember.Handlebars.helper('yes-no', function (bool) {
  if (bool) return 'Yes';
  else return 'No';
});

Ember.Handlebars.helper('expand-boundType', function (type) {
  if (type === 'in') {
    return 'Alert upon entering bounds';
  } else {
    return 'Alert upon leaving bounds';
  }
});