App.AccountController = Ember.ObjectController.extend({
  carriers: ['Choose one', 'AT&T', 'Sprint', 'T-Mobile', 'Verizon'],

  actions: {
    saveContact: function () {
      var data = this.getProperties('email', 'carrier', 'cellphone'),
          self = this;

      this.setProperties({
        badEmail: false,
        noCarrier: false,
        badCellphone: false
      });

      // Some basic verification.
      if (!validator.isEmail(data.email) && data.email !== '') {
        this.set('badEmail', true);
        //toastr.error('Invalid email', 'Error');
        return;
      }
      data.cellphone = validator.toTelephone(data.cellphone);
      if (!data.cellphone && data.cellphone !== '') {
        this.set('badCellphone', true);
        //toastr.error('Invalid cellphone number', 'Error');
        return;
      }
      if (data.cellphone && this.carriers[0] === data.carrier) {
        this.set('noCarrier', true);
        //toastr.error('You must choose a cellphone carrier', 'Error');
        return;
      }

      /*data.changing = 'contact';
      Ember.$.ajax({
        type: 'put',
        url: '/users/current',
        data: { user: data }
      }).done(function (response) {
        self.set('cache', response);
        toastr.success('Updated contact info', 'Success');
      }).fail(App.toastrFailCallback);
      App.UserStore.saveCurrentUser().catch(function (response) {
        console.log(response);
      });*/
    },
    savePassword: function () {
      var data = this.getProperties('oldPassword', 'newPassword',
                                    'confirmPassword'),
          self = this;
      data.changing = 'password';

      this.setProperties({
        invalid: false,
        failed: false
      });

      // Some basic validation.
      if (data.newPassword.length < 8) {
        this.set('invalid', true);
        //toastr.error('New password must be at least 8 characters long', 'Error');
        return;
      } else if (data.newPassword !== data.confirmPassword) {
        this.set('invalid', true);
        //toastr.error('Passwords must match', 'Error');
        return;
      } else if (data.oldPassword === data.newPassword) {
        this.set('invalid', true);
        //toastr.error('New password is the same as the old one', 'Error');
        return;
      }

      /*Ember.$.ajax({
        type: 'put',
        url: '/users/current',
        data: { user: data }
      }).done(function (response) {
        self.set('oldPassword', '');
        self.set('newPassword', '');
        self.set('confirmPassword', '');
        toastr.success('Updated password', 'Success');
      }).fail(function (response) {
        console.log(response);
      });*/
    },
    deleteAccount: function () {
      var password = this.get('password');
      Ember.$.ajax({
        type: 'delete',
        url: '/users/current',
        data: { user: password }
      }).done(function (response) {

      }).fail(function (response) {
        console.log(response);
      });
    }
  }
});