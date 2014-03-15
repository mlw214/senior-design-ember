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
          self = this, err = false;

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
        err = true;
      }
      if (data.password.length < 8) {
        this.set('badPassword', true);
        this.set('badPasswordMsg',
                  'Password must be at least 8 characters long');
        err = true;
      }
      if (data.password !== data.confirm) {
        this.set('doNotMatch', true);
        this.set('doNotMatchMsg', 'Passwords do not match');
        err = true;
      }
      if (err) { return; }
      Ember.$.post('/users', data).done(function (response) {
        self.set('justCreated', true);
        self.transitionToRoute('signin');
      }).fail(function (jqXHR) {
        var errors, i;
        if (jqXHR.responseJSON) {
          if (jqXHR.responseJSON.formErrors) {
            errors = jqXHR.responseJSON.formErrors;
            console.log(errors);
            for (var i = 0; i < errors.length; ++i) {
              if (errors[i].field === 'username') {
                self.set('badUsername', true);
                self.set('badUsernameMsg', errors[i].error);
              } else if (errors[i].field === 'password') {
                console.log('password');
                self.set('badPassword', true);
                self.set('badPasswordMsg', errors[i].error);
              } else if (errors[i].field === 'confirm') {
                self.set('doNotMatch', true);
                self.set('doNotMatchMsg', errors[i].error);
              }
            }
          } else {
            self.set('responseError', true);
            self.set('errorMsg', jqXHR.responseJSON.error);
          }
        } else {
          self.set('errorMsg', 'The server exploded!');
          self.set('responseError', true);
        }
      });
    }
  }
});