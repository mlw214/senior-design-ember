App.SigninController = Ember.Controller.extend({

  reset: function () {
    this.setProperties({
      username: '',
      password: '',
      remember: false
    });
    toastr.clear();
  },

  token: localStorage.token,

  tokenChanged: function () {
    localStorage.token = this.get('token');
  }.observes('token'),

  actions: {
    signin: function () {
      var data = this.getProperties('username', 'password', 'remember'),
          self = this;
      toastr.clear();
      Ember.$.post('/token', data).done(function (response) {
        self.set('token', response.token);

        var attemptedTransition = self.get('attemptedTransition');
        if (attemptedTransition) {
          attemptedTransition.retry();
          self.set('attemptedTransition', null);
        } else {
          self.transitionToRoute('experiment');
        }
      }).fail(function (jqXHR) {
        toastr.error(jqXHR.responseJSON.error, 'Error');
      });
    }
  }
});