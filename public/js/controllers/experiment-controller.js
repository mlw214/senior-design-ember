App.ExperimentController = Ember.ObjectController.extend({

  needs: ['application', 'sensors'],

  notOwner: Ember.computed.not('controllers.application.owner'),
  
  noGasBound: Ember.computed.not('gas.bound'),
  noLiquidBound: Ember.computed.not('liquid.bound'),
  noColorBound: Ember.computed.not('color.bound'),

  clearErrors: function () {
    this.setProperties({
      nameError: false,
      rateError: false,
      badGBLower: false,
      badGBUpper: false,
      badLBLower: false,
      badLBUpper: false,
      badCBLower: false,
      badCBUpper: false,
      responseError: false,
      nameErrorMsg: '',
      rateErrorMsg: '',
      badGBLowerMsg: '',
      badGBUpperMsg: '',
      badLBLowerMsg: '',
      badLBUpperMsg: '',
      badCBLowerMsg: '',
      badCBUpperMsg: '',
      responseErrorMsg: ''
    });
  },

  checkForErrors: function () {
    var err = false, boundErr = false, rate;
    if (!this.get('name')) {
      this.set('nameError', true);
      this.set('nameErrorMsg', 'Name is empty');
      err = true;
    }
    rate = parseInt(this.get('rate'), 10);
    if (isNaN(rate)) {
      this.set('rateError', true);
      this.set('rateErrorMsg', 'Not a number');
      err = true;
    } else {
      if (rate <= 0) {
        this.set('rateError', true);
        this.set('rateErrorMsg', 'Must be at least 1');
        err = true;
      }
    }
    boundErr = this.checkBounds();
    if (err || boundErr) {
      this.set('responseError', true);
      this.set('responseErrorMsg',
                'Your submission contains errors. Please fix them.');
    }
    return err || boundErr;
  },

  checkBounds: function () {
    var props = this.getProperties('gas', 'liquid', 'color'),
        gasLower, gasUpper, liquidLower, liquidUpper, 
        colorLower, colorUpper, key, err = false;
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
    if (props.color.bound) {
      colorLower = tinycolor(props.color.lower);
      colorUpper = tinycolor(props.color.upper);
      if (!colorLower.ok) {
        this.set('badCBLower', true);
        this.set('badCBLowerMsg', 'Not a valid color');
        err = true;
      }
      if (!colorUpper.ok) {
        this.set('badCBUpper', true);
        this.set('badCBUpperMsg', 'Not a valid color');
        err = true;
      }
      colorLower = colorLower.toRgb();
      colorUpper = colorUpper.toRgb();

      for (key in colorLower) {
        if (colorLower[key] > colorUpper[key]) {
          this.set('badCBUpper', true);
          this.set('badCBUpperMsg',
                    'Upper bound must be lighter than the lower');
          err = true;
          break;
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
          } else if (errors[i].field === 'colorLower') { 
            this.set('badCBLower', true);
            this.set('badCBLowerMsg', errors[i].error);
          } else if (errors[i].field === 'colorUpper') {
            this.set('badCBUpper', true);
            this.set('badCBUpperMsg', errors[i].error);
          } else if (errors[i].field === 'name') {
            this.set('nameError', true);
            this.set('nameErrorMsg', errors[i].error);
          } else if (errors[i].field === 'rate') {
            this.set('rateError', true);
            this.set('rateErrorMsg', errors[i].error);
          }
        }
        this.set('responseError', true);
        this.set('responseErrorMsg',
                  'Your submission contains errors. Please fix them.');
      } else {
        this.set('responseError', true);
        this.set('responseErrorMsg', jqXHR.responseJSON.error);
      }
    } else {
      this.set('responseError', true);
      this.set('responseErrorMsg', 'The server exploded');
    }
  },

  actions: {
    save: function () {
      var self = this,
          appCont = this.get('controllers.application'),
          sensorsCont = this.get('controllers.sensors');

      this.clearErrors()

      // Basic data verification.
      if (this.checkForErrors()) return;
      // Set id to null. If it isn't Ember will freak that the id changes
      // in the response.
      this.set('id', null);
      this.set('start', new Date());
      this.get('model').save().then(function (response) {
        var client, alertSub, dataSub, dataSubOld;
        client = appCont.get('faye');
        // Propagate changes here to app.js.
        alertSub = client.subscribe('/alert', function (message) {
          App.alertSubHandler.call(self, message, appCont, sensorsCont);
        });
        if (response.get('private')) {
          dataSubOld = appCont.get('dataSub');
          dataSub = client.subscribe('/data-private', function (message) {
            App.dataSubHandler.call(self, message, sensorsCont);
          });
          dataSub.then(function () {
            dataSubOld.cancel();
            appCont.set('dataSub', dataSub);
          });
        }
        appCont.set('owner', true);
        appCont.set('alertSub', alertSub);

      }, function (jqXHR) {
        self.errorHandler(jqXHR);
      });
    },
    update: function () {
      var self = this,
          appCont = this.get('controllers.application'),
          sensorsCont = this.get('controllers.sensors');

      this.clearErrors();
      if (this.checkForErrors()) return;
      this.get('model').save().then(function (response) {
        var client, dataSub, dataSubOld;
        dataSubOld = appCont.get('dataSub');
        client = appCont.get('faye');
        if (response.get('private')) {
          dataSub = client.subscribe('/data-private', function (message) {
            App.dataSubHandler.call(self, message, sensorsCont);
          });
        } else {
          dataSub = client.subscribe('/data', function (message) {
            App.dataSubHandler.call(self, message, sensorsCont);
          });
        }
        dataSub.then(function () {
          dataSubOld.cancel();
          appCont.set('dataSub', dataSub);
          toastr.success('Experiment updated', 'Success');
        });
      }, function (jqXHR) {
        self.errorHandler(jqXHR);
      });
    },
    stop: function () {
      var appCont = this.get('controllers.application'),
          sensorsCont = this.get('controllers.sensors'),
          self = this;
      
      this.set('stop', new Date());
      this.get('model').save().then(function (response) {
        var id, rec, dataSub, dataSubOld, client;
        toastr.success('Experiment stopped', 'Success');
        appCont.get('alertSub').cancel();
        appCont.set('alertSub', null);
        appCont.setProperties({
          owner: false,
          alerted: false,
          exceededCountLiquid: 0,
          exceededCountGas: 0
        });
        if (response.get('private')) {
          dataSubOld = appCont.get('dataSub');
          client = appCont.get('faye');

          dataSub = client.subscribe('/data', function (message) {
            App.dataSubHandler.call(self, message, sensorsCont);
          });
          // Cancel previous subscription once new one is connected.
          // Avoids losing data.
          dataSub.then(function () {
            dataSubOld.cancel();
            appCont.set('dataSub', dataSub);
          });
        }
        // Allow user to start a new experiment.
        id = appCont.incrementAndGetId();
        rec = self.store.createRecord('experiment', { id: id });
        self.set('content', rec);
        self.clearErrors();
      }, function (jqXHR) {
        self.errorHandler(jqXHR);
      });
    }
  }
});