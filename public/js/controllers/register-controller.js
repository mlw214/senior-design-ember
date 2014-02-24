App.RegisterController = Ember.Controller.extend({

  reset: function () {
    this.setProperties({
      username: '',
      password: '',
      confirm: '',
      deviceID: '',
      justCreated: false
    });
  },

  actions: {
    register: function () {
      var data = this.getProperties('username', 'password', 'confirm', 'deviceID'),
      self = this;
      if (data.password.length < 8) {
        return;
      }
      if (data.password !== data.confirm) {
        return;
      }
      Ember.$.post('/users', data).done(function (response) {
        self.set('justCreated', true);
        self.transitionToRoute('signin');
      }).fail();
    }
  }
});