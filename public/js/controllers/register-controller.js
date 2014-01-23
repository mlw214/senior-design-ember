App.RegisterController = Ember.Controller.extend({

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

      Ember.$.post('/users', data).done(function (response) {
        self.controllerFor('signin').set('token', response.token);
        self.redirectToRoute('experiment');
      }).fail(function (jqXHR) {
        toastr.error(jqXHR.responseJSON.error, 'Error');
      });
    }
  }
});