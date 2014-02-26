App.RegisterController = Ember.Controller.extend({

  reset: function () {
    this.setProperties({
      username: '',
      password: '',
      confirm: '',
      deviceID: '',
      errorMsg: '',
      badUsernameMsg: '',
      badPasswordMsg: '',
      doNotMatchMsg: '',
      justCreated: false,
      badUsername: false,
      badPassword: false,
      doNotMatch: false,
      responseError: false
    });
  },

  actions: {
    register: function () {
      var data = this.getProperties('username', 'password', 'confirm', 'deviceID'),
          self = this;

      this.setProperties({
        badUsernameMsg: '',
        badPasswordMsg: '',
        doNotMatchMsg: '',
        badUsername: false,
        badPassword: false,
        doNotMatch: false,
        responseError: false
      });

      if (!validator.isAlphanumeric(data.username)) {
        this.set('badUsername', true);
        this.set('badUsernameMsg',
                  'Username can contain only Alphanumeric characters');
        return;
      }
      if (data.password.length < 8) {
        this.set('badPassword', true);
        this.set('badPasswordMsg',
                  'Password must be at least 8 characters long');
        return;
      }
      if (data.password !== data.confirm) {
        this.set('doNotMatch', true);
        this.set('doNotMatchMsg', 'Passwords do not match');
        return;
      }
      Ember.$.post('/users', data).done(function (response) {
        self.set('justCreated', true);
        self.transitionToRoute('signin');
      }).fail(function (jqXHR) {
        var field;
        if (jqXHR.responseJSON) {
          if (jqXHR.responseJSON.field) {
            field = jqXHR.responseJSON.field;
            if (field === 'username') {
              self.set('badUsername', true);
              self.set('badUsernameMsg', jqXHR.responseJSON.error);
            } else if (field === 'password') {
              self.set('badPasswordMsg', true);
              self.set('badPasswordMsg', jqXHR.responseJSON.error);
            } else if (field === 'confirm') {
              self.set('doNotMatch', true);
              self.set('doNotMatchMsg', jqXHR.responseJSON.error);
            }
          } else {
            self.set('errorMsg', jqXHR.responseJSON.error);
            self.set('responseError', true);
          }
        } else {
          self.set('errorMsg', 'The server exploded!');
          self.set('responseError', true);
        }
      });
    }
  }
});