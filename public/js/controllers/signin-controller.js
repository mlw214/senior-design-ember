App.SigninController = Ember.Controller.extend({

  reset: function () {
    this.setProperties({
      username: '',
      password: ''
    });
    toastr.clear();
  },

  token: localStorage.token,

  userid: localStorage.userid,

  userInfoChanged: function () {
    var token = this.get('token');
    var userid = this.get('userid');
    localStorage.token = token;
    localStorage.userid = userid;
  }.observes('token', 'userid'),

  actions: {
    signin: function () {
      var data = this.getProperties('username', 'password'),
          self = this;
      toastr.clear();
      Ember.$.post('/token', data).done(function (response) {
        self.set('token', response.token);
        self.set('userid', response.id);
        DS.RESTAdapter.reopen({
          headers: {
            token: self.get('token')
          }
        });

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