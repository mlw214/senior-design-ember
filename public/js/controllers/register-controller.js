App.RegisterController = Ember.Controller.extend({

  needs: 'application',

  application: Ember.computed.alias('controllers.application'),

  reset: function () {
    this.setProperties({
      username: '',
      password: '',
      confirm: '',
      deviceID: ''
    });
    toastr.clear();
  },

  actions: {
    register: function () {
      var data = this.getProperties('username', 'password', 'confirm', 'deviceID'),
      self = this;
      toastr.clear();

      Ember.$.post('/user', data).done(function (response) {
        self.application.set('token', response.token);
// Redirect to #experiment
      }).fail(function (jqXHR) {
        toastr.error(jqXHR.responseJSON.error, 'Error');
      });
    }
  }
});