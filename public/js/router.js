// Define Routes.
App.Router.map(function () {
  this.resource('experiment');
  this.resource('archive');
  this.resource('account');
  this.route('signin');
  this.route('register');
});

App.GatewayRoute = Ember.Route.extend({
  beforeModel: function (transition) {
    if (this.controllerFor('signin').get('token')) {
      transition.abort();
    }
  },

  setupController: function (controller, context) {
    controller.reset();
  }
});

App.AuthenticatedRoute = Ember.Route.extend({
  beforeModel: function (transition) {
    if (!this.controllerFor('signin').get('token')) {
      this.redirectToSignin(transition);
    }
  },

  redirectToSignin: function (transition) {
    var loginController = this.controllerFor('signin');
    loginController.set('attemptedTransition', transition);
    this.transitionTo('signin');
  }
});

// No index page - redirect to experiment page.
App.IndexRoute = App.AuthenticatedRoute.extend({
  beforeModel: function() {
    this.transitionTo('experiment');
  }
});

App.RegisterRoute = App.GatewayRoute.extend();

App.SigninRoute = App.GatewayRoute.extend();

App.ExperimentRoute = App.AuthenticatedRoute.extend();

App.ArchiveRoute = App.AuthenticatedRoute.extend();

App.AccountRoute = App.AuthenticatedRoute.extend();