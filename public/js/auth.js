window.App = Ember.Application.create();

// Define Routes.
App.Router.map(function () {
  this.route('signin');
  this.route('register');
});


App.IndexRoute = Ember.Route.extend({
  beforeModel: function () {
    this.transitionTo('signin');
  }
});

App.ResetRoute = Ember.Route.extend({
  setupController: function (controller, model) {
    controller.reset();
  }
});

App.SigninRoute = App.ResetRoute.extend();

App.RegisterRoute = App.ResetRoute.extend();

App.Router.reopen({
  rootURL: '/auth/'
});

Ember.TextField.reopen({
  attributeBindings: ['required', 'autofocus']
});

App.toastrFailCallback = function (jqXHR) {
  if (jqXHR.responseJSON) {
    toastr.error(jqXHR.responseJSON.error, 'Error');
  } else {
    toastr.error('The server exploded!', 'Error');
  }
};