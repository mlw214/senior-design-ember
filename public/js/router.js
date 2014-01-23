// Define Routes.
App.Router.map(function () {
  this.resource('experiment');
  this.resource('archive');
  this.resource('account');
  this.route('signin');
  this.route('register');
  this.route('signout');
});

App.ApplicationRoute = Ember.Route.extend();

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
    var properties = this.controllerFor('signin').getProperties('token', 
                                                                'userid');
    if (!properties.token || !properties.userid) {
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

App.AccountRoute = App.AuthenticatedRoute.extend({
  model: function () {
    return this.store.find('user', this.controllerFor('signin').get('userid'));
  }
});

App.SignoutRoute = App.AuthenticatedRoute.extend({
  beforeModel: function () {
    this.controllerFor('signin').setProperties({
      token: null,
      userid: null
    });
    delete localStorage.token;
    delete localStorage.userid;
    this.transitionTo('signin');
  }
});