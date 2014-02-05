App.ExperimentController = Ember.ObjectController.extend({

  needs: 'application',

  notOwner: Ember.computed.not('controllers.application.owner'),
  
  notMonitorGas: Ember.computed.not('gas.monitor'),
  notUsedGas: (Ember.computed.not('gas.monitor') &&
                Ember.computed.not('gas.bound')),
  uncheckGasBound: function () {
    if (!this.get('gas.monitor')) {
      this.set('gas.bound', false);
    }
  }.observes('gas.monitor'),

  notMonitorLiquid: Ember.computed.not('liquid.monitor'),
  notUsedLiquid: (Ember.computed.not('liquid.monitor') &&
                  Ember.computed.not('liquid.bound')),
  uncheckLiquidBound: function () {
    if (!this.get('liquid.monitor')) {
      this.set('liquid.bound', false);
    }
  }.observes('liquid.monitor'),

  notMonitorColor: Ember.computed.not('color.monitor'),
  notUsedColor: (Ember.computed.not('color.monitor') &&
                  Ember.computed.not('color.bound')),
  uncheckColorBound: function () {
    if (!this.get('color.monitor')) {
      this.set('color.bound', false);
    }
  }.observes('color.monitor'),

  actions: {
    save: function () {
      var self = this;
      var appCont = this.get('controllers.application');
      this.get('model').save().then(function (response) {
        appCont.set('owner', true);
      }).catch(App.toastrFailCallback);
    },
    update: function () {
      var self = this;
      this.get('model').save().then(function (response) {
        toastr.success('Experiment updated', 'Success');
      }).catch(App.toastrFailCallback);
    },
    stop: function () {
      var appCont = this.get('controllers.application');
      
      this.set('stop', new Date());
      this.get('model').save().then(function (response) {
        toastr.success('Experiment stopped', 'Success');
        appCont.set('owner', false);
      }).catch(App.toastrFailCallback);
    }
  }
});