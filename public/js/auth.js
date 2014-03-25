window.App = Ember.Application.create();

// Define Routes.
App.Router.map(function () {
  this.route('signin');
  this.route('register');
  this.route('fourOhFour', { path: '*path' });
});


App.IndexRoute = Ember.Route.extend({
  beforeModel: function () {
    this.transitionTo('signin');
  }
});

App.ResetRoute = Ember.Route.extend({
  setupController: function (controller, model) {
    controller.set('model', model);
    controller.reset();
  }
});

App.SigninRoute = App.ResetRoute.extend({
  setupController: function (controller, model) {
    this._super(controller, model);
    var cont = this.controllerFor('register');
    if (cont.get('justCreated')) {
      toastr.success('Registration completed', 'Success');
      cont.set('justCreated', false);
    }
  }
});

App.RegisterRoute = App.ResetRoute.extend();

App.Router.reopen({
  rootURL: '/auth/'
});

Ember.TextField.reopen({
  attributeBindings: ['required', 'autofocus'],
});