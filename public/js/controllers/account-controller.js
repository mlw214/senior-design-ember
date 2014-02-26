App.AccountController = Ember.ObjectController.extend({
  carriers: ['Choose one', 'AT&T', 'Sprint', 'T-Mobile', 'Verizon'],

  actions: {
    saveContact: function () {
      var data = this.getProperties('email', 'carrier', 'cellphone'),
          self = this;

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
      /*if (!validator.isEmail(data.email) && data.email !== '') {
        this.set('badEmail', true);
        this.set('badEmailMsg', 'Invalid email');
        return;
      }
      data.cellphone = validator.toTelephone(data.cellphone);
      if (!data.cellphone && data.cellphone !== '') {
        this.set('badCellphone', true);
        this.set('badCellphoneMsg', 'Invalid cellphone number');
        return;
      }
      if (data.cellphone && this.carriers[0] === data.carrier) {
        this.set('noCarrier', true);
        this.set('noCarrierMsg', 'No cellphone carrier chosen');
        return;
      }*/

      data.changing = 'contact';
      Ember.$.ajax({
        type: 'put',
        url: '/users/current',
        data: { user: data }
      }).done(function (response) {
        self.set('cache', response);
        toastr.success('Updated contact info', 'Success');
      }).fail(function (jqXHR) {
        var field;
        if (jqXHR.responseJSON) {
          if (jqXHR.responseJSON.field) {
            field = jqXHR.responseJSON.field;
            if (field === 'email') {
              self.set('badEmail', true);
              self.set('badEmailMsg', jqXHR.responseJSON.error);
            } else if (field === 'cellphone') {
              self.set('badCellphone', true);
              self.set('badCellphoneMsg', jqXHR.responseJSON.error);
            } else if (field === 'carrier') {
              self.set('noCarrier', true);
              self.set('noCarrierMsg', jqXHR.responseJSON.error);
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
      /*App.UserStore.saveCurrentUser().then(function (response) {
        toastr.success('YAY');
      }).fail(function (jqXHR) {
        var field;
        if (jqXHR.responseJSON) {
          if (jqXHR.responseJSON.field) {
            field = jqXHR.responseJSON.field;
            if (field === 'email') {
              self.set('badEmail', true);
              self.set('badEmailMsg', jqXHR.responseJSON.error);
            } else if (field === 'cellphone') {
              self.set('badCellphone', true);
              self.set('badCellphoneMsg', jqXHR.responseJSON.error);
            } else if (field === 'carrier') {
              self.set('noCarrier', true);
              self.set('noCarrierMsg', jqXHR.responseJSON.error);
            }
          } else {
            self.set('responseError', true);
            self.set('responseErrorMsg', jqXHR.responseJSON.error);
          }

        } else {
          self.set('responseError', true);
          self.set('responseErrorMsg', 'The server exploded');
        }
      });*/
    },
    savePassword: function () {
      var data = this.getProperties('oldPassword', 'newPassword',
                                    'confirmPassword'),
          self = this;
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
        return;
      } else if (data.newPassword !== data.confirmPassword) {
        this.set('doNotMatch', true);
        this.set('doNotMatchMsg', 'Passwords do not match');
        return;
      } else if (data.oldPassword === data.newPassword) {
        this.set('badPassword', true);
        this.set('badPasswordMsg', 'New password is the same as the old one');
        return;
      }

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
        var field;
        if (jqXHR.responseJSON) {
          if (jqXHR.responseJSON.field) {
            var field = jqXHR.responseJSON.field;
            if (field === 'oldPassword') {
              self.set('failedChange', true);
              self.set('failedChangeMsg', jqXHR.responseJSON.error);
            } else if (field === 'password') {
              self.set('badPassword', true);
              self.set('badPasswordMsg', jqXHR.responseJSON.error);
            } else if (field === 'confirm') {
              self.set('doNotMatch', true);
              self.set('doNotMatchMsg', jqXHR.responseJSON.error);
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

      }).fail(function (response) {
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