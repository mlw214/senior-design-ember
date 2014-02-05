App.SigninController = Ember.Controller.extend({

  reset: function () {
    this.setProperties({
      username: '',
      password: ''
    });
    toastr.clear();
  },

  actions: {
    signin: function () {
      var data = this.getProperties('username', 'password'),
          self = this;
      toastr.clear();
      Ember.$.post('/sessions', data).done(function (response) {
        localStorage.token = response.token;
        location.href = 'http://localhost:3000';
      }).fail(App.toastrFailCallback);
    }
  }
});