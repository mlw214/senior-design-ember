App.AccountController = Ember.ObjectController.extend({
  carriers: ['Choose one', 'AT&T', 'Sprint', 'T-Mobile', 'Verizon'],

  cache: null,

  actions: {
    saveContact: function () {
      var data = this.getProperties('email', 'carrier', 'cellphone');
      data.changing = 'contact';
      Ember.$.ajax({
        type: 'put',
        url: '/users/current',
        data: { user: data }
      }).done(function (response) {
        this.set('cache', response);
        toastr.success('Updated contact info', 'Success');
      }).fail(App.toastrFailCallback);
    },
    savePassword: function () {
      var data = this.getProperties('oldPassword', 'newPassword',
                                    'confirmPassword'),
          self = this;
      data.changing = 'password';

      self.setProperties({
        invalid: false,
        failed: false
      });
      Ember.$.ajax({
        type: 'put',
        url: '/users/current',
        data: { user: data }
      }).done(function (response) {
        self.set('oldPassword', '');
        self.set('newPassword', '');
        self.set('confirmPassword', '');
        toastr.success('Updated password', 'Success');
      }).fail(function (jqXHR) {
        if (jqXHR.responseJSON) {
          if (jqXHR.status === 400) {
            self.set('invalid', true);
          } else if (jqXHR.status === 401) {
            self.set('failed', true);
          }
          toastr.error(jqXHR.responseJSON.error, 'Error');
        } else {
          toastr.error('The server exploded!', 'Error');
        }
      });
    },
    deleteAccount: function () {
      var password = this.get('password');
      Ember.$.ajax({
        type: 'delete',
        url: '/users/current',
        data: { user: password }
      }).done(function (response) {

      }).fail(App.toastrFailCallback);
    }
  }
});