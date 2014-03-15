App.AccountController = Ember.ObjectController.extend({
  carriers: ['Choose one', 'AT&T', 'Sprint', 'T-Mobile', 'Verizon'],

  actions: {
    saveContact: function () {
      var data = this.getProperties('email', 'carrier', 'cellphone'),
          self = this, err = false, backup;

      this.setProperties({
        badEmail: false,
        noCarrier: false,
        badCellphone: false,
        contactResponseError: false,
        badEmailMsg: '',
        badCellphoneMsg: '',
        noCarrierMsg: '',
        contactResponseErrorMsg: ''
      });

      // Some basic verification.
      if (!validator.isEmail(data.email) && data.email !== '') {
        this.set('badEmail', true);
        this.set('badEmailMsg', 'Invalid email');
        err = true;
      }
      // Want to keep a backup of the user input so we can throw an error
      // if they enter an invalid cellphone number and don't choose a carrier.
      backup = data.cellphone
      data.cellphone = validator.toTelephone(data.cellphone);
      if (!data.cellphone && data.cellphone !== '') {
        this.set('badCellphone', true);
        this.set('badCellphoneMsg', 'Invalid cellphone number');
        err = true;
      }
      // If we were using the new data.cellphone, this would always be false
      // if the user entered an incorrect number (see above).
      if (backup && this.carriers[0] === data.carrier) {
        this.set('noCarrier', true);
        this.set('noCarrierMsg', 'No cellphone carrier chosen');
        err = true;
      }

      if (err) { return; }

      data.changing = 'contact';
      Ember.$.ajax({
        type: 'put',
        url: '/users/current',
        data: { user: data }
      }).done(function (response) {
        self.set('cache', response);
        toastr.success('Updated contact info', 'Success');
      }).fail(function (jqXHR) {
        var errors, i;
        if (jqXHR.responseJSON) {
          if (jqXHR.responseJSON.formErrors) {
            errors = jqXHR.responseJSON.formErrors;
            for (i = 0; i < errors.length; ++i) {
              if (errors[i].field === 'email') {
                self.set('badEmail', true);
                self.set('badEmailMsg', errors[i].error);
              } else if (errors[i].field === 'cellphone') {
                self.set('badCellphone', true);
                self.set('badCellphoneMsg', errors[i].error);
              } else if (errors[i].field === 'carrier') {
                self.set('noCarrier', true);
                self.set('noCarrierMsg', errors[i].error);
              }
            }
          } else {
            self.set('contactResponseError', true);
            self.set('contactResponseErrorMsg', jqXHR.responseJSON.error);
          }

        } else {
          self.set('contactResponseError', true);
          self.set('contactResponseErrorMsg', 'The server exploded');
        }
      });
    },
    savePassword: function () {
      var data = this.getProperties('oldPassword', 'newPassword',
                                    'confirmPassword'),
          self = this, err = false;
      data.changing = 'password';

      this.setProperties({
        failedChange: false,
        badPassword: false,
        doNotMatch: false,
        failedChangeMsg: '',
        badPasswordMsg: '',
        doNotMatchMsg: '',
        pwResponseError: '',
        pwResponseErrorMsg: ''
      });

      // Some basic validation.
      if (data.newPassword.length < 8) {
        this.set('badPassword', true);
        this.set('badPasswordMsg',
                  'Password must be at least 8 characters long');
        err = true;
      } else if (data.oldPassword === data.newPassword) {
        this.set('badPassword', true);
        this.set('badPasswordMsg', 'New password is the same as the old one');
        err = true;
      }
      if (data.newPassword !== data.confirmPassword) {
        this.set('doNotMatch', true);
        this.set('doNotMatchMsg', 'Passwords do not match');
        err = true;
      }

      if (err) { return; }

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
        var errors, i;
        if (jqXHR.responseJSON) {
          if (jqXHR.responseJSON.formErrors) {
            errors = jqXHR.responseJSON.formErrors;
            for (i = 0; i < errors.length; ++i) {
              if (errors[i].field === 'oldPassword') {
                self.set('failedChange', true);
                self.set('failedChangeMsg', errors[i].error);
              } else if (errors[i].field === 'password') {
                self.set('badPassword', true);
                self.set('badPasswordMsg', errors[i].error);
              } else if (errors[i].field === 'confirm') {
                self.set('doNotMatch', true);
                self.set('doNotMatchMsg', errors[i].error);
              }
            }
          } else {
            self.set('pwResponseError', true);
            self.set('pwResponseErrorMsg', jqXHR.responseJSON.error);
          }
        } else {
          self.set('pwResponseError', true);
          self.set('pwResponseErrorMsg', 'The server exploded');
        }
      });
    },
    deleteAccount: function () {
      var password = this.get('password');
      this.setProperties({
        failedDelete: false,
        deleteResponseError: false,
        failedDeleteMsg: '',
        deleteResponseErrorMsg: ''
      })
      Ember.$.ajax({
        type: 'delete',
        url: '/users/current',
        data: { user: password }
      }).done(function (response) {
        location.href = '/auth/#signin';
      }).fail(function (jqXHR) {
        var field;
        if (jqXHR.responseJSON) {
          if (jqXHR.responseJSON.field) {
          } else {
            self.set('deleteResponseError', true);
            self.set('deleteResponseErrorMsg', jqXHR.responseJSON.error);
          }
        } else {
          self.set('deleteResponseError', true);
          self.set('deleteResponseErrorMsg', 'The server exploded');
        }
      });
    }
  }
});