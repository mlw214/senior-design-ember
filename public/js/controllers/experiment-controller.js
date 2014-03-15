App.ExperimentController = Ember.ObjectController.extend({

  needs: 'application',

  notOwner: Ember.computed.not('controllers.application.owner'),
  
  noGasBound: Ember.computed.not('gas.bound'),
  noLiquidBound: Ember.computed.not('liquid.bound'),
  noColorBound: Ember.computed.not('color.bound'),

  clearErrors: function () {
    this.setProperties({
      nameError: false,
      badGBLower: false,
      badGBUpper: false,
      badLBLower: false,
      badLBUpper: false,
      responseError: false,
      nameErrorMsg: '',
      badGBLowerMsg: '',
      badGBUpperMsg: '',
      badLBLowerMsg: '',
      badLBUpperMsg: '',
      responseErrorMsg: ''
    });
  },

  checkForErrors: function () {
    var nameErr = false, boundErr = false;
    if (!this.get('name')) {
      this.set('nameError', true);
      this.set('nameErrorMsg', 'Name is empty');
      nameErr = true;
    }
    boundErr = this.checkBounds();
    if (nameErr || boundErr) {
      this.set('responseError', true);
      this.set('responseErrorMsg',
                'Your submission contains errors. Please fix them.');
    }
    return boundErr || nameErr;
  },

  checkBounds: function () {
    var props = this.getProperties('gas', 'liquid'),
        gasLower, gasUpper, liquidLower, liquidUpper, err = false;
    if (props.gas.bound) {
      gasLower = parseInt(props.gas.lower, 10);
      gasUpper = parseInt(props.gas.upper, 10);
      if (isNaN(gasLower)) {
        this.set('badGBLower', true);
        this.set('badGBLowerMsg', 'Not a number');
        err = true;
      }
      if (isNaN(gasUpper)) {
        this.set('badGBUpper', true);
        this.set('badGBUpperMsg', 'Not a number');
        err = true;
      }
      if (!isNaN(gasLower) && !isNaN(gasUpper)) {
        if (gasLower >= gasUpper) {
          this.set('badGBUpper', true);
          this.set('badGBUpperMsg',
                    'Upper bound must be greater than the lower');
          err = true;
        }
      }
    }
    if (props.liquid.bound) {
      liquidLower = parseInt(props.liquid.lower, 10);
      liquidUpper = parseInt(props.liquid.upper, 10);
      if (isNaN(liquidLower)) {
        this.set('badLBLower', true);
        this.set('badLBLowerMsg', 'Not a number');
        err = true;
      }
      if (isNaN(liquidUpper)) {
        this.set('badLBUpper', true);
        this.set('badLBUpperMsg', 'Not a number');
        err = true;
      }
      if (!isNaN(liquidLower) && !isNaN(liquidUpper)) {
        if (liquidLower >= liquidUpper) {
          this.set('badLBUpper', true);
          this.set('badLBUpperMsg',
                    'Upper bound must be greater than the lower');
          err = true;
        }
      }
    }
    return err;
  },

  errorHandler: function (jqXHR) {
    var i, errors;
    if (jqXHR.responseJSON) {
      if (jqXHR.responseJSON.formErrors) {
        errors = jqXHR.responseJSON.formErrors;
        for (i = 0; i < errors.length; ++i) {
          if (errors[i].field === 'gasLower') {
            this.set('badGBLower', true);
            this.set('badGBLowerMsg', errors[i].error);
          } else if (errors[i].field === 'gasUpper') {
            this.set('badGBUpper', true);
            this.set('badGBUpperMsg', errors[i].error);
          } else if (errors[i].field === 'liquidLower') {
            this.set('badLBLower', true);
            this.set('badLBLowerMsg', errors[i].error);
          } else if (errors[i].field === 'liquidUpper') {
            this.set('badLBUpper', true);
            this.set('badLBUpperMsg', errors[i].error);
          } else if (errors[i].field === 'name') {
            this.set('nameError', true);
            this.set('nameErrorMsg', errors[i].error);
          }
        }
        this.set('responseError', true);
        this.set('responseErrorMsg',
                  'Your submission contains errors. Please fix them.');
      } else {
        this.set('responseError', true);
        this.set('responseErrorMsg', jqXHR.responseJSON.error.toString());
      }
    } else {
      this.set('responseError', true);
      this.set('responseErrorMsg', 'The server exploded');
    }
  },

  actions: {
    save: function () {
      var self = this,
          appCont = this.get('controllers.application');

      this.clearErrors()

      // Basic data verification.
      if (this.checkForErrors()) { return; }
      // Set id to null. If it isn't Ember will freak that the id changes
      // in the response.
      this.set('id', null);
      this.set('start', new Date());
      this.get('model').save().then(function (response) {
        var client, subscription;
        client = appCont.get('faye');
        // Propagate changes here to app.js.
        subscription = client.subscribe('/alert', function (message) {
          App.alertSubHandler.call(self, message, appCont);
        });
        appCont.set('owner', true);
        appCont.set('alertSub', subscription);

      }).catch(function (jqXHR) {
        self.errorHandler(jqXHR);
      });
    },
    update: function () {
      var self = this;
      this.clearErrors();
      if (this.checkForErrors()) { return; }
      this.get('model').save().then(function (response) {
        toastr.success('Experiment updated', 'Success');
      }).catch(function (jqXHR) {
        self.errorHandler(jqXHR);
      });
    },
    stop: function () {
      var appCont = this.get('controllers.application'),
          self = this;
      
      this.set('stop', new Date());
      this.get('model').save().then(function (response) {
        var id, rec, subscription;
        toastr.success('Experiment stopped', 'Success');
        subscription = appCont.get('alertSub');
        subscription.cancel();
        appCont.set('alertSub', null);
        appCont.setProperties({
          owner: false,
          alerted: false,
          exceededCountLiquid: 0,
          exceededCountGas: 0
        });
        // Allow user to start a new experiment.
        id = appCont.incrementAndGetId();
        rec = self.store.createRecord('experiment', { id: id });
        self.set('content', rec);
        self.clearErrors();
      }).catch(function (jqXHR) {
        self.errorHandler(jqXHR);
      });
    }
  }
});