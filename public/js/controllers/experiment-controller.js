App.ExperimentController = Ember.ObjectController.extend({

  needs: 'application',

  notOwner: Ember.computed.not('controllers.application.owner'),
  
  noGasBound: Ember.computed.not('gas.bound'),
  noLiquidBound: Ember.computed.not('liquid.bound'),
  noColorBound: Ember.computed.not('color.bound'),

  checkBounds: function () {
    this.setProperties({
      badLiquidBounds: false,
      badGasBounds: false
    });
    var props = this.getProperties('gas', 'liquid');
    if (props.gas.bound) {
      if (props.gas.lower >= props.gas.upper) {
        this.set('badGasBounds', true);
        //toastr.error('Upper bound must be greater than the lower', 'Error');
        return false;
      }
    }
    if (props.liquid.bound) {
      if (props.liquid.lower >= props.liquid.upper) {
        this.set('badLiquidBounds', true);
        //toastr.error('Upper bound must be greater than the lower', 'Error');
        return false;
      }
    }
    return true;
  },
  

  actions: {
    save: function () {
      var self = this,
          appCont = this.get('controllers.application');


      // Basic data verification.
      if (!this.checkBounds()) {
        return;
      }
      // Set id to null. If it isn't Ember will freak that the id changes
      // in the response.
      /*this.set('id', null);
      this.set('start', new Date());
      this.get('model').save().then(function (response) {
        appCont.set('owner', true);
      }).catch(App.toastrFailCallback);*/
    },
    update: function () {
      /*var self = this;
      this.get('model').save().then(function (response) {
        toastr.success('Experiment updated', 'Success');
      }).catch(App.toastrFailCallback);*/
      if (!this.checkBounds()) {
        return;
      }
    },
    stop: function () {
      var appCont = this.get('controllers.application'),
          self = this;
      
      this.set('stop', new Date());
      this.get('model').save().then(function (response) {
        var id, rec;
        toastr.success('Experiment stopped', 'Success');
        appCont.set('owner', false);
        // Allow user to start a new experiment.
        id = appCont.incrementAndGetId();
        rec = self.store.createRecord('experiment', { id: id });
        self.set('content', rec);
      }).catch();
    }
  }
});