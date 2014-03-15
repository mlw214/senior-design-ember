App.SigninController = Ember.Controller.extend({

  reset: function () {
    this.setProperties({
      username: '',
      password: '',
      errorMsg: '',
      responseError: false
    });
  },

  actions: {
    signin: function () {
      var data = this.getProperties('username', 'password'),
          self = this;

      this.set('responseError', false);

      Ember.$.post('/sessions', data).done(function (response) {
        localStorage.token = response.token;
        location.href = '/';
      }).fail(function (jqXHR) {
        if (jqXHR.responseJSON) {
          self.set('errorMsg', jqXHR.responseJSON.error);
        } else {
          self.set('errorMsg', 'The server exploded');
        }
        self.set('responseError', true);
      });
    }
  }
});